import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_institution';
const CAREER_RELATION_TABLE = 't_institution_career';
const CACHE_PREFIX = 'institutions:';
const CACHE_TTL = 3600000;

const INSTITUTION_COLUMNS_TO_AUDIT = [
  'INSTITUTION_NAME', 'INSTITUTION_ADDRESS', 'INSTITUTION_CONTACT', 'PRACTICE_TYPE',
  'REGION', 'NUCLEUS', 'EXTENSION', 'INSTITUTION_TYPE', 'STATUS', 'RIF'
];

const INSTITUTION_COLUMNS = 'INSTITUTION_ID, INSTITUTION_NAME, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, PRACTICE_TYPE, REGION, NUCLEUS, EXTENSION, CREATION_DATE, INSTITUTION_TYPE, STATUS, RIF, t_professional_practices(INSTITUTION_ID)';

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
  PRACTICE_TYPE: string;
  REGION: string;
  NUCLEUS: string;
  EXTENSION: string;
  CREATION_DATE: string;
  INSTITUTION_TYPE: string;
  STATUS: number;
  RIF: string;
  t_professional_practices?: { INSTITUTION_ID: number }[];
  responsibleCount?: number;
  careers?: { CAREER_ID: number; CAREER_NAME: string }[];
}

const mapDBToFrontend = (i: DBInstitution) => ({
  institutionId: String(i.INSTITUTION_ID),
  rif: i.RIF,
  name: i.INSTITUTION_NAME,
  fiscalAddress: i.INSTITUTION_ADDRESS,
  phone: i.INSTITUTION_CONTACT,
  practiceType: i.PRACTICE_TYPE,
  careerIds: i.careers?.map(c => String(c.CAREER_ID)) || [],
  careerNames: i.careers?.map(c => c.CAREER_NAME).join(', ') || '',
  region: i.REGION,
  nucleus: i.NUCLEUS,
  extension: i.EXTENSION,
  institutionType: i.INSTITUTION_TYPE,
  status: i.STATUS === 1,
  registrationDate: i.CREATION_DATE,
  responsibleCount: i.responsibleCount || 0,
  isInUse: Array.isArray(i.t_professional_practices) && i.t_professional_practices.length > 0
});

