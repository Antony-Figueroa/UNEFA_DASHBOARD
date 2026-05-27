import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';
import * as personService from '../services/person.service.js';

const TABLE_NAME = 't_tutors';

const TUTOR_COLUMNS_TO_AUDIT = [
  'PROFESSION', 'CONDITION',
  'DEDICATION', 'CATEGORY', 'TITULO', 'STATUS'
];

// Columnas específicas de t_tutors (sin person data)
const TUTOR_COLUMNS = `
  TUTOR_ID,
  person_id,
  PROFESSION,
  CONDITION,
  DEDICATION,
  CATEGORY,
  TITULO,
  CREATION_DATE,
  STATUS
`;

// JOIN con t_persons para datos personales
const PERSON_JOIN = `
  t_persons!inner(
    person_id,
    ci,
    first_name,
    middle_name,
    last_name,
    second_last_name,
    email,
    phone,
    gender,
    birthdate,
    marital_status
  )
`;

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
  } else if (dbError.code === '22001') {
    userMessage = 'Error: La cédula ingresada excede el límite permitido (máximo 8 dígitos). Verifique e intente nuevamente.';
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

// ============================================================
// Types
// ============================================================

interface DBTutorPerson {
  person_id: number;
  ci: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  email: string;
  phone: string | null;
  gender: string;
  birthdate: string | null;
  marital_status: string | null;
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

interface DBTutor {
  TUTOR_ID: number;
  person_id: number;
  PROFESSION: string;
  CONDITION: string;
  DEDICATION: string;
  CATEGORY: string;
  TITULO: string | null;
  CREATION_DATE: string;
  STATUS: number;
  t_persons: DBTutorPerson;
  t_visit?: DBVisit[];
  t_professional_practices_tutor?: DBProfessionalPracticesTutor[];
  t_tutor_career?: DBTutorCareer[];
}

// ============================================================
// Mappers
// ============================================================

// Conversión de estado civil (frontend → DB)
const maritalToDb: Record<string, string> = { 'SOLTERO': 'S', 'CASADO': 'C', 'DIVORCIADO': 'D', 'VIUDO': 'V' };
// Conversión de estado civil (DB → frontend)
const maritalFromDb: Record<string, string> = { 'S': 'SOLTERO', 'C': 'CASADO', 'D': 'DIVORCIADO', 'V': 'VIUDO' };

function extractPersonData(body: any) {
  return {
    ci: `${body.identificationPrefix || 'V'}-${body.identificationNumber}`,
    firstName: body.firstName,
    middleName: body.middleName || null,
    lastName: body.lastName,
    secondLastName: body.secondLastName || null,
    gender: body.sex || null,
    birthdate: body.birthDate || null,
    maritalStatus: body.civilStatus ? (maritalToDb[body.civilStatus.toUpperCase()] || null) : null,
    phone: body.phone || null,
    email: body.email,
  };
}

function extractTutorData(body: any) {
  return {
    PROFESSION: body.profession,
    CONDITION: body.condition,
    DEDICATION: body.dedication,
    CATEGORY: body.category,
    TITULO: body.titulo || null,
    STATUS: body.status !== undefined ? (body.status ? 1 : 0) : 1,
  };
}

const mapDBToFrontend = (t: DBTutor) => {
  const p = t.t_persons;
  const ciParts = (p.ci || '').split('-');
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
    firstName: p.first_name,
    middleName: p.middle_name || undefined,
    lastName: p.last_name,
    secondLastName: p.second_last_name || undefined,
    sex: p.gender,
    birthDate: p.birthdate || undefined,
    civilStatus: p.marital_status ? (maritalFromDb[p.marital_status.trim()] || p.marital_status) : undefined,
    phone: p.phone,
    email: p.email,
    profession: t.PROFESSION,
    condition: t.CONDITION,
    dedication: t.DEDICATION,
    category: t.CATEGORY,
    titulo: t.TITULO || undefined,
    registrationDate: t.CREATION_DATE,
    status: t.STATUS === 1,
    carreras: careers,
    practiceTypes,
    isInUse
  };
};

// ============================================================
// LIST
// ============================================================

export const getTutors = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${TUTOR_COLUMNS},
          ${PERSON_JOIN},
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
        .order('first_name', { ascending: true, foreignTable: 't_persons' }) // ordenar por nombre en t_persons
        .order('last_name', { ascending: true, foreignTable: 't_persons' });

      if (error) throw error;
      return data as unknown as DBTutor[];
    });

    const mappedData = data.map(mapDBToFrontend);
    res.json(mappedData);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// CREATE
