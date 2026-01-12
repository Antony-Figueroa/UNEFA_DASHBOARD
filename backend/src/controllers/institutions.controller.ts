import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager';
import { cacheManager } from '../lib/cache-manager';

const TABLE_NAME = 't_institution';
const CACHE_PREFIX = 'institutions:';
const CACHE_TTL = 3600000; // 1 hour for institutions
const INSTITUTION_COLUMNS = 'INSTITUTION_ID, INSTITUTION_NAME, INSTITUTION_ADDRESS, INSTITUTION_CONTACT, PRACTICE_TYPE, REGION, NUCLEUS, EXTENSION, CREATION_DATE, INSTITUTION_TYPE, STATUS, RIF, CAREER_ID';

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
  CAREER_ID: number;
  t_career?: {
    NAME: string;
  };
  responsibleCount?: number;
}

const mapDBToFrontend = (i: DBInstitution) => ({
  institutionId: String(i.INSTITUTION_ID),
  rif: i.RIF,
  name: i.INSTITUTION_NAME,
  fiscalAddress: i.INSTITUTION_ADDRESS,
  phone: i.INSTITUTION_CONTACT,
  practiceType: i.PRACTICE_TYPE,
  careerId: String(i.CAREER_ID),
  careerName: i.t_career?.NAME,
  region: i.REGION,
  nucleus: i.NUCLEUS,
  extension: i.EXTENSION,
  institutionType: i.INSTITUTION_TYPE,
  status: i.STATUS === 1,
  registrationDate: i.CREATION_DATE,
  responsibleCount: i.responsibleCount || 0
});

export const getInstitutions = async (_req: Request, res: Response) => {
  const cacheKey = `${CACHE_PREFIX}list`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // Fetch institutions con proyección específica
      const { data: institutions, error: instError } = await supabase
        .from(TABLE_NAME)
        .select(INSTITUTION_COLUMNS)
        .order('INSTITUTION_NAME', { ascending: true });

      if (instError) throw instError;

      // Fetch all careers to map names
      const { data: careers, error: careerError } = await supabase
        .from('t_career')
        .select('CAREER_ID, CAREER_NAME');

      if (careerError) throw careerError;

      // Fetch active responsibles counts
      const { data: responsibles, error: respError } = await supabase
        .from('t_institution_manager')
        .select('INSTITUTION_ID')
        .eq('STATUS', 1);

      if (respError) throw respError;

      // Map career names and responsible counts to institutions
      const mappedInstitutions = (institutions || []).map(inst => {
        const career = (careers || []).find(c => c.CAREER_ID === inst.CAREER_ID);
        const respCount = (responsibles || []).filter(r => r.INSTITUTION_ID === inst.INSTITUTION_ID).length;
        
        return {
          ...inst,
          t_career: career ? { NAME: career.CAREER_NAME } : undefined,
          responsibleCount: respCount
        };
      });

      return mappedInstitutions as DBInstitution[];
    }, 'getInstitutions');

    const result = data.map(mapDBToFrontend);
    cacheManager.set(cacheKey, result, CACHE_TTL);

    res.json(result);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createInstitution = async (req: Request, res: Response) => {
  try {
    const i = req.body;
    const dbData = {
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
      CAREER_ID: parseInt(i.careerId),
      CREATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Insert into t_institution
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select('*')
        .single();

      if (error) throw error;

      // Fetch career name manually since there's no FK relationship
      let careerName: string | undefined;
      if (inst.CAREER_ID) {
        const { data: career } = await supabase
          .from('t_career')
          .select('CAREER_NAME')
          .eq('CAREER_ID', inst.CAREER_ID)
          .single();
        if (career) careerName = career.CAREER_NAME;
      }

      // 2. Insert into t_institution_career (Requirement: Integrate 4 tables)
      await supabase.from('t_institution_career').insert([{
        institution_id: inst.INSTITUTION_ID,
        career_id: inst.CAREER_ID,
        status: 1
      }]);

      // 3. Insert into t_institution_practice_type (Requirement: Integrate 4 tables)
      // We need to find the practice_type_id first if it's a string name
      const { data: practiceType } = await supabase
        .from('t_internship_type')
        .select('INTERNSHIP_TYPE_ID')
        .eq('NAME', i.practiceType)
        .single();

      if (practiceType) {
        await supabase.from('t_institution_practice_type').insert([{
          institution_id: inst.INSTITUTION_ID,
          practice_type_id: practiceType.INTERNSHIP_TYPE_ID,
          status: 1,
          creation_date: new Date().toISOString()
        }]);
      }

      return {
        ...inst,
        t_career: careerName ? { NAME: careerName } : undefined
      } as DBInstitution;
    }, 'createInstitution');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateInstitution = async (req: Request, res: Response) => {
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
    if (i.careerId !== undefined) dbData.CAREER_ID = parseInt(i.careerId);

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('INSTITUTION_ID', id)
        .select('*')
        .single();

      if (error) throw error;

      // Fetch career name manually since there's no FK relationship
      let careerName: string | undefined;
      if (inst.CAREER_ID) {
        const { data: career } = await supabase
          .from('t_career')
          .select('CAREER_NAME')
          .eq('CAREER_ID', inst.CAREER_ID)
          .single();
        if (career) careerName = career.CAREER_NAME;
      }

      // Update related tables if career or practice type changed
      if (i.careerId !== undefined) {
        await supabase.from('t_institution_career')
          .update({ career_id: parseInt(i.careerId) })
          .eq('institution_id', id);
      }

      if (i.practiceType !== undefined) {
        const { data: practiceType } = await supabase
          .from('t_internship_type')
          .select('INTERNSHIP_TYPE_ID')
          .eq('NAME', i.practiceType)
          .single();

        if (practiceType) {
          await supabase.from('t_institution_practice_type')
            .update({ practice_type_id: practiceType.INTERNSHIP_TYPE_ID })
            .eq('institution_id', id);
        }
      }

      return {
        ...inst,
        t_career: careerName ? { NAME: careerName } : undefined
      } as DBInstitution;
    }, 'updateInstitution');

    // Invalidar caché
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

export const deleteInstitution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await dbManager.withRetry(async (supabase) => {
      // 1. Verificar si tiene responsables asociados
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

      // 2. Proceder con la eliminación lógica
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('INSTITUTION_ID', id);

      if (error) throw error;
    }, 'deleteInstitution');

    // Invalidar caché
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

export const toggleInstitutionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const data = await dbManager.withRetry(async (supabase) => {
      // Si se intenta desactivar (status = false), verificar responsables
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

      const { data: inst, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('INSTITUTION_ID', id)
        .select('*')
        .single();

      if (error) throw error;

      // Fetch career name manually since there's no FK relationship
      let careerName: string | undefined;
      if (inst.CAREER_ID) {
        const { data: career } = await supabase
          .from('t_career')
          .select('CAREER_NAME')
          .eq('CAREER_ID', inst.CAREER_ID)
          .single();
        if (career) careerName = career.CAREER_NAME;
      }

      return {
        ...inst,
        t_career: careerName ? { NAME: careerName } : undefined
      } as DBInstitution;
    }, 'toggleInstitutionStatus');

    // Invalidar caché
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
