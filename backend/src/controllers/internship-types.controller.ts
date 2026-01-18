import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const LOOKUP_TABLE = 't_internship_type';
const JOIN_TABLE = 't_career_internship_type';

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
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(LOOKUP_TABLE)
        .select('*')
        .order('PRIORITY', { ascending: true });

      if (error) throw error;
      return data;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getInternshipTypesByCareer = async (req: Request, res: Response) => {
  try {
    const { careerId } = req.params;

    const result = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(JOIN_TABLE)
        .select(`
          INTERNSHIP_TYPE_ID,
          t_internship_type (
            INTERNSHIP_TYPE_ID,
            NAME,
            ABBREVIATION,
            PRIORITY,
            STATUS
          )
        `)
        .eq('CAREER_ID', careerId);

      if (!error && data) {
        const items = (data || [])
          .map(item => item.t_internship_type)
        if (items.length || data.length) {
          return items;
        }
      }

      const { data: rel, error: relErr } = await supabase
        .from(JOIN_TABLE)
        .select('INTERNSHIP_TYPE_ID')
        .eq('CAREER_ID', careerId);

      if (relErr || !rel || rel.length === 0) {
        return [];
      }

      const ids = rel.map((r: { INTERNSHIP_TYPE_ID: number }) => r.INTERNSHIP_TYPE_ID);
      const { data: types, error: typesErr } = await supabase
        .from(LOOKUP_TABLE)
        .select('INTERNSHIP_TYPE_ID, NAME, ABBREVIATION, PRIORITY, STATUS')
        .in('INTERNSHIP_TYPE_ID', ids)
        .eq('STATUS', 1)
        .order('PRIORITY', { ascending: true });

      if (typesErr) {
        return [];
      }

      return types || [];
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
        .from(LOOKUP_TABLE)
        .insert([{
          NAME,
          ABBREVIATION,
          PRIORITY: Number(PRIORITY),
          STATUS: STATUS || 1,
          CREATION_DATE: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    });
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
        .from(LOOKUP_TABLE)
        .update({
          NAME,
          ABBREVIATION,
          PRIORITY: Number(PRIORITY),
          STATUS
        })
        .eq('INTERNSHIP_TYPE_ID', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
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
        .from(LOOKUP_TABLE)
        .delete()
        .eq('INTERNSHIP_TYPE_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const toggleInternshipTypeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      // Primero obtener el estado actual
      const { data: current, error: getError } = await supabase
        .from(LOOKUP_TABLE)
        .select('STATUS')
        .eq('INTERNSHIP_TYPE_ID', id)
        .single();

      if (getError) throw getError;

      const { error } = await supabase
        .from(LOOKUP_TABLE)
        .update({ STATUS: current.STATUS === 1 ? 0 : 1 })
        .eq('INTERNSHIP_TYPE_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkDeleteInternshipTypes = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(LOOKUP_TABLE)
        .delete()
        .in('INTERNSHIP_TYPE_ID', ids);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkRestoreInternshipTypes = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(LOOKUP_TABLE)
        .update({ STATUS: 1 })
        .in('INTERNSHIP_TYPE_ID', ids);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
