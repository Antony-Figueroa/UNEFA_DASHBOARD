import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_institution';
const CACHE_PREFIX = 'institutions:';
const CACHE_KEY_LIST = `${CACHE_PREFIX}list`;
const CACHE_KEY_BY_ID = (id: number | string) => `${CACHE_PREFIX}by-id:${id}`;
const CACHE_TTL = 300000; // 5 minutos cache

const INSTITUTION_COLUMNS_TO_AUDIT = [
  'INSTITUTION_NAME', 'INSTITUTION_ADDRESS', 'INSTITUTION_CONTACT',
  'REGION', 'NUCLEUS', 'EXTENSION', 'INSTITUTION_TYPE', 'STATUS', 'RIF'
];

const INSTITUTION_COLUMNS = 'INSTITUTION_ID, INSTITUTION_NAME, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, PRACTICE_TYPE, REGION, NUCLEUS, EXTENSION, CREATION_DATE, INSTITUTION_TYPE, STATUS, RIF';
const INSTITUTION_INTERNSHIP_TYPE_TABLE = 't_institution_internship_type';

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
  // internshipTypeId should come from PRACTICE_TYPE (stored as '1', '2', '3')
  internshipTypeId: i.PRACTICE_TYPE ? String(i.PRACTICE_TYPE) : undefined,
  internshipTypeIds: i.internshipTypeIds || [],
  status: i.STATUS === 1,
  registrationDate: i.CREATION_DATE,
  rif: i.RIF,
  responsibleCount: i.responsibleCount || 0,
  careerIds: (i.careerIds || []).map(String),
  careerNames: i.careerNames || [],
  isInUse: !!i.isInUse,
});

