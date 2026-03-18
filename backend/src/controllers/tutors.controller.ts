import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_tutors';

const TUTOR_COLUMNS_TO_AUDIT = [
  'TUTOR_CI', 'NAME', 'SECOND_NAME', 'SURNAME', 'SECOND_SURNAME',
  'CONTACT_PHONE', 'GENDER', 'EMAIL', 'PROFESSION', 'CONDITION',
  'DEDICATION', 'CATEGORY', 'STATUS'
];

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

interface DBTutor {
  TUTOR_ID: number;
  TUTOR_CI: string;
  NAME: string;
  SECOND_NAME: string;
  SURNAME: string;
  SECOND_SURNAME: string;
  CONTACT_PHONE: string;
  GENDER: string;
  EMAIL: string;
  PROFESSION: string;
  CONDITION: string;
  DEDICATION: string;
  CATEGORY: string;
  CREATION_DATE: string;
  STATUS: number;
}

interface DBVisit {
  VISIT_ID: number;
}

interface DBProfessionalPracticesTutor {
  PROFESSIONAL_PRACTICES_TUTOR_ID: number;
}

interface DBTutorCareer {
  CAREER_ID: number;
  t_career?: {
    t_career_internship_type?: {
      t_internship_type?: {
        NAME: string;
      };
    }[];
  };
}

