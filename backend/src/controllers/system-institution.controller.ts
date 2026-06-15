import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_system_institution';

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

export const getInstitution = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('status', 1)
        .maybeSingle();

      if (error) throw error;
      return data;
    });

    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateInstitution = async (req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // Check if institution already exists
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('system_institution_id')
        .eq('status', 1)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update({
            ...req.body,
            updated_at: new Date().toISOString()
          })
          .eq('system_institution_id', existing.system_institution_id)
          .select()
          .maybeSingle();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert({
            ...req.body,
            status: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        return data;
      }
    });

    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};
