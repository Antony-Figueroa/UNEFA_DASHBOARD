import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const LOOKUP_TABLE = 't_value_list';
const LIST_NAME = 'Tipo de Practica';

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
      // Primero obtenemos el LIST_ID para 'Tipo de Practica'
      const { data: listData, error: listError } = await supabase
        .from('t_list')
        .select('LIST_ID')
        .eq('NAME', LIST_NAME)
        .single();

      if (listError) throw listError;

      const { data: values, error: valuesError } = await supabase
        .from(LOOKUP_TABLE)
        .select(`
          VALUE_LIST_ID,
          NAME,
          ABBREVIATION,
          STATUS
        `)
        .eq('LIST_ID', listData.LIST_ID)
        .eq('STATUS', 1)
        .order('NAME', { ascending: true });

      if (valuesError) throw valuesError;
      
      // Mapeamos para mantener compatibilidad con el frontend
      return (values || []).map(v => ({
        INTERNSHIP_TYPE_ID: v.VALUE_LIST_ID,
        NAME: v.NAME,
        ABBREVIATION: v.ABBREVIATION,
        PRIORITY: 0,
        STATUS: v.STATUS
      }));
    });
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
      // 1. Obtenemos los nombres de los tipos de práctica asignados a la carrera
      // a través de t_career_internship_type y t_internship_type
      const { data: careerTypes, error: careerTypesError } = await supabase
        .from('t_career_internship_type')
        .select(`
          t_internship_type (
            NAME
          )
        `)
        .eq('CAREER_ID', careerId);

      if (careerTypesError) throw careerTypesError;

      const assignedNames = (careerTypes as unknown as { t_internship_type: { NAME: string } | null }[] || [])
        .map((ct) => ct.t_internship_type?.NAME)
        .filter(Boolean);

      // 2. Obtenemos el LIST_ID para 'Tipo de Practica'
      const { data: listData, error: listError } = await supabase
        .from('t_list')
        .select('LIST_ID')
        .eq('NAME', LIST_NAME)
        .single();

      if (listError) throw listError;

      // 3. Buscamos los valores en t_value_list que coincidan con los nombres asignados
      let query = supabase
        .from(LOOKUP_TABLE)
        .select(`
          VALUE_LIST_ID,
          NAME,
          ABBREVIATION,
          STATUS
        `)
        .eq('LIST_ID', listData.LIST_ID)
        .eq('STATUS', 1);

      if (assignedNames.length > 0) {
        query = query.in('NAME', assignedNames);
      }

      const { data: values, error: valuesError } = await query.order('NAME', { ascending: true });

      if (valuesError) throw valuesError;

      return (values || []).map(v => ({
        INTERNSHIP_TYPE_ID: v.VALUE_LIST_ID,
        NAME: v.NAME,
        ABBREVIATION: v.ABBREVIATION,
        PRIORITY: 0,
        STATUS: v.STATUS
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