export const getTutors = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *, 
          t_visit(VISIT_ID), 
          t_professional_practices_tutor(PROFESSIONAL_PRACTICES_TUTOR_ID), 
          t_tutor_career(
            CAREER_ID, 
            t_career(
              t_career_internship_type(
                t_internship_type(NAME)
              )
            )
          )
        `)
        .order('NAME', { ascending: true });

      if (error) throw error;
      return data as (DBTutor & { 
        t_visit: DBVisit[], 
        t_professional_practices_tutor: DBProfessionalPracticesTutor[],
        t_tutor_career: DBTutorCareer[]
      })[];
    });

    // Mapear de DB a Frontend
    const mappedData = data.map((t) => {
      const ciParts = (t.TUTOR_CI || '').split('-');
      const prefix = ciParts.length > 1 ? ciParts[0] : 'V';
      const number = ciParts.length > 1 ? ciParts[1] : ciParts[0];

      const isInUse = (Array.isArray(t.t_visit) && t.t_visit.length > 0) || 
                     (Array.isArray(t.t_professional_practices_tutor) && t.t_professional_practices_tutor.length > 0);

      const careers = Array.isArray(t.t_tutor_career) 
        ? t.t_tutor_career.map(tc => String(tc.CAREER_ID)) 
        : [];

      // Extraer tipos de práctica de las carreras asignadas
      const practiceTypesSet = new Set<string>();
      if (Array.isArray(t.t_tutor_career)) {
        t.t_tutor_career.forEach(tc => {
          if (tc.t_career?.t_career_internship_type) {
            tc.t_career.t_career_internship_type.forEach(cit => {
              if (cit.t_internship_type?.NAME) {
                practiceTypesSet.add(cit.t_internship_type.NAME);
              }
            });
          }
        });
      }
      const practiceTypes = Array.from(practiceTypesSet);

      return {
        tutorId: String(t.TUTOR_ID),
        identificationPrefix: prefix,
        identificationNumber: number,
        firstName: t.NAME,
        middleName: t.SECOND_NAME || undefined,
        lastName: t.SURNAME,
        secondLastName: t.SECOND_SURNAME || undefined,
        sex: t.GENDER,
        phone: t.CONTACT_PHONE,
        email: t.EMAIL,
        profession: t.PROFESSION,
        condition: t.CONDITION,
        dedication: t.DEDICATION,
        category: t.CATEGORY,
        registrationDate: t.CREATION_DATE,
        status: t.STATUS === 1,
        carreras: careers,
        practiceTypes, // Nuevo campo con datos reales de la DB
        isInUse
      };
    });

    res.json(mappedData);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

const mapDBToFrontend = (t: DBTutor & { t_tutor_career?: DBTutorCareer[] }) => {
  const ciParts = (t.TUTOR_CI || '').split('-');
  const prefix = ciParts.length > 1 ? ciParts[0] : 'V';
  const number = ciParts.length > 1 ? ciParts[1] : ciParts[0];

  const careers = Array.isArray(t.t_tutor_career) 
    ? t.t_tutor_career.map(tc => String(tc.CAREER_ID)) 
    : [];

  // Extraer tipos de práctica de las carreras asignadas
  const practiceTypesSet = new Set<string>();
  if (Array.isArray(t.t_tutor_career)) {
    t.t_tutor_career.forEach(tc => {
      if (tc.t_career?.t_career_internship_type) {
        tc.t_career.t_career_internship_type.forEach(cit => {
          if (cit.t_internship_type?.NAME) {
            practiceTypesSet.add(cit.t_internship_type.NAME);
          }
        });
      }
    });
  }
  const practiceTypes = Array.from(practiceTypesSet);

  return {
    tutorId: String(t.TUTOR_ID),
    identificationPrefix: prefix,
    identificationNumber: number,
    firstName: t.NAME,
    middleName: t.SECOND_NAME || undefined,
    lastName: t.SURNAME,
    secondLastName: t.SECOND_SURNAME || undefined,
    sex: t.GENDER,
    phone: t.CONTACT_PHONE,
    email: t.EMAIL,
    profession: t.PROFESSION,
    condition: t.CONDITION,
    dedication: t.DEDICATION,
    category: t.CATEGORY,
    registrationDate: t.CREATION_DATE,
    status: t.STATUS === 1,
    carreras: careers,
    practiceTypes
  };
};

export const createTutor = async (req: AuthRequest, res: Response) => {
  try {
    const t = req.body;
    const dbData = {
      TUTOR_CI: `${t.identificationPrefix}-${t.identificationNumber}`,
      NAME: t.firstName,
      SECOND_NAME: t.middleName || null,
      SURNAME: t.lastName,
      SECOND_SURNAME: t.secondLastName || null,
      GENDER: t.sex,
      CONTACT_PHONE: t.phone,
      EMAIL: t.email,
      PROFESSION: t.profession,
      CONDITION: t.condition,
      DEDICATION: t.dedication,
      CATEGORY: t.category,
      STATUS: t.status ? 1 : 0,
      CREATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Insertar tutor
      const { data: tutorData, error: tutorError } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select()
        .single();

      if (tutorError) throw tutorError;
      const newTutor = tutorData as DBTutor;

      // 2. Insertar carreras si existen
      if (Array.isArray(t.carreras) && t.carreras.length > 0) {
        const careerData = t.carreras.map((careerId: string | number) => ({
          TUTOR_ID: newTutor.TUTOR_ID,
          CAREER_ID: Number(careerId)
        }));

        const { error: careerError } = await supabase
          .from('t_tutor_career')
          .insert(careerData);

        if (careerError) throw careerError;
        
        // Volver a obtener el tutor con las carreras para el retorno
        const { data: finalData, error: finalError } = await supabase
          .from(TABLE_NAME)
          .select(`
            *, 
            t_tutor_career(
              CAREER_ID, 
              t_career(
                t_career_internship_type(
                  t_internship_type(NAME)
                )
              )
            )
          `)
          .eq('TUTOR_ID', newTutor.TUTOR_ID)
          .single();
          
        if (finalError) throw finalError;
        return finalData as (DBTutor & { t_tutor_career: DBTutorCareer[] });
      }

      return newTutor;
    });

    // Registrar auditoría
    await auditCreate(req, 't_tutors', dbData, TUTOR_COLUMNS_TO_AUDIT);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateTutor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const t = req.body;
    const dbData = {
      TUTOR_CI: `${t.identificationPrefix}-${t.identificationNumber}`,
      NAME: t.firstName,
      SECOND_NAME: t.middleName || null,
      SURNAME: t.lastName,
      SECOND_SURNAME: t.secondLastName || null,
      GENDER: t.sex,
      CONTACT_PHONE: t.phone,
      EMAIL: t.email,
      PROFESSION: t.profession,
      CONDITION: t.condition,
      DEDICATION: t.dedication,
      CATEGORY: t.category,
      STATUS: t.status ? 1 : 0
    };

    const data = await dbManager.withRetry(async (supabase) => {
      // 0. Obtener datos antiguos para auditoría
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('TUTOR_ID', id)
        .single();

      // 1. Actualizar tutor
      const { error: tutorError } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('TUTOR_ID', id);

      if (tutorError) throw tutorError;

      // 2. Actualizar carreras (Borrar y reinsertar)
      // Primero borramos todas las asociaciones actuales
      const { error: deleteError } = await supabase
        .from('t_tutor_career')
        .delete()
        .eq('TUTOR_ID', id);

      if (deleteError) throw deleteError;

      // Luego insertamos las nuevas si existen
      if (Array.isArray(t.carreras) && t.carreras.length > 0) {
        const careerData = t.carreras.map((careerId: string | number) => ({
          TUTOR_ID: id,
          CAREER_ID: Number(careerId)
        }));

        const { error: careerError } = await supabase
          .from('t_tutor_career')
          .insert(careerData);

        if (careerError) throw careerError;
      }

      // Volver a obtener el tutor con las carreras para el retorno
      const { data: finalData, error: finalError } = await supabase
        .from(TABLE_NAME)
        .select(`
          *, 
          t_tutor_career(
            CAREER_ID, 
            t_career(
              t_career_internship_type(
                t_internship_type(NAME)
              )
            )
          )
        `)
        .eq('TUTOR_ID', id)
        .single();
        
      if (finalError) throw finalError;

      // Registrar auditoría
      if (oldData) {
        await auditUpdate(req, 't_tutors', oldData as Record<string, any>, dbData, TUTOR_COLUMNS_TO_AUDIT);
      }

      return finalData as (DBTutor & { t_tutor_career: DBTutorCareer[] });
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const deleteTutor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      // Obtener datos antes de eliminar para auditoría
      const { data: deletedData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('TUTOR_ID', id)
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('TUTOR_ID', id);

      if (error) throw error;

      // Registrar auditoría
      if (deletedData) {
        await auditDelete(req, 't_tutors', deletedData as Record<string, any>, TUTOR_COLUMNS_TO_AUDIT);
      }
    });
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const toggleTutorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      // Obtener estado anterior
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('STATUS')
        .eq('TUTOR_ID', id)
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('TUTOR_ID', id);

      if (error) throw error;

      // Registrar auditoría
      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_tutors', id, oldData.STATUS, status ? 1 : 0);
      }

      // Obtener datos completos para el retorno
      const { data: finalData, error: finalError } = await supabase
        .from(TABLE_NAME)
        .select(`
          *, 
          t_tutor_career(
            CAREER_ID, 
            t_career(
              t_career_internship_type(
                t_internship_type(NAME)
              )
            )
          )
        `)
        .eq('TUTOR_ID', id)
        .single();

      if (finalError) throw finalError;
      return finalData as (DBTutor & { t_tutor_career: DBTutorCareer[] });
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getTutorByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: tutor, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *, 
          t_tutor_career(
            CAREER_ID, 
            t_career(
              t_career_internship_type(
                t_internship_type(NAME)
              )
            )
          )
        `)
        .eq('TUTOR_CI', ci)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return tutor as (DBTutor & { t_tutor_career: DBTutorCareer[] });
    });

    if (!data) {
      // Retornamos 200 con data: null para que el frontend maneje la ausencia
      // sin disparar errores globales de interceptores.
      return res.status(200).json({ data: null, message: 'Tutor no encontrado' });
    }

    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