export const getInstitutions = async (_req: Request, res: Response) => {
  const cacheKey = `${CACHE_PREFIX}list`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: institutions, error: instError } = await supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .order('INSTITUTION_NAME', { ascending: true });

      if (instError) throw instError;

      const { data: careerRelations, error: relError } = await supabase
        .from(CAREER_RELATION_TABLE)
        .select('INSTITUTION_ID, CAREER_ID, t_career(CAREER_ID, CAREER_NAME)');

      if (relError) throw relError;

      const { data: responsibles, error: respError } = await supabase
        .from('t_institution_manager')
        .select('INSTITUTION_ID')
        .eq('STATUS', 1);

      if (respError) throw respError;

      const careerMap = new Map<number, { CAREER_ID: number; CAREER_NAME: string }[]>();
      (careerRelations || []).forEach((rel: any) => {
        const instId = rel.INSTITUTION_ID;
        const career = rel.t_career;
        if (!careerMap.has(instId)) {
          careerMap.set(instId, []);
        }
        if (career) {
          careerMap.get(instId)!.push({
            CAREER_ID: career.CAREER_ID,
            CAREER_NAME: career.CAREER_NAME
          });
        }
      });

      const respCountMap = new Map<number, number>();
      (responsibles || []).forEach((r: any) => {
        const count = respCountMap.get(r.INSTITUTION_ID) || 0;
        respCountMap.set(r.INSTITUTION_ID, count + 1);
      });

      return (institutions || []).map(inst => ({
        ...inst,
        careers: careerMap.get(inst.INSTITUTION_ID) || [],
        responsibleCount: respCountMap.get(inst.INSTITUTION_ID) || 0
      })) as DBInstitution[];
    }, 'getInstitutions');

    const { data: listValues } = await dbManager.withRetry(async (supabase) => {
      return await supabase
        .from('t_value_list')
        .select('NAME, ABBREVIATION')
        .eq('STATUS', 1);
    }, 'getListValuesForMapping');

    const nameMap: Record<string, string> = {};
    if (listValues) {
      listValues.forEach((v: { NAME: string; ABBREVIATION: string }) => {
        if (v.NAME) {
          nameMap[v.NAME.toUpperCase()] = v.NAME;
        }
        if (v.ABBREVIATION) {
          nameMap[v.ABBREVIATION.toUpperCase()] = v.NAME;
        }
      });
    }

    const getFullName = (val: string | undefined) => {
      if (!val) return '';
      return nameMap[val.toUpperCase()] || val;
    };

    const result = data.map(i => ({
      ...mapDBToFrontend(i),
      region: getFullName(i.REGION),
      nucleus: getFullName(i.NUCLEUS),
      extension: getFullName(i.EXTENSION),
      institutionType: getFullName(i.INSTITUTION_TYPE)
    }));
    
    cacheManager.set(cacheKey, result, CACHE_TTL);

    res.json(result);
  } catch (error: unknown) {
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
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .eq('INSTITUTION_ID', parseInt(id))
        .single();

      if (error) throw error;

      const { data: careerRelations, error: relError } = await supabase
        .from(CAREER_RELATION_TABLE)
        .select('CAREER_ID, t_career(CAREER_ID, CAREER_NAME)')
        .eq('INSTITUTION_ID', parseInt(id));

      if (relError) throw relError;

      const careers = (careerRelations || [])
        .map((rel: any) => rel.t_career)
        .filter(Boolean)
        .map((c: any) => ({ CAREER_ID: c.CAREER_ID, CAREER_NAME: c.CAREER_NAME }));

      return {
        ...inst,
        careers
      } as DBInstitution;
    }, 'getInstitutionById');

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
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
      PRACTICE_TYPE: i.practiceType,
      REGION: i.region,
      NUCLEUS: i.nucleus,
      EXTENSION: i.extension,
      INSTITUTION_TYPE: i.institutionType,
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

      const careerIds = i.careerIds || [];
      const careers: { CAREER_ID: number; CAREER_NAME: string }[] = [];

      if (careerIds.length > 0) {
        const relations = careerIds.map((cid: string) => ({
          INSTITUTION_ID: inst.INSTITUTION_ID,
          CAREER_ID: parseInt(cid)
        }));

        const { error: relError } = await supabase
          .from(CAREER_RELATION_TABLE)
          .insert(relations);

        if (relError) throw relError;

        const { data: careerData } = await supabase
          .from('t_career')
          .select('CAREER_ID, CAREER_NAME')
          .in('CAREER_ID', careerIds.map((cid: string) => parseInt(cid)));

        if (careerData) {
          careers.push(...careerData);
        }
      }

      return {
        ...inst,
        careers
      } as DBInstitution;
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
    if (i.practiceType !== undefined) dbData.PRACTICE_TYPE = i.practiceType;
    if (i.region !== undefined) dbData.REGION = i.region;
    if (i.nucleus !== undefined) dbData.NUCLEUS = i.nucleus;
    if (i.extension !== undefined) dbData.EXTENSION = i.extension;
    if (i.institutionType !== undefined) dbData.INSTITUTION_TYPE = i.institutionType;
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

      let careers: { CAREER_ID: number; CAREER_NAME: string }[] = [];

      if (i.careerIds !== undefined) {
        await supabase
          .from(CAREER_RELATION_TABLE)
          .delete()
          .eq('INSTITUTION_ID', id);

        if (i.careerIds.length > 0) {
          const relations = i.careerIds.map((cid: string) => ({
            INSTITUTION_ID: parseInt(id),
            CAREER_ID: parseInt(cid)
          }));

          const { error: relError } = await supabase
            .from(CAREER_RELATION_TABLE)
            .insert(relations);

          if (relError) throw relError;

          const { data: careerData } = await supabase
            .from('t_career')
            .select('CAREER_ID, CAREER_NAME')
            .in('CAREER_ID', i.careerIds.map((cid: string) => parseInt(cid)));

          if (careerData) {
            careers = careerData;
          }
        }
      } else {
        const { data: careerRelations } = await supabase
          .from(CAREER_RELATION_TABLE)
          .select('CAREER_ID, t_career(CAREER_ID, CAREER_NAME)')
          .eq('INSTITUTION_ID', parseInt(id));

        careers = (careerRelations || [])
          .map((rel: any) => rel.t_career)
          .filter(Boolean)
          .map((c: any) => ({ CAREER_ID: c.CAREER_ID, CAREER_NAME: c.CAREER_NAME }));
      }

      return {
        ...inst,
        careers
      } as DBInstitution;
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

      const { data: careerRelations } = await supabase
        .from(CAREER_RELATION_TABLE)
        .select('CAREER_ID, t_career(CAREER_ID, CAREER_NAME)')
        .eq('INSTITUTION_ID', parseInt(id));

      const careers = (careerRelations || [])
        .map((rel: any) => rel.t_career)
        .filter(Boolean)
        .map((c: any) => ({ CAREER_ID: c.CAREER_ID, CAREER_NAME: c.CAREER_NAME }));

      return {
        ...inst,
        careers
      } as DBInstitution;
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
