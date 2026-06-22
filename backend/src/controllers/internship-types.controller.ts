import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { sanitizeText } from '../utils/text-utils.js';

const TABLE_NAME = 't_internship_type';
const CACHE_TTL = 3600000; // 1h — datos de referencia

type InternshipTypeRecord = {
  INTERNSHIP_TYPE_ID: number;
  NAME: string;
  PRIORITY: number;
  STATUS: number;
  CREATION_DATE: string;
  ABBREVIATION?: string;
  HOURS_REQUIRED?: number;
};

type CareerInternshipTypeRow = {
  t_internship_type: InternshipTypeRecord[] | null;
};

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '22P02') {
    userMessage = 'Error: Formato de datos inválido';
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error'
  });
};

export const getAllInternshipTypes = async (req: Request, res: Response) => {
  const cacheKey = 'internshipTypes:all';
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('NAME', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(v => ({
        ...v,
        ABBREVIATION: v.ABBREVIATION || '',
        HOURS_REQUIRED: v.HOURS_REQUIRED ?? 360
      }));
    });
    cacheManager.set(cacheKey, data, CACHE_TTL);
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getInternshipTypesByCareer = async (req: Request, res: Response) => {
  try {
    const { careerId } = req.params;

    if (!careerId) {
      return res.status(400).json({ message: 'Career ID is required' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_career_internship_type')
        .select(`
          t_internship_type (
            INTERNSHIP_TYPE_ID,
            NAME,
            PRIORITY,
            STATUS,
            CREATION_DATE,
            HOURS_REQUIRED
          )
        `)
        .eq('CAREER_ID', careerId);

      if (error) throw error;

      return (data || [])
        .flatMap((item: CareerInternshipTypeRow) => (item.t_internship_type ?? []))
        .map((type: InternshipTypeRecord) => ({
          ...type,
          ABBREVIATION: type.ABBREVIATION ?? '',
          HOURS_REQUIRED: type.HOURS_REQUIRED ?? 360
        }));
    }, 'getInternshipTypesByCareer');

    res.json(result);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createInternshipType = async (req: Request, res: Response) => {
  try {
    const { NAME, ABBREVIATION, PRIORITY, STATUS } = req.body;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          NAME: sanitizeText(NAME) ?? '',
          PRIORITY: Number(PRIORITY) || 0,
          STATUS: STATUS || 1,
          CREATION_DATE: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, ABBREVIATION: ABBREVIATION || '' };
    });
    cacheManager.deleteByPrefix('internshipTypes');
    res.status(201).json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateInternshipType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { NAME, ABBREVIATION, PRIORITY, STATUS } = req.body;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          NAME: sanitizeText(NAME) ?? '',
          PRIORITY: Number(PRIORITY),
          STATUS
        })
        .eq('INTERNSHIP_TYPE_ID', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, ABBREVIATION: ABBREVIATION || '' };
    });
    cacheManager.deleteByPrefix('internshipTypes');
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteInternshipType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('INTERNSHIP_TYPE_ID', id);

      if (error) throw error;
    });
    cacheManager.deleteByPrefix('internshipTypes');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const toggleInternshipTypeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { data: current, error: readError } = await supabase
        .from(TABLE_NAME)
        .select('STATUS')
        .eq('INTERNSHIP_TYPE_ID', id)
        .single();
      
      if (readError) throw readError;

      const newStatus = current.STATUS === 1 ? 0 : 1;

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: newStatus })
        .eq('INTERNSHIP_TYPE_ID', id);

      if (error) throw error;
    });
    cacheManager.deleteByPrefix('internshipTypes');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkDeleteInternshipTypes = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body; // Expecting array of IDs
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: 'IDs array is required' });
    }
    
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .in('INTERNSHIP_TYPE_ID', ids);

      if (error) throw error;
    });
    res.json({ message: 'Internship types deactivated' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkRestoreInternshipTypes = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: 'IDs array is required' });
    }

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 1 })
        .in('INTERNSHIP_TYPE_ID', ids);

      if (error) throw error;
    });
    res.json({ message: 'Internship types restored' });
  } catch (error) {
    handleDbError(res, error);
  }
};
