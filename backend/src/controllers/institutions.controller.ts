import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_institution';
const CACHE_PREFIX = 'institutions:';
const CACHE_TTL = 300000; // 5 minutos cache

const INSTITUTION_COLUMNS_TO_AUDIT = [
  'INSTITUTION_NAME', 'INSTITUTION_ADDRESS', 'INSTITUTION_CONTACT',
  'REGION', 'NUCLEUS', 'EXTENSION', 'INSTITUTION_TYPE', 'STATUS', 'RIF'
];

const INSTITUTION_COLUMNS = 'INSTITUTION_ID, INSTITUTION_NAME, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, PRACTICE_TYPE, CAREER_ID, REGION, NUCLEUS, EXTENSION, CREATION_DATE, INSTITUTION_TYPE, STATUS, RIF';

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as AppError;
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '404') {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

interface DBInstitution {
  INSTITUTION_ID: number;
  INSTITUTION_NAME: string;
  INSTITUTION_ADDRESS: string;
  INSTITUTION_CONTACT: string;
  REGION: string;
  NUCLEUS: string;
  EXTENSION: string;
  CREATION_DATE: string;
  INSTITUTION_TYPE: string;
  PRACTICE_TYPE: string;
  CAREER_ID: number;
  STATUS: number;
  RIF: string;
  t_professional_practices?: { INSTITUTION_ID: number }[];
  responsibleCount?: number;
  careerIds?: number[];
}

const mapDBToFrontend = (i: any) => ({
  institutionId: String(i.INSTITUTION_ID),
  name: i.INSTITUTION_NAME,
  fiscalAddress: i.INSTITUTION_ADDRESS,
  phone: i.INSTITUTION_CONTACT,
  region: i.REGION, // This will be replaced by getFullName later in getInstitutions
  nucleus: i.NUCLEUS, // This will be replaced by getFullName later in getInstitutions
  extension: i.EXTENSION, // This will be replaced by getFullName later in getInstitutions
  institutionType: i.INSTITUTION_TYPE, // This will be replaced by getFullName later in getInstitutions
  practiceTypes: i.PRACTICE_TYPE ? [i.PRACTICE_TYPE] : [],
  // Support both single internshipTypeId (from main table) and array (from pivot)
  internshipTypeId: i.INTERNSHIP_TYPE_ID ? String(i.INTERNSHIP_TYPE_ID) : 
                  (i.internshipTypeIds && i.internshipTypeIds.length > 0 ? String(i.internshipTypeIds[0]) : undefined),
  internshipTypeIds: i.internshipTypeIds || [],
  status: i.STATUS === 1,
  registrationDate: i.CREATION_DATE,
  rif: i.RIF,
  responsibleCount: i.responsibleCount || 0,
  careerIds: (i.careerIds || []).map(String),
  isInUse: !!i.isInUse,
});

export const getInstitutions = async (_req: Request, res: Response) => {
  const cacheKey = `${CACHE_PREFIX}list`;
  try {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const data = await dbManager.withRetry(async (supabase) => {
      console.log('[getInstitutions] Inicia consulta principal a table:', TABLE_NAME);
      
      // 1. Fetch main table with select * to avoid column typos
      const { data: institutions, error: instError } = await supabase
        .from(TABLE_NAME)
        .select('*');

      if (instError) {
        console.error('[getInstitutions] Error en consulta principal:', instError);
        throw instError;
      }

      console.log(`[getInstitutions] Obtenidas ${institutions?.length || 0} instituciones`);

      // 2. Fetch relational data sequentially for easier debugging
      // AHORA: Usamos la tabla pivote para responsables y tipos de práctica
      let responsibles: any[] = [];
      try {
        const { data: respData, error: respError } = await supabase
          .from('t_institution_manager_institution')
          .select('"INSTITUTION_ID"');
        if (!respError) responsibles = respData || [];
      } catch (err) { console.warn('[getInstitutions] Error silenciado en responsibles:', err); }

      let careers: any[] = [];
      try {
        const { data: careerData, error: careerError } = await supabase
          .from('t_institution_career')
          .select('INSTITUTION_ID, CAREER_ID');
        if (!careerError) careers = careerData || [];
      } catch (err) { console.warn('[getInstitutions] Error silenciado en careers:', err); }

      // NUEVO: Obtener tipos de práctica por institución
      let internshipTypes: any[] = [];
      try {
        const { data: typeData, error: typeError } = await supabase
          .from('t_institution_internship_type')
          .select('INSTITUTION_ID, INTERNSHIP_TYPE_ID');
        if (!typeError) internshipTypes = typeData || [];
      } catch (err) { console.warn('[getInstitutions] Error silenciado en internshipTypes:', err); }

      let usage: Set<number> = new Set();
      try {
        const { data: practiceData, error: practiceError } = await supabase
          .from('t_professional_practices')
          .select('INSTITUTION_ID')
          .eq('STATUS', 1);
        if (!practiceError) usage = new Set((practiceData || []).map((p: any) => p.INSTITUTION_ID));
      } catch (err) { console.warn('[getInstitutions] Error silenciado en usage:', err); }

      // 3. Process maps
      const respCountMap = new Map<number, number>();
      responsibles.forEach((r: any) => {
        const count = respCountMap.get(r.INSTITUTION_ID) || 0;
        respCountMap.set(r.INSTITUTION_ID, count + 1);
      });

      const careersMap = new Map<number, number[]>();
      careers.forEach((c: any) => {
        const list = careersMap.get(c.INSTITUTION_ID) || [];
        list.push(c.CAREER_ID);
        careersMap.set(c.INSTITUTION_ID, list);
      });

      // NUEVO: Mapa de tipos de práctica
      const internshipTypeIdsMap = new Map<number, number[]>();
      internshipTypes.forEach((t: any) => {
        const list = internshipTypeIdsMap.get(t.INSTITUTION_ID) || [];
        list.push(t.INTERNSHIP_TYPE_ID);
        internshipTypeIdsMap.set(t.INSTITUTION_ID, list);
      });

      // 4. Combine
      return (institutions || []).map(inst => ({
        ...inst,
        responsibleCount: respCountMap.get(inst.INSTITUTION_ID) || 0,
        careerIds: careersMap.get(inst.INSTITUTION_ID) || [],
        internshipTypeIds: internshipTypeIdsMap.get(inst.INSTITUTION_ID) || [],
        isInUse: usage.has(inst.INSTITUTION_ID)
      }));
    }, 'getInstitutions');

    // 5. Value list for mapping
    let listValues: any[] = [];
    try {
      const response = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_value_list')
          .select('NAME, ABBREVIATION')
          .eq('STATUS', 1);
        if (error) throw error;
        return data;
      }, 'getListValuesForMapping');
      listValues = response || [];
    } catch (err) { 
      console.warn('[getInstitutions] Falló carga de t_value_list, se usarán valores crudos:', err);
    }

    const nameMap: Record<string, string> = {};
    listValues.forEach((v: { NAME: string; ABBREVIATION: string }) => {
      if (v.NAME) nameMap[v.NAME.toUpperCase()] = v.NAME;
      if (v.ABBREVIATION) nameMap[v.ABBREVIATION.toUpperCase()] = v.NAME;
    });

    const getFullName = (val: any) => {
      if (!val) return '';
      const sVal = String(val).toUpperCase();
      return nameMap[sVal] || val;
    };

    // 6. Final Result
    const result = data.map(i => ({
      ...mapDBToFrontend(i),
      region: getFullName(i.REGION),
      nucleus: getFullName(i.NUCLEUS),
      extension: getFullName(i.EXTENSION),
      institutionType: getFullName(i.INSTITUTION_TYPE),
      practiceType: getFullName(i.PRACTICE_TYPE)
    }));
    
    cacheManager.set(cacheKey, result, CACHE_TTL);
    res.json(result);
  } catch (error: unknown) {
    console.error('[getInstitutions] Critical Error:', error);
    handleDbError(res, error);
  }
};

