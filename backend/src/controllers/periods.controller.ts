import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_internships_period';

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

interface Period {
  PERIOD_ID: number;
  DESCRIPTION: string;
  START_DATE: string;
  END_DATE: string;
  PERIOD_STATUS: string;
  STATUS: number;
  CREATION_DATE: string;
  T_INTERNSHIPS_CODE: string;
}

export const getPeriods = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Obtener todos los periodos
      const { data: periods, error: periodsError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('START_DATE', { ascending: false });

      if (periodsError) throw periodsError;

      // 2. Obtener IDs de periodos en uso en t_professional_practices
      const { data: usedPeriods, error: usedError } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID');

      if (usedError) throw usedError;

      const usedPeriodIds = new Set(usedPeriods.map(p => p.PERIOD_ID));

      // 3. Marcar periodos como en uso
      const enrichedPeriods = (periods as Period[]).map(p => ({
        ...p,
        isInUse: usedPeriodIds.has(p.PERIOD_ID)
      }));

      return enrichedPeriods;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getCurrentPeriod = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_STATUS', '1')
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Period;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getPeriodById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_ID', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // PostgREST error code for no rows found
          const notFoundError = new Error(`No se encontró el périodo con PERIOD_ID: ${id}`) as AppError;
          notFoundError.code = '404';
          throw notFoundError;
        }
        throw error;
      }
      return data as Period;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createPeriod = async (req: Request, res: Response) => {
  try {
    const { description, startDate, endDate, periodStatus, status, code } = req.body;
    const now = new Date().toISOString();
    
    // Convertir timestamps de segundos a ISO si vienen del frontend
    const formatToDate = (val: string | number) => {
      if (typeof val === 'number') {
        // Usamos UTC para evitar desfases de zona horaria al obtener solo la fecha
        const date = new Date(val * 1000);
        return date.toISOString().split('T')[0];
      }
      return val;
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          { 
            DESCRIPTION: description,
            START_DATE: formatToDate(startDate),
            END_DATE: formatToDate(endDate),
            PERIOD_STATUS: String(periodStatus || '1'),
            STATUS: status === false ? 0 : 1,
            CREATION_DATE: now,
            T_INTERNSHIPS_CODE: code || `P${Date.now().toString().slice(-7)}` // Máximo 8 caracteres
          }
        ])
        .select();

      if (error) throw error;
      return (data as unknown) as Period[];
    });
    res.status(201).json(data[0]);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updatePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, startDate, endDate, periodStatus, status, code } = req.body;
    
    const formatToDate = (val: string | number) => {
      if (typeof val === 'number') {
        const date = new Date(val * 1000);
        return date.toISOString().split('T')[0];
      }
      return val;
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const updatePayload: Record<string, unknown> = {};
      if (description !== undefined) updatePayload.DESCRIPTION = description;
      if (startDate !== undefined) updatePayload.START_DATE = formatToDate(startDate);
      if (endDate !== undefined) updatePayload.END_DATE = formatToDate(endDate);
      if (periodStatus !== undefined) {
        updatePayload.PERIOD_STATUS = String(periodStatus);
        console.log(`[Audit Log] Backend: Solicitud de cambio de estatus para PERIOD_ID ${id} a ${periodStatus}`);
      }
      if (status !== undefined) updatePayload.STATUS = status === false ? 0 : 1;
      if (code !== undefined) updatePayload.T_INTERNSHIPS_CODE = code;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq('PERIOD_ID', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        const notFoundError = new Error(`No se encontró el périodo con PERIOD_ID: ${id}`) as AppError;
        notFoundError.code = '404';
        throw notFoundError;
      }

      return (data as unknown) as Period[];
    });
    res.json(data[0]);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const deletePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('PERIOD_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message, message: 'no hay conexion a la bd' });
  }
};