export const getInstitutions = async (req: Request, res: Response) => {
  const { limit: queryLimit, offset: queryOffset } = req.query;
  const intLimit = Math.min(parseInt(queryLimit as string) || 20, 100);
  const intOffset = parseInt(queryOffset as string) || 0;
  const isFullListRequest = queryLimit === undefined && queryOffset === undefined;
  // Use cache only for non-paginated requests (full list for modals, etc.)
  if (isFullListRequest) {
    const cachedData = cacheManager.get(CACHE_KEY_LIST);
    if (cachedData) return res.json(cachedData);
  }

  try {
    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Get paginated institutions + total count
      const countQuery = supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      const dataQuery = supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .order('INSTITUTION_ID', { ascending: true })
        .range(intOffset, intOffset + intLimit - 1);

      const [{ count: total }, { data: institutions, error: instError }] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (instError) {
        console.error('[getInstitutions] Error en consulta principal:', instError);
        throw instError;
      }

      // 2. Fetch relational data only for the paginated institution IDs
      const instIds = (institutions || []).map(i => i.INSTITUTION_ID);

      let respCountMap = new Map<number, number>();
      let careersMap = new Map<number, number[]>();
      let careerNameMap = new Map<number, string>();
      let internshipTypeIdsMap = new Map<number, number[]>();
      let usage = new Set<number>();

      if (instIds.length > 0) {
        const [respPivot, careerPivot, typePivot, practiceData, careerData] = await Promise.all([
          supabase.from('t_institution_manager_institution')
            .select('"INSTITUTION_ID"')
            .in('"INSTITUTION_ID"', instIds),
          supabase.from('t_institution_career')
            .select('INSTITUTION_ID, CAREER_ID')
            .in('INSTITUTION_ID', instIds),
          supabase.from('t_institution_internship_type')
            .select('INSTITUTION_ID, INTERNSHIP_TYPE_ID')
            .in('INSTITUTION_ID', instIds),
          supabase.from('t_professional_practices')
            .select('INSTITUTION_ID')
            .eq('STATUS', 1)
            .in('INSTITUTION_ID', instIds),
          supabase.from('t_career')
            .select('CAREER_ID, CAREER_NAME')
            .eq('STATUS', true)
        ]);

        // Process maps
        (respPivot.data || []).forEach((r: any) => {
          const id = r.INSTITUTION_ID ?? r.institution_id;
          respCountMap.set(id, (respCountMap.get(id) || 0) + 1);
        });

        (careerPivot.data || []).forEach((c: any) => {
          const list = careersMap.get(c.INSTITUTION_ID) || [];
          list.push(c.CAREER_ID);
          careersMap.set(c.INSTITUTION_ID, list);
        });

        (careerData.data || []).forEach((c: any) => {
          careerNameMap.set(c.CAREER_ID, c.CAREER_NAME);
        });

        (typePivot.data || []).forEach((t: any) => {
          const list = internshipTypeIdsMap.get(t.INSTITUTION_ID) || [];
          list.push(t.INTERNSHIP_TYPE_ID);
          internshipTypeIdsMap.set(t.INSTITUTION_ID, list);
        });

        usage = new Set((practiceData.data || []).map((p: any) => p.INSTITUTION_ID));
      }

      // 3. Combine relational data
      const enriched = (institutions || []).map(inst => {
        const careerIds = careersMap.get(inst.INSTITUTION_ID) || [];
        const careerNames = careerIds
          .map((id: number) => careerNameMap.get(id))
          .filter(Boolean) as string[];
        return {
          ...inst,
          responsibleCount: respCountMap.get(inst.INSTITUTION_ID) || 0,
          careerIds,
          careerNames,
          internshipTypeIds: internshipTypeIdsMap.get(inst.INSTITUTION_ID) || [],
          isInUse: usage.has(inst.INSTITUTION_ID)
        };
      });

      // 4. Value list mapping (cacheable lookup data)
      let listValues: any[] = [];
      let internshipTypeNames: Record<string, string> = {};

      try {
        const [listRes, typeRes] = await Promise.all([
          supabase.from('t_value_list').select('NAME, ABBREVIATION').eq('STATUS', 1),
          supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID, NAME').eq('STATUS', 1)
        ]);
        listValues = listRes.data || [];
        (typeRes.data || []).forEach((t: any) => {
          internshipTypeNames[String(t.INTERNSHIP_TYPE_ID)] = t.NAME;
        });
      } catch (err) {
        console.warn('[getInstitutions] Falló carga de mapeos:', err);
      }

      const nameMap: Record<string, string> = {};
      listValues.forEach((v: { NAME: string; ABBREVIATION: string }) => {
        if (v.NAME) nameMap[v.NAME.toUpperCase()] = v.NAME;
        if (v.ABBREVIATION) nameMap[v.ABBREVIATION.toUpperCase()] = v.NAME;
      });

      const getFullName = (val: any) => {
        if (!val) return '';
        return nameMap[String(val).toUpperCase()] || val;
      };

      // 5. Final mapping
      const data = enriched.map(i => {
        const frontend = mapDBToFrontend(i);
        const mainTypeId = i.PRACTICE_TYPE ? String(i.PRACTICE_TYPE) : '';
        const practiceTypeName = internshipTypeNames[mainTypeId] || getFullName(i.PRACTICE_TYPE);
        let pTypes = (frontend.internshipTypeIds || []).map((id: string) => internshipTypeNames[id] || id);
        if (practiceTypeName && !pTypes.includes(practiceTypeName)) {
          if (pTypes.length === 0) pTypes = [practiceTypeName];
          else pTypes.unshift(practiceTypeName);
        }
        return {
          ...frontend,
          region: getFullName(i.REGION),
          nucleus: getFullName(i.NUCLEUS),
          extension: getFullName(i.EXTENSION),
          institutionType: getFullName(i.INSTITUTION_TYPE),
          practiceType: practiceTypeName,
          practiceTypes: pTypes
        };
      });

      return { data, total: total || 0, limit: intLimit, offset: intOffset };
    }, 'getInstitutions');

    // Cache solo para requests no paginados (full list para modales)
    if (queryLimit === undefined && queryOffset === undefined) {
      cacheManager.set(CACHE_KEY_LIST, result, CACHE_TTL);
    }

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
    const cacheKey = CACHE_KEY_BY_ID(instId);

    const cached = cacheManager.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Get main institution record
      const { data: institution, error: instError } = await supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .eq('INSTITUTION_ID', instId)
        .single();

      if (instError) {
        if (instError.code === 'PGRST116') {
          throw new Error(`Institución con ID ${instId} no encontrada`);
        }
        throw instError;
      }

      // 2. Fetch relational data in parallel
      const [
        { data: respPivot },
        { data: careerPivot },
        { data: typePivot },
        { data: practiceData }
      ] = await Promise.all([
        supabase.from('t_institution_manager_institution')
          .select('"INSTITUTION_ID"')
          .eq('"INSTITUTION_ID"', instId),
        supabase.from('t_institution_career')
          .select('CAREER_ID')
          .eq('INSTITUTION_ID', instId),
        supabase.from('t_institution_internship_type')
          .select('INTERNSHIP_TYPE_ID')
          .eq('INSTITUTION_ID', instId),
        supabase.from('t_professional_practices')
          .select('INSTITUTION_ID')
          .eq('INSTITUTION_ID', instId)
          .eq('STATUS', 1)
          .limit(1)
      ]);

      return {
        ...institution,
        responsibleCount: (respPivot || []).length,
        careerIds: (careerPivot || []).map((c: any) => c.CAREER_ID),
        internshipTypeIds: (typePivot || []).map((t: any) => t.INTERNSHIP_TYPE_ID),
        isInUse: (practiceData || []).length > 0
      };
    }, 'getInstitutionById');

    // 2. Get name mappings
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

    // 3. Return mapped result
    const result = {
      ...mapDBToFrontend(data),
      region: getFullName(data.REGION),
      nucleus: getFullName(data.NUCLEUS),
      extension: getFullName(data.EXTENSION),
      institutionType: getFullName(data.INSTITUTION_TYPE),
      practiceType: getFullName(data.PRACTICE_TYPE)
    };

    cacheManager.set(cacheKey, result, CACHE_TTL);

    res.json(result);
  } catch (error: unknown) {
    console.error('[getInstitutionById] Critical Error:', error);
    handleDbError(res, error);
  }
};