export const getInstitutionStats = async (_req: Request, res: Response) => {
  try {
    const stats = await dbManager.withRetry(async (supabase) => {
      const totalQuery = supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true });
      const activeQuery = supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('STATUS', 1);

      const [totalRes, activeRes] = await Promise.all([totalQuery, activeQuery]);

      return {
        total: totalRes.count || 0,
        active: activeRes.count || 0
      };
    }, 'getInstitutionStats');

    res.json(stats);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getInstitutionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const instId = parseInt(id);

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Fetch main table (using select * to be safe)
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('INSTITUTION_ID', instId)
        .single();

      if (error) throw error;

      // 2. Parallel queries for relational data
      // Ahora usamos la tabla pivote para responsables e internship types
      const [{ data: respPivot }, { data: careers }, { data: internshipTypes }, { count: practiceCount }] = await Promise.all([
        // Contar responsibles desde la tabla pivote
        supabase.from('t_institution_manager_institution')
          .select('"MANAGER_ID"', { count: 'exact', head: true })
          .eq('"INSTITUTION_ID"', instId),
        // Obtener carreras asociadas
        supabase.from('t_institution_career').select('CAREER_ID').eq('INSTITUTION_ID', instId),
        // Obtener tipos de práctica asociados
        supabase.from('t_institution_internship_type').select('INTERNSHIP_TYPE_ID').eq('INSTITUTION_ID', instId),
        // Contar prácticas activas
        supabase.from('t_professional_practices').select('INSTITUTION_ID', { count: 'exact', head: true }).eq('INSTITUTION_ID', instId).eq('STATUS', 1).limit(1)
      ]);

      return {
        ...inst,
        responsibleCount: (respPivot?.length || 0),
        careerIds: (careers || []).map((c: any) => c.CAREER_ID),
        internshipTypeIds: (internshipTypes || []).map((t: any) => t.INTERNSHIP_TYPE_ID),
        isInUse: (practiceCount || 0) > 0
      };
    }, 'getInstitutionById');

    // 3. Get name mappings
    let listValues: any[] = [];
    try {
      const response = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_value_list')
          .select('NAME, ABBREVIATION')
          .eq('STATUS', 1);
        if (error) throw error;
        return data;
      }, 'getListValuesForMappingById');
      listValues = response || [];
    } catch (err) {
      console.warn('[getInstitutionById] Names mapping failed, using raw IDs:', err);
    }

    const nameMap: Record<string, string> = {};
    listValues.forEach((v: { NAME: string; ABBREVIATION: string }) => {
      if (v.NAME) nameMap[v.NAME.toUpperCase()] = v.NAME;
      if (v.ABBREVIATION) nameMap[v.ABBREVIATION.toUpperCase()] = v.NAME;
    });

    const getFullName = (val: any) => {
      if (!val) return '';
      const sVal = String(val).toUpperCase();
      return nameMap[sVal] || val;
    };

    // 4. Return mapped result
    const result = {
      ...mapDBToFrontend(data),
      region: getFullName(data.REGION),
      nucleus: getFullName(data.NUCLEUS),
      extension: getFullName(data.EXTENSION),
      institutionType: getFullName(data.INSTITUTION_TYPE),
      practiceType: getFullName(data.PRACTICE_TYPE)
    };

    res.json(result);
  } catch (error: unknown) {
    console.error('[getInstitutionById] Critical Error:', error);
    handleDbError(res, error);
  }
};

