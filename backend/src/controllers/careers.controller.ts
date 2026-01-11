import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager';

const TABLE_NAME = 't_career'; 
const RELATION_TABLE = 't_career_internship_type';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };
  
  // Mensaje amigable según el código de error de Postgres
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '22P02') {
    userMessage = 'Error: Formato de datos inválido (ej: número esperado en lugar de texto)';
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

export const getCareers = async (req: Request, res: Response) => {
  try {
    const transformed = await dbManager.withRetry(async (supabase) => {
      const { data: careers, error: careerError } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          ${RELATION_TABLE} (
            INTERNSHIP_TYPE_ID
          )
        `)
        .order('CREATION_DATE', { ascending: false });

      if (careerError) throw careerError;

      return (careers || []).map((career: Record<string, unknown>) => {
        const internshipTypeIds = (career[RELATION_TABLE] as { INTERNSHIP_TYPE_ID: string }[])?.map((r) => r.INTERNSHIP_TYPE_ID) || [];
        const careerData = { ...career };
        delete careerData[RELATION_TABLE];
        return {
          ...careerData,
          INTERNSHIP_TYPE_IDS: internshipTypeIds
        };
      });
    });

    res.json(transformed);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getCareerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const careerDataWithIds = await dbManager.withRetry(async (supabase) => {
      const { data: career, error: careerError } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          ${RELATION_TABLE} (
            INTERNSHIP_TYPE_ID
          )
        `)
        .eq('CAREER_ID', id)
        .single();

      if (careerError) throw careerError;

      const careerRecord = career as Record<string, unknown>;
      const internshipTypeIds = (careerRecord[RELATION_TABLE] as { INTERNSHIP_TYPE_ID: string }[])?.map((r) => r.INTERNSHIP_TYPE_ID) || [];
      const careerData = { ...careerRecord };
      delete careerData[RELATION_TABLE];
      
      return {
        ...careerData,
        INTERNSHIP_TYPE_IDS: internshipTypeIds
      };
    });

    res.json(careerDataWithIds);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createCareer = async (req: Request, res: Response) => {
  try {
    const { INTERNSHIP_TYPE_IDS, ...careerData } = req.body;
    const now = new Date().toISOString();
    
    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Insertar carrera con campos de auditoría
      const { data: newCareer, error: careerError } = await supabase
        .from(TABLE_NAME)
        .insert([
          { 
            CAREER_CODE: careerData.CAREER_CODE, 
            CAREER_NAME: careerData.CAREER_NAME, 
            MINIMUM_GRADE: careerData.MINIMUM_GRADE, 
            CAREER_ABBREVIATION: careerData.CAREER_ABBREVIATION, 
            STATUS: careerData.STATUS ?? 1,
            CREATION_DATE: now,
            MODIF_USER_ID: 1,
            MODIF_USER_DATE: now,
            ELIM_USER_ID: 1,
            ELIM_USER_DATE: now,
            REST_USER_ID: 1,
            REST_USER_DATE: now
          }
        ])
        .select()
        .single();

      if (careerError) throw careerError;

      // 2. Insertar relaciones si existen
      if (INTERNSHIP_TYPE_IDS && Array.isArray(INTERNSHIP_TYPE_IDS) && INTERNSHIP_TYPE_IDS.length > 0) {
        const relations = INTERNSHIP_TYPE_IDS.map(typeId => ({
          CAREER_ID: newCareer.CAREER_ID,
          INTERNSHIP_TYPE_ID: typeId
        }));

        const { error: relationError } = await supabase
          .from(RELATION_TABLE)
          .insert(relations);

        if (relationError) throw relationError;
      }

      return {
        ...newCareer,
        INTERNSHIP_TYPE_IDS: INTERNSHIP_TYPE_IDS || []
      };
    });

    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateCareer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { INTERNSHIP_TYPE_IDS, ...updates } = req.body;
    const now = new Date().toISOString();
    
    // Eliminar campos que no deben actualizarse directamente o que son el ID
    const validUpdates = { ...updates };
    delete validUpdates.CAREER_ID;
    delete validUpdates.CREATION_DATE;

    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Actualizar carrera con campos de auditoría
      const { data: updatedCareer, error: careerError } = await supabase
        .from(TABLE_NAME)
        .update({
          ...validUpdates,
          MODIF_USER_DATE: now,
          MODIF_USER_ID: 1
        })
        .eq('CAREER_ID', id)
        .select()
        .single();

      if (careerError) throw careerError;

      // 2. Sincronizar relaciones si se enviaron
      if (INTERNSHIP_TYPE_IDS !== undefined && Array.isArray(INTERNSHIP_TYPE_IDS)) {
        // Eliminar existentes
        await supabase
          .from(RELATION_TABLE)
          .delete()
          .eq('CAREER_ID', id);

        // Insertar nuevas
        if (INTERNSHIP_TYPE_IDS.length > 0) {
          const relations = INTERNSHIP_TYPE_IDS.map(typeId => ({
            CAREER_ID: id,
            INTERNSHIP_TYPE_ID: typeId
          }));

          const { error: relationError } = await supabase
            .from(RELATION_TABLE)
            .insert(relations);

          if (relationError) throw relationError;
        }
      }

      return {
        ...updatedCareer,
        INTERNSHIP_TYPE_IDS: INTERNSHIP_TYPE_IDS || []
      };
    });

    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteCareer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('CAREER_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkDeleteCareers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .in('CAREER_ID', ids);

      if (error) throw error;
    });

    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