export const createInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const i = req.body;
    const normalizedRif = i.rif?.toUpperCase().trim();
    
    // Generar INSTITUTION_CODE único basado en RIF
    const institutionCode = await generateInstitutionCode(normalizedRif);
    
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
      RIF: normalizedRif,
      INSTITUTION_CODE: institutionCode,
      CREATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select(INSTITUTION_COLUMNS)
        .single();

      if (error) throw error;

      // Sincronizar tabla pivote de tipos de práctica
      const internshipTypeId = i.internshipTypeId || i.practiceType;
      if (internshipTypeId) {
        await supabase
          .from(INSTITUTION_INTERNSHIP_TYPE_TABLE)
          .insert([{
            INSTITUTION_ID: inst.INSTITUTION_ID,
            INTERNSHIP_TYPE_ID: parseInt(String(internshipTypeId))
          }]);
      }

      return inst as DBInstitution;
    }, 'createInstitution');

    await auditCreate(req, 't_institution', dbData, INSTITUTION_COLUMNS_TO_AUDIT);

    cacheManager.delete(CACHE_KEY_LIST);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Obtiene una institución por su RIF (legacy, para compatibilidad).
 */
export const getInstitutionByRif = async (req: Request, res: Response) => {
  try {
    const { rif } = req.params;
    
    console.log(`[getInstitutionByRif] Buscando institución con RIF: ${rif}`);
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .eq('RIF', rif.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('[getInstitutionByRif] Error en query:', error);
        throw error;
      }

      return inst;
    }, 'getInstitutionByRif');

    if (!data) {
      console.log(`[getInstitutionByRif] No se encontró institución con RIF: ${rif}`);
      return res.status(404).json({ message: 'Institución no encontrada', data: null });
    }

    console.log(`[getInstitutionByRif] Institución encontrada:`, data.INSTITUTION_ID);
    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    console.error('[getInstitutionByRif] Error:', error);
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
        .select(INSTITUTION_COLUMNS)
        .eq('INSTITUTION_ID', id)
        .single();

      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('INSTITUTION_ID', id)
        .select(INSTITUTION_COLUMNS)
        .single();

      if (error) throw error;

      // Sincronizar tabla pivote de tipos de práctica
      const internshipTypeId = i.internshipTypeId || i.practiceType;
      if (internshipTypeId) {
        // Primero eliminamos existentes
        await supabase
          .from(INSTITUTION_INTERNSHIP_TYPE_TABLE)
          .delete()
          .eq('INSTITUTION_ID', parseInt(id));
          
        // Luego insertamos la actual
        await supabase
          .from(INSTITUTION_INTERNSHIP_TYPE_TABLE)
          .insert([{
            INSTITUTION_ID: parseInt(id),
            INTERNSHIP_TYPE_ID: parseInt(String(internshipTypeId))
          }]);
      }

      if (oldData) {
        await auditUpdate(req, 't_institution', oldData as Record<string, any>, dbData, INSTITUTION_COLUMNS_TO_AUDIT);
      }

      return inst as DBInstitution;
    }, 'updateInstitution');

    cacheManager.delete(CACHE_KEY_LIST);
    cacheManager.delete(CACHE_KEY_BY_ID(id));

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
        .select(INSTITUTION_COLUMNS)
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

    cacheManager.delete(CACHE_KEY_LIST);
    cacheManager.delete(CACHE_KEY_BY_ID(id));

    res.status(204).send();
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'BUSINESS_RULE_VIOLATION') {
      return res.status(400).json({ message: err.message });
    }
    handleDbError(res, error);
  }
};