export const createInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const i = req.body;
    const dbData: Record<string, any> = {
      INSTITUTION_NAME: i.name,
      INSTITUTION_ADDRESS: i.fiscalAddress,
      INSTITUTION_CONTACT: i.phone,
      REGION: i.region,
      NUCLEUS: i.nucleus,
      EXTENSION: i.extension,
      INSTITUTION_TYPE: i.institutionType,
      PRACTICE_TYPE: i.internshipTypeId || i.practiceType || '1', // Manejar ambos nombres por compatibilidad
      STATUS: i.status ? 1 : 0,
      RIF: i.rif,
      CREATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select('*')
        .single();

      if (error) throw error;

      return inst as DBInstitution;
    }, 'createInstitution');

    await auditCreate(req, 't_institution', dbData, INSTITUTION_COLUMNS_TO_AUDIT);

    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const i = req.body;
    const dbData: Partial<DBInstitution> = {};
    
    if (i.name !== undefined) dbData.INSTITUTION_NAME = i.name;
    if (i.fiscalAddress !== undefined) dbData.INSTITUTION_ADDRESS = i.fiscalAddress;
    if (i.phone !== undefined) dbData.INSTITUTION_CONTACT = i.phone;
    if (i.region !== undefined) dbData.REGION = i.region;
    if (i.nucleus !== undefined) dbData.NUCLEUS = i.nucleus;
    if (i.extension !== undefined) dbData.EXTENSION = i.extension;
    if (i.institutionType !== undefined) dbData.INSTITUTION_TYPE = i.institutionType;
    if (i.practiceType !== undefined) dbData.PRACTICE_TYPE = i.practiceType;
    if (i.internshipTypeId !== undefined) dbData.PRACTICE_TYPE = i.internshipTypeId;
    if (i.status !== undefined) dbData.STATUS = i.status ? 1 : 0;
    if (i.rif !== undefined) dbData.RIF = i.rif;

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('INSTITUTION_ID', id)
        .single();

      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('INSTITUTION_ID', id)
        .select('*')
        .single();

      if (error) throw error;

      if (oldData) {
        await auditUpdate(req, 't_institution', oldData as Record<string, any>, dbData, INSTITUTION_COLUMNS_TO_AUDIT);
      }

      return inst as DBInstitution;
    }, 'updateInstitution');

    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'BUSINESS_RULE_VIOLATION') {
      return res.status(400).json({ message: err.message });
    }
    handleDbError(res, error);
  }
};

