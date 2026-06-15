import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_system_nucleus';
const NUCLEUS_CAREER_TABLE = 't_nucleus_career';

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

export const getNuclei = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const data = await dbManager.withRetry(async (supabase) => {
      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .order('name', { ascending: true });

      if (status !== undefined) {
        query = query.eq('status', Number(status));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });

    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getNucleusById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('nucleus_id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw { code: 'NOT_FOUND', message: 'Núcleo no encontrado' };
      }
      return data;
    });

    res.json(data);
  } catch (error) {
    const dbError = error as { code?: string; message?: string };
    if (dbError.code === 'NOT_FOUND') {
      return res.status(404).json({ message: dbError.message });
    }
    handleDbError(res, error);
  }
};

export const createNucleus = async (req: Request, res: Response) => {
  try {
    const { is_main } = req.body;
    const data = await dbManager.withRetry(async (supabase) => {
      // If setting as main, unset all others first
      if (is_main) {
        const { error: resetError } = await supabase
          .from(TABLE_NAME)
          .update({ is_main: false })
          .eq('is_main', true);

        if (resetError) throw resetError;
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({
          ...req.body,
          status: req.body.status ?? 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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

export const updateNucleus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_main } = req.body;
    const data = await dbManager.withRetry(async (supabase) => {
      // If setting as main, unset all others first
      if (is_main) {
        const { error: resetError } = await supabase
          .from(TABLE_NAME)
          .update({ is_main: false })
          .neq('nucleus_id', id)
          .eq('is_main', true);

        if (resetError) throw resetError;
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('nucleus_id', id)
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

export const deleteNucleus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('nucleus_id', id);

      if (error) throw error;
    });

    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const toggleNucleusStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { data: current, error: readError } = await supabase
        .from(TABLE_NAME)
        .select('status')
        .eq('nucleus_id', id)
        .single();

      if (readError) throw readError;

      const newStatus = current.status === 1 ? 0 : 1;

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('nucleus_id', id);

      if (error) throw error;
    });

    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getNucleusCareers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(NUCLEUS_CAREER_TABLE)
        .select(`
          nucleus_career_id,
          status,
          t_career!inner(*)
        `)
        .eq('nucleus_id', id);

      if (error) throw error;
      return data || [];
    });

    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const setNucleusCareers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { career_ids } = req.body;

    if (!Array.isArray(career_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de career_ids' });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from(NUCLEUS_CAREER_TABLE)
        .delete()
        .eq('nucleus_id', id);

      if (deleteError) throw deleteError;

      if (career_ids.length === 0) {
        return [];
      }

      // Insert new assignments
      const inserts = career_ids.map((career_id: number) => ({
        nucleus_id: Number(id),
        career_id,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from(NUCLEUS_CAREER_TABLE)
        .insert(inserts)
        .select();

      if (error) throw error;
      return data || [];
    });

    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};
