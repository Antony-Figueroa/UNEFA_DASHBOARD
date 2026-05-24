import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';
import { personService } from '../services/person.service.js';

const TABLE_NAME = 't_tutors';

const TUTOR_COLUMNS_TO_AUDIT = [
  'TUTOR_CI', 'NAME', 'SECOND_NAME', 'SURNAME', 'SECOND_SURNAME',
  'CONTACT_PHONE', 'GENDER', 'EMAIL', 'PROFESSION', 'CONDITION',
  'DEDICATION', 'CATEGORY', 'TITULO', 'STATUS'
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
  } else if (dbError.code === '22001') {
    userMessage = 'Error: La cédula ingresada excede el límite permitido (máximo 8 dígitos). Verifique e intente nuevamente.';
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
  TITULO: string | null;
  CREATION_DATE: string;
  STATUS: number;
  person_id: number;
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

const mapDBToFrontend = (t: DBTutor & { t_tutor_career?: DBTutorCareer[]; t_visit?: DBVisit[]; t_professional_practices_tutor?: DBProfessionalPracticesTutor[] }) => {
  const ciParts = (t.TUTOR_CI || '').split('-');
  const prefix = ciParts.length > 1 ? ciParts[0] : 'V';
  const number = ciParts.length > 1 ? ciParts[1] : ciParts[0];

  const isInUse = (Array.isArray(t.t_visit) && t.t_visit.length > 0) ||
                 (Array.isArray(t.t_professional_practices_tutor) && t.t_professional_practices_tutor.length > 0);

  const careers = Array.isArray(t.t_tutor_career)
    ? t.t_tutor_career.map(tc => String(tc.CAREER_ID))
    : [];

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
    titulo: t.TITULO || undefined,
    registrationDate: t.CREATION_DATE,
    status: t.STATUS === 1,
    carreras: careers,
    practiceTypes,
    isInUse,
    personId: t.person_id,
  };
};

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

    const mappedData = data.map((t) => mapDBToFrontend(t));
    res.json(mappedData);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createTutor = async (req: AuthRequest, res: Response) => {
  try {
    const t = req.body;
    const ci = `${t.identificationPrefix}-${t.identificationNumber}`;

    // Create or reuse person record
    let personId: number;
    const existingPerson = await personService.getPersonByCi(ci);
    if (existingPerson) {
      personId = existingPerson.personId;
    } else {
      const person = await personService.createPerson({
        ci,
        firstName: t.firstName,
        middleName: t.middleName,
        lastName: t.lastName,
        secondLastName: t.secondLastName,
        email: t.email,
        phone: t.phone,
        gender: t.sex,
      });
      personId = person.personId;
    }

    const dbData = {
      TUTOR_CI: ci,
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
      TITULO: t.titulo || null,
      STATUS: t.status !== undefined ? (t.status ? 1 : 0) : 1,
      CREATION_DATE: new Date().toISOString(),
      person_id: personId,
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: tutorData, error: tutorError } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select()
        .single();

      if (tutorError) throw tutorError;
      const newTutor = tutorData as DBTutor;

      if (Array.isArray(t.carreras) && t.carreras.length > 0) {
        const careerData = t.carreras.map((careerId: string | number) => ({
          TUTOR_ID: newTutor.TUTOR_ID,
          CAREER_ID: Number(careerId)
        }));

        const { error: careerError } = await supabase
          .from('t_tutor_career')
          .insert(careerData);

        if (careerError) throw careerError;

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

    await auditCreate(req, 't_tutors', dbData, TUTOR_COLUMNS_TO_AUDIT);
    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    if ((error as any)?.code === 'PERSON_ALREADY_EXISTS') {
      return res.status(409).json({ message: (error as any).message });
    }
    handleDbError(res, error);
  }
};

export const updateTutor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const t = req.body;
    const ci = `${t.identificationPrefix}-${t.identificationNumber}`;

    // Update person record
    const currentTutor = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('person_id')
        .eq('TUTOR_ID', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }, 'getTutorForUpdate');

    if (currentTutor?.person_id) {
      await personService.updatePerson(currentTutor.person_id, {
        firstName: t.firstName,
        middleName: t.middleName,
        lastName: t.lastName,
        secondLastName: t.secondLastName,
        email: t.email,
        phone: t.phone,
        gender: t.sex,
      });
    }

    const dbData = {
      TUTOR_CI: ci,
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
      TITULO: t.titulo || null,
      STATUS: t.status ? 1 : 0
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('TUTOR_ID', id)
        .single();

      const { error: tutorError } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('TUTOR_ID', id);

      if (tutorError) throw tutorError;

      const { error: deleteError } = await supabase
        .from('t_tutor_career')
        .delete()
        .eq('TUTOR_ID', id);

      if (deleteError) throw deleteError;

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
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('STATUS, person_id')
        .eq('TUTOR_ID', id)
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('TUTOR_ID', id);

      if (error) throw error;

      if (oldData?.person_id) {
        await personService.updatePerson(oldData.person_id, { status: status ? 1 : 0 });
      }

      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_tutors', id, oldData.STATUS, status ? 1 : 0);
      }

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
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return tutor as (DBTutor & { t_tutor_career: DBTutorCareer[] });
    });

    if (!data) {
      return res.status(200).json({ data: null, message: 'Tutor no encontrado' });
    }

    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