export const deleteInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await dbManager.withRetry(async (supabase) => {
      const { count, error: countError } = await supabase
        .from('t_institution_manager')
        .select('*', { count: 'exact', head: true })
        .eq('INSTITUTION_ID', id)
        .eq('STATUS', 1);

      if (countError) throw countError;

      if (count && count > 0) {
        console.warn(`[Institutions] Intento fallido de eliminación: La institución ID ${id} tiene ${count} responsables asignados.`);
        throw { 
          code: 'BUSINESS_RULE_VIOLATION', 
          message: 'No se puede eliminar la institución porque tiene responsables asignados' 
        };
      }

      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('INSTITUTION_ID', id)
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('INSTITUTION_ID', id);

      if (error) throw error;

      if (oldData) {
        await auditStatusChange(req, 't_institution', id, oldData.STATUS, 0);
      }
    }, 'deleteInstitution');

    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(204).send();
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'BUSINESS_RULE_VIOLATION') {
      return res.status(400).json({ message: err.message });
    }
    handleDbError(res, error);
  }
};

export const getInstitutionByRif = async (req: Request, res: Response) => {
  try {
    const { rif } = req.params;
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .eq('RIF', rif.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return inst as DBInstitution;
    }, 'getInstitutionByRif');

    if (!data) {
      return res.status(404).json({ message: 'Institución no encontrada', data: null });
    }

    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const toggleInstitutionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const data = await dbManager.withRetry(async (supabase) => {
      if (!status) {
        const { count, error: countError } = await supabase
          .from('t_institution_manager')
          .select('*', { count: 'exact', head: true })
          .eq('INSTITUTION_ID', id)
          .eq('STATUS', 1);

        if (countError) throw countError;

        if (count && count > 0) {
          console.warn(`[Institutions] Intento fallido de desactivación: La institución ID ${id} tiene ${count} responsables asignados.`);
          throw { 
            code: 'BUSINESS_RULE_VIOLATION', 
            message: 'No se puede eliminar la institución porque tiene responsables asignados' 
          };
        }
      }

      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('STATUS')
        .eq('INSTITUTION_ID', id)
        .single();

      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('INSTITUTION_ID', id)
        .select('*')
        .single();

      if (error) throw error;

      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_institution', id, oldData.STATUS, status ? 1 : 0);
      }

      return inst as DBInstitution;
    }, 'toggleInstitutionStatus');

    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'BUSINESS_RULE_VIOLATION') {
      return res.status(400).json({ message: err.message });
    }
    handleDbError(res, error);
  }
};

const INSTITUTION_CAREER_TABLE = 't_institution_career';

export const getInstitutionCareers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: institutionCareers, error } = await supabase
        .from(INSTITUTION_CAREER_TABLE)
        .select('CAREER_ID')
        .eq('INSTITUTION_ID', parseInt(id));

      if (error) throw error;

      if (!institutionCareers || institutionCareers.length === 0) {
        return [];
      }

      const careerIds = institutionCareers.map(ic => ic.CAREER_ID);
      
      const { data: careers, error: careersError } = await supabase
        .from('t_career')
        .select('CAREER_ID, CAREER_NAME')
        .in('CAREER_ID', careerIds);

      if (careersError) throw careersError;

      return (careers || []).map(c => ({
        careerId: String(c.CAREER_ID),
        name: c.CAREER_NAME
      }));
    }, 'getInstitutionCareers');

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateInstitutionCareers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { careers } = req.body;

    if (!ArrayOfCareers(careers)) {
      return res.status(400).json({ message: 'El formato de carreras es inválido. Se esperaba un array de IDs de carreras.' });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      const { error: deleteError } = await supabase
        .from(INSTITUTION_CAREER_TABLE)
        .delete()
        .eq('INSTITUTION_ID', parseInt(id));

      if (deleteError) throw deleteError;

      if (careers && careers.length > 0) {
        const institutionCareers = careers.map((careerId: number) => ({
          INSTITUTION_ID: parseInt(id),
          CAREER_ID: careerId
        }));

        const { error: insertError } = await supabase
          .from(INSTITUTION_CAREER_TABLE)
          .insert(institutionCareers);

        if (insertError) throw insertError;
      }

      return { success: true };
    }, 'updateInstitutionCareers');

    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

function ArrayOfCareers(careers: unknown): boolean {
  return Array.isArray(careers) && careers.every(c => typeof c === 'number' || typeof c === 'string');
}