/**
 * Genera un INSTITUTION_CODE único basado en el RIF.
 * Si ya existe una institución con ese RIF, agrega sufijo secuencial (-001, -002, etc.)
 */
const generateInstitutionCode = async (rif: string): Promise<string> => {
  const normalizedRif = rif.toUpperCase().trim();
  
  // Buscar instituciones con este RIF usando dbManager
  const existing = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('INSTITUTION_CODE')
      .like('INSTITUTION_CODE', `${normalizedRif}%`)
      .order('INSTITUTION_CODE', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[generateInstitutionCode] Error buscando:', error);
      throw error;
    }
    return data;
  }, 'generateInstitutionCode');

  if (!existing || existing.length === 0) {
    // Primera institución con este RIF
    return normalizedRif;
  }

  // Encontrar el siguiente número secuencial
  let maxSeq = 0;
  for (const inst of existing) {
    const code = inst.INSTITUTION_CODE;
    if (code === normalizedRif) {
      maxSeq = Math.max(maxSeq, 0);
    } else {
      // Formato: J-30123456-001
      const match = code.match(/-(\d{3})$/);
      if (match) {
        maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
      }
    }
  }

  // Generar siguiente código
  const nextSeq = maxSeq + 1;
  return `${normalizedRif}-${nextSeq.toString().padStart(3, '0')}`;
};

/**
 * Verifica si un RIF ya existe y devuelve las instituciones con ese RIF.
 * Endpoint para validar antes de crear.
 */
export const checkRifExists = async (req: Request, res: Response) => {
  try {
    const { rif } = req.params;
    const normalizedRif = rif.toUpperCase().trim();
    
    console.log(`[checkRifExists] Verificando RIF: ${normalizedRif}`);
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: institutions, error } = await supabase
        .from(TABLE_NAME)
        .select('INSTITUTION_ID, INSTITUTION_NAME, RIF, INSTITUTION_CODE, STATUS')
        .eq('RIF', normalizedRif)
        .order('INSTITUTION_ID', { ascending: true });

      if (error) throw error;
      return institutions;
    }, 'checkRifExists');

    const exists = data && data.length > 0;
    
    // Generar código sugerido para crear nueva institución
    const suggestedCode = exists 
      ? await generateInstitutionCode(normalizedRif)
      : normalizedRif;
    
    console.log(`[checkRifExists] RIF ${normalizedRif}: ${exists ? 'ya existe' : 'disponible'}`);
    
    res.json({
      exists,
      rif: normalizedRif,
      institutions: data || [],
      suggestedCode
    });
  } catch (error: unknown) {
    console.error('[checkRifExists] Error:', error);
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
        .select(INSTITUTION_COLUMNS)
        .single();

      if (error) throw error;

      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_institution', id, oldData.STATUS, status ? 1 : 0);
      }

      return inst as DBInstitution;
    }, 'toggleInstitutionStatus');

    cacheManager.delete(CACHE_KEY_LIST);
    cacheManager.delete(CACHE_KEY_BY_ID(id));

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

    const instId = parseInt(id);
    cacheManager.delete(CACHE_KEY_LIST);
    cacheManager.delete(CACHE_KEY_BY_ID(instId));

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

function ArrayOfCareers(careers: unknown): boolean {
  return Array.isArray(careers) && careers.every(c => typeof c === 'number' || typeof c === 'string');
}