// ============================================================

export const createTutor = async (req: AuthRequest, res: Response) => {
  try {
    const t = req.body;

    // Validación básica
    if (!t.identificationNumber || !t.firstName || !t.lastName || !t.email) {
      return res.status(400).json({
        message: 'Error: Faltan campos requeridos (Cédula, Nombres, Apellidos y Email son obligatorios)'
      });
    }

    const tutorCi = `${t.identificationPrefix || 'V'}-${t.identificationNumber}`;

    // Validar formato de email
    if (t.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(t.email)) {
        return res.status(400).json({ message: 'Error: El formato del correo electrónico no es válido' });
      }
    }

    // Validar duplicado de email (entre distintas personas)
    if (t.email) {
      const existingPerson = await personService.getPersonByCi(tutorCi);
      const excludePersonId = existingPerson?.personId;
      const emailCheck = await personService.validateUniqueEmail(t.email, excludePersonId);
      if (!emailCheck.available) {
        return res.status(400).json({ message: `El correo ${t.email} ya está registrado por otra persona` });
      }
    }

    const personData = extractPersonData(t);
    const tutorData = extractTutorData(t);

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Buscar persona existente por CI o crear nueva
      const newPerson = await personService.findOrCreatePerson(personData, supabase);
      const personId = newPerson.personId;

      // 2. Insertar tutor
      const dbRecord = {
        person_id: personId,
        PROFESSION: tutorData.PROFESSION,
        CONDITION: tutorData.CONDITION,
        DEDICATION: tutorData.DEDICATION,
        CATEGORY: tutorData.CATEGORY,
        TITULO: tutorData.TITULO,
        STATUS: tutorData.STATUS,
        CREATION_DATE: new Date().toISOString(),
      };

      const { data: tutorDataInsert, error: tutorError } = await supabase
        .from(TABLE_NAME)
        .insert([dbRecord])
        .select(`
          ${TUTOR_COLUMNS},
          ${PERSON_JOIN},
          t_tutor_career(
            CAREER_ID,
            t_career(
              t_career_internship_type(
                t_internship_type(NAME)
              )
            )
          )
        `)
        .single();

      if (tutorError) throw tutorError;
      const newTutor = tutorDataInsert as unknown as DBTutor;

      // 3. Insertar carreras si existen
      if (Array.isArray(t.carreras) && t.carreras.length > 0) {
        const careerData = t.carreras.map((careerId: string | number) => ({
          TUTOR_ID: newTutor.TUTOR_ID,
          CAREER_ID: Number(careerId)
        }));

        const { error: careerError } = await supabase
          .from('t_tutor_career')
          .insert(careerData);

        if (careerError) throw careerError;

        // Reobtener con carreras
        const { data: finalData, error: finalError } = await supabase
          .from(TABLE_NAME)
          .select(`
            ${TUTOR_COLUMNS},
            ${PERSON_JOIN},
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
        return finalData as unknown as DBTutor;
      }

      return newTutor;
    });

    // Auditoría
    await auditCreate(req, 't_tutors', { ...personData, ...tutorData }, TUTOR_COLUMNS_TO_AUDIT);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// UPDATE
// ============================================================

export const updateTutor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const t = req.body;

    if (!t.identificationNumber || !t.firstName || !t.lastName) {
      return res.status(400).json({
        message: 'Error: Faltan campos requeridos (Cédula, Nombres y Apellidos son obligatorios)'
      });
    }

    const tutorCi = `${t.identificationPrefix || 'V'}-${t.identificationNumber}`;

    // Validar email
    if (t.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(t.email)) {
        return res.status(400).json({ message: 'Error: El formato del correo electrónico no es válido' });
      }
    }

    const data = await dbManager.withRetry(async (supabase) => {
      // 0. Obtener registro actual
      const { data: existingData, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select(`TUTOR_ID, person_id, STATUS, t_persons!inner(ci, email)`)
        .eq('TUTOR_ID', id)
        .single();

      if (fetchError || !existingData) {
        throw Object.assign(new Error('Tutor no encontrado'), { code: '404' });
      }

      const existing = existingData as any;
      const personId = existing.person_id;

      // 1. Validar duplicados en t_persons
      const ciCheck = await personService.validateUniqueCi(tutorCi, personId);
      if (!ciCheck.available) {
        throw Object.assign(new Error(`La cédula ${tutorCi} ya está registrada por otra persona`), { code: '409' });
      }

      if (t.email) {
        const emailCheck = await personService.validateUniqueEmail(t.email, personId);
        if (!emailCheck.available) {
          throw Object.assign(new Error(`El correo ${t.email} ya está registrado por otra persona`), { code: '409' });
        }
      }

      const personData = extractPersonData(t);
      const tutorData = extractTutorData(t);

      // 2. Actualizar t_persons
      await personService.updatePerson(personId, personData, supabase);

      // 3. Actualizar t_tutors (incluyendo legacy)
      const dbRecord = {
        PROFESSION: tutorData.PROFESSION,
        CONDITION: tutorData.CONDITION,
        DEDICATION: tutorData.DEDICATION,
        CATEGORY: tutorData.CATEGORY,
        TITULO: tutorData.TITULO,
        STATUS: tutorData.STATUS,
      };

      const { error: tutorError } = await supabase
        .from(TABLE_NAME)
        .update(dbRecord)
        .eq('TUTOR_ID', id);

      if (tutorError) throw tutorError;

      // 4. Actualizar carreras (Borrar y reinsertar)
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

      // 5. Obtener datos completos para retorno
      const { data: finalData, error: finalError } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${TUTOR_COLUMNS},
          ${PERSON_JOIN},
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

      // Auditoría
      await auditUpdate(req, 't_tutors', existing as Record<string, any>, dbRecord, TUTOR_COLUMNS_TO_AUDIT);

      return finalData as unknown as DBTutor;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    const appErr = error as AppError;
    if (appErr.code === '404') return res.status(404).json({ message: appErr.message });
    if (appErr.code === '409') return res.status(400).json({ message: appErr.message });
    handleDbError(res, error);
  }
};

// ============================================================
// DELETE
// ============================================================

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

// ============================================================
// TOGGLE STATUS
// ============================================================

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

      if (!oldData) {
        throw Object.assign(new Error('Tutor no encontrado'), { code: '404' });
      }

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('TUTOR_ID', id);

      if (error) throw error;

      // Sincronizar estado con t_persons
      if (oldData.person_id) {
        await personService.togglePersonStatus(oldData.person_id, status ? 1 : 0);
      }

      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_tutors', id, oldData.STATUS, status ? 1 : 0);
      }

      // Obtener datos completos
      const { data: finalData, error: finalError } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${TUTOR_COLUMNS},
          ${PERSON_JOIN},
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
      return finalData as unknown as DBTutor;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    if ((error as AppError).code === '404') {
      return res.status(404).json({ message: 'Tutor no encontrado' });
    }
    handleDbError(res, error);
  }
};

// ============================================================
// GET BY CI
// ============================================================

export const getTutorByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;

    // Buscar persona por CI
    const person = await personService.getPersonByCi(ci);
    if (!person) {
      return res.status(200).json({ data: null, message: 'Tutor no encontrado' });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: tutor, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${TUTOR_COLUMNS},
          ${PERSON_JOIN},
          t_tutor_career(
            CAREER_ID,
            t_career(
              t_career_internship_type(
                t_internship_type(NAME)
              )
            )
          )
        `)
        .eq('person_id', person.personId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return tutor as unknown as DBTutor;
    });

    if (!data) {
      // Persona existe pero no como tutor → devolver datos de persona
      return res.json({
        data: null,
        person: {
          identificationPrefix: person.prefixCi,
          identificationNumber: person.identificationNumber,
          firstName: person.firstName,
          middleName: person.middleName || '',
          lastName: person.lastName,
          secondLastName: person.secondLastName || '',
          email: person.email,
          phone: person.phone || '',
        }
      });
    }

    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
