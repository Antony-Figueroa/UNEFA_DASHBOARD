import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sanitizeText } from '../utils/text-utils.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';
import * as personService from '../services/person.service.js';
import { lookupCedula } from '../services/cedula-api.service.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

const TABLE_NAME = 't_students';
const CACHE_PREFIX = 'students:';

const STUDENT_COLUMNS_TO_AUDIT = [
  'STUDENT_TYPE', 'MILITARY_RANK', 'EMPLOYMENT', 'STATUS'
];

// Columnas de t_students (solo específicas del estudiante, sin person data)
const STUDENT_BASE_COLUMNS = `
  STUDENTS_ID,
  person_id,
  STUDENT_TYPE,
  MILITARY_RANK,
  EMPLOYMENT,
  REGISTRATION_DATE,
  STATUS
`;

// Columnas de t_persons para JOIN
const PERSON_JOIN_COLUMNS = `
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
    address,
    marital_status,
    status
  )
`;

// Columnas completas con JOIN + relaciones
const STUDENT_FULL_COLUMNS = `
  ${STUDENT_BASE_COLUMNS},
  ${PERSON_JOIN_COLUMNS},
  t_professional_practices(INTERNSHIP_STATUS, PRACTICES_STATUS)
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
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === 'PGRST116') {
    return res.status(404).json({ message: 'Registro no encontrado' });
  } else if (dbError.code === '404') {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(500).json({
    message: `${userMessage}: ${dbError.message || 'Unknown database error'} ${dbError.details || ''}`,
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

// Columnas de t_persons que pueden usarse para ordenamiento
// (requieren foreignTable: 't_persons' en Supabase)
const PERSON_SORT_FIELDS = new Set([
  'first_name', 'last_name', 'second_last_name', 'ci',
  'email', 'phone', 'gender', 'birthdate', 'marital_status'
]);

// ============================================================
// Types
// ============================================================

interface DBPerson {
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
  address: string | null;
  marital_status: string | null;
  status: number;
}

interface DBStudent {
  STUDENTS_ID: number;
  person_id: number;
  STUDENT_TYPE: string;
  MILITARY_RANK: string;
  EMPLOYMENT: string;
  REGISTRATION_DATE: string;
  STATUS: number;
  t_persons: DBPerson;
  t_professional_practices?: { INTERNSHIP_STATUS: number; PRACTICES_STATUS: number }[];
}

// ============================================================
// Mappers
// ============================================================

const genderToDb: Record<string, string> = { 'MASCULINO': 'M', 'FEMENINO': 'F', 'OTRO': 'O' };
const genderFromDb: Record<string, string> = { 'M': 'MASCULINO', 'F': 'FEMENINO', 'O': 'OTRO' };
const maritalToDb: Record<string, string> = { 'SOLTERO': 'S', 'CASADO': 'C', 'DIVORCIADO': 'D', 'VIUDO': 'V' };
const maritalFromDb: Record<string, string> = { 'S': 'SOLTERO', 'C': 'CASADO', 'D': 'DIVORCIADO', 'V': 'VIUDO' };
const typeToDb: Record<string, string> = { 'CIVIL': 'CIV', 'MILITAR': 'MIL' };
const typeFromDb: Record<string, string> = { 'CIV': 'CIVIL', 'MIL': 'MILITAR' };

/** Extrae campos de persona del body frontend (camelCase) */
function extractPersonData(body: any) {
  return {
    ci: `${body.identificationPrefix || 'V'}-${body.identificationNumber}`,
    firstName: sanitizeText(body.firstName) ?? '',
    middleName: sanitizeText(body.middleName),
    lastName: sanitizeText(body.lastName) ?? '',
    secondLastName: sanitizeText(body.secondLastName),
    gender: genderToDb[body.sex?.toUpperCase()] || 'O',
    birthDate: body.birthDate || null,
    maritalStatus: maritalToDb[body.civilStatus?.toUpperCase()] || 'S',
    phone: body.phone || null,
    email: sanitizeText(body.email),
    address: sanitizeText(body.address),
  };
}

/** Extrae campos específicos de estudiante del body frontend */
function extractStudentData(body: any) {
  return {
    STUDENT_TYPE: typeToDb[body.studentType?.toUpperCase()] || 'CIV',
    MILITARY_RANK: body.militaryRank || null,
    EMPLOYMENT: body.works === "SI" ? "SI" : "NO",
    STATUS: body.status !== false ? 1 : 0,
  };
}

const mapDBToFrontend = (s: DBStudent) => {
  const p = s.t_persons;
  return {
    studentId: String(s.STUDENTS_ID),
    personId: String(s.person_id),
    identificationPrefix: (p.ci || '').split('-')[0] || '',
    identificationNumber: (p.ci || '').split('-')[1] || '',
    firstName: p.first_name,
    middleName: p.middle_name || undefined,
    lastName: p.last_name,
    secondLastName: p.second_last_name || undefined,
    sex: genderFromDb[(p.gender || '').trim()] || p.gender || '',
    birthDate: p.birthdate,
    civilStatus: maritalFromDb[((p.marital_status || '').trim())] || p.marital_status || 'SOLTERO',
    phone: p.phone,
    email: p.email,
    address: p.address,
    studentType: typeFromDb[((s.STUDENT_TYPE || '').trim())] || s.STUDENT_TYPE || '',
    militaryRank: s.MILITARY_RANK,
    works: s.EMPLOYMENT === "SI" ? "SI" : "NO",
    enrollmentDate: s.REGISTRATION_DATE,
    status: s.STATUS === 1,
    isInUse: (Array.isArray(s.t_professional_practices) && s.t_professional_practices.some(
      (p: any) => p.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO || p.PRACTICES_STATUS === PRACTICES_STATUS.PRE_INSCRITO
    )),
    hasActivePreEnrollment: (Array.isArray(s.t_professional_practices) && s.t_professional_practices.some(p => p.PRACTICES_STATUS === PRACTICES_STATUS.PRE_INSCRITO)),
    currentPracticeStatus: (Array.isArray(s.t_professional_practices) && s.t_professional_practices.length > 0)
      ? Math.max(...s.t_professional_practices.map(p => p.PRACTICES_STATUS))
      : null
  };
};

// ============================================================
// LIST / SEARCH
// ============================================================

export const getStudents = async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '100',
    status,
    search,
    sortField = 'first_name',
    sortOrder = 'asc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Intentar obtener de caché
  const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(req.query)}`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    console.log(`[Cache] Serving students list from cache: ${cacheKey}`);
    return res.json(cachedData);
  }

  try {
    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Búsqueda: resolver person_ids desde t_persons
      let searchPersonIds: number[] | null = null;
      if (search) {
        const searchResults = await personService.searchPersons(search as string);
        searchPersonIds = searchResults.map(p => p.personId);
        if (searchPersonIds.length === 0) {
          // Sin resultados de búsqueda — retornar vacío
          return { data: [], count: 0 };
        }
      }

      let query = supabase
        .from(TABLE_NAME)
        .select(STUDENT_FULL_COLUMNS, { count: 'exact' });

      // Filtro por estado
      if (status !== undefined) {
        query = query.eq('STATUS', status === 'true' || status === '1' ? 1 : 0);
      }

      // Filtro por búsqueda (person_ids)
      if (searchPersonIds) {
        query = query.in('person_id', searchPersonIds);
      }

      // Ordenamiento — si el campo pertenece a t_persons, usar foreignTable
      if (PERSON_SORT_FIELDS.has(sortField as string)) {
        query = query.order(sortField as string, { ascending: sortOrder === 'asc', foreignTable: 't_persons' });
      } else {
        query = query.order(sortField as string, { ascending: sortOrder === 'asc' });
      }

      // Paginación
      query = query.range(offset, offset + limitNum - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data as unknown as DBStudent[], count };
    }, 'getStudents');

    const mappedData = result.data.map(mapDBToFrontend);

    const response = {
      data: mappedData,
      total: result.count,
      page: pageNum,
      limit: limitNum,
      totalPages: result.count ? Math.ceil(result.count / limitNum) : 0
    };

    cacheManager.set(cacheKey, response, 30000);
    res.json(response);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getStudentStats = async (req: Request, res: Response) => {
  try {
    const stats = await dbManager.withRetry(async (supabase) => {
      const totalQuery = supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true });
      const activeQuery = supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('STATUS', 1);

      const [totalRes, activeRes] = await Promise.all([totalQuery, activeQuery]);

      return {
        total: totalRes.count || 0,
        active: activeRes.count || 0
      };
    }, 'getStudentStats');

    res.json(stats);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// CREATE
// ============================================================

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const s = req.body;
    console.log('[Students] Attempting to create student with data:', JSON.stringify(s, null, 2));

    // Validación básica
    if (!s.identificationNumber || !s.firstName || !s.lastName) {
      return res.status(400).json({
        message: 'Error: Faltan campos requeridos (Cédula, Nombres y Apellidos son obligatorios)'
      });
    }

    const studentsCi = `${s.identificationPrefix || 'V'}-${s.identificationNumber}`;

    // Validar edad (Mínimo 16 años)
    if (s.birthDate) {
      const birth = new Date(s.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 16) {
        return res.status(400).json({ message: 'Error: El estudiante debe tener al menos 16 años' });
      }
    }

    // Validar formato de email
    if (s.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(s.email)) {
        return res.status(400).json({ message: 'Error: El formato del correo electrónico no es válido' });
      }
    }

    // Validar duplicado de email (entre distintas personas)
    if (s.email) {
      // Si la CI ya existe, obtener su personId para excluirla de la verificación de email
      const existingPerson = await personService.getPersonByCi(studentsCi);
      const excludePersonId = existingPerson?.personId;
      const emailCheck = await personService.validateUniqueEmail(s.email, excludePersonId);
      if (!emailCheck.available) {
        const msg = `El correo ${s.email} ya está registrado por otra persona`;
        return res.status(409).json({ message: msg });
      }
    }

    const personData = extractPersonData(s);
    const studentData = extractStudentData(s);

    // 2. Crear persona + insertar estudiante en UNA sola operación.
    //    El UNIQUE constraint (person_id) en t_students es la defensa real.
    const data = await dbManager.withRetry(async (supabase) => {
      const newPerson = await personService.findOrCreatePerson(personData, supabase);

      // 3. Insertar registro en t_students con person_id
      const dbRecord = {
        person_id: newPerson.personId,
        STUDENT_TYPE: studentData.STUDENT_TYPE,
        MILITARY_RANK: studentData.MILITARY_RANK,
        EMPLOYMENT: studentData.EMPLOYMENT,
        STATUS: studentData.STATUS,
        REGISTRATION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      const { data: insertedData, error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([dbRecord])
        .select(STUDENT_FULL_COLUMNS)
        .maybeSingle();

      if (insertError?.code === '23505') {
        throw Object.assign(new Error('Ya existe un estudiante registrado con esta cédula'), { code: '409' });
      }
      if (insertError) throw insertError;
      return insertedData as unknown as DBStudent;
    }, 'createStudent');

    // 4. Si la persona ya tiene usuario, vincular USER_ID en t_students
    await dbManager.withRetry(async (supabase) => {
      const { data: existingUser } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('person_id', data.person_id)
        .maybeSingle();

      if (existingUser) {
        await supabase
          .from('t_students')
          .update({ USER_ID: existingUser.USER_ID })
          .eq('STUDENTS_ID', data.STUDENTS_ID);
      }
    }).catch(() => {});

    // Auditoría
    await auditCreate(req, 't_students', { ...personData, ...studentData }, STUDENT_COLUMNS_TO_AUDIT);

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    const appErr = error as AppError;
    if (appErr.code === '409') return res.status(409).json({ message: appErr.message });
    console.error('[Students] Exception in createStudent:', error);
    handleDbError(res, error);
  }
};

// ============================================================
// UPDATE
// ============================================================

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const s = req.body;
    console.log(`[Students] Attempting to update student ${id} with data:`, JSON.stringify(s, null, 2));

    if (!s.identificationNumber || !s.firstName || !s.lastName) {
      return res.status(400).json({
        message: 'Error: Faltan campos requeridos (Cédula, Nombres y Apellidos son obligatorios)'
      });
    }

    const studentsCi = `${s.identificationPrefix || 'V'}-${s.identificationNumber}`;

    // Validar edad
    if (s.birthDate) {
      const birth = new Date(s.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 16) {
        return res.status(400).json({ message: 'Error: El estudiante debe tener al menos 16 años' });
      }
    }

    // Validar email
    if (s.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(s.email)) {
        return res.status(400).json({ message: 'Error: El formato del correo electrónico no es válido' });
      }
    }

    const data = await dbManager.withRetry(async (supabase) => {
      // 0. Obtener el registro actual con JOIN
      const { data: existingData, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_FULL_COLUMNS)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      if (fetchError || !existingData) {
        throw Object.assign(new Error('Estudiante no encontrado'), { code: '404' });
      }

      const existing = existingData as unknown as DBStudent;
      const personId = existing.person_id;

      // 1. Validar duplicados en t_persons (excluyendo a esta persona)
      const ciCheck = await personService.validateUniqueCi(studentsCi, personId);
      if (!ciCheck.available) {
        throw Object.assign(new Error(`La cédula ${studentsCi} ya está registrada por otra persona`), { code: '409' });
      }

      if (s.email) {
        const emailCheck = await personService.validateUniqueEmail(s.email, personId);
        if (!emailCheck.available) {
          throw Object.assign(new Error(`El correo ${s.email} ya está registrado por otra persona`), { code: '409' });
        }
      }

      const personData = extractPersonData(s);
      const studentData = extractStudentData(s);

      // 2. Actualizar t_persons
      await personService.updatePerson(personId, personData, supabase);

      // 3. Actualizar t_students (incluyendo columnas legacy)
      const dbRecord = {
        STUDENT_TYPE: studentData.STUDENT_TYPE,
        MILITARY_RANK: studentData.MILITARY_RANK,
        EMPLOYMENT: studentData.EMPLOYMENT,
        STATUS: studentData.STATUS,
      };

      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(dbRecord)
        .eq('STUDENTS_ID', parseInt(id));

      if (updateError) throw updateError;

      // 4. Obtener registro actualizado
      const { data: updatedData, error: refetchError } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_FULL_COLUMNS)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      if (refetchError) throw refetchError;

      // Auditoría
      await auditUpdate(req, 't_students', existing as unknown as Record<string, any>, dbRecord, STUDENT_COLUMNS_TO_AUDIT);

      return updatedData as unknown as DBStudent;
    }, 'updateStudent');

    cacheManager.deleteByPrefix(CACHE_PREFIX);
    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    const appErr = error as AppError;
    if (appErr.code === '404') {
      return res.status(404).json({ message: appErr.message });
    }
    if (appErr.code === '409') {
      return res.status(409).json({ message: appErr.message });
    }
    console.error('[Students] Exception in updateStudent:', error);
    handleDbError(res, error);
  }
};

// ============================================================
// DELETE
// ============================================================

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      // Obtener datos actuales para auditoría
      const { data: deletedData } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_FULL_COLUMNS)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      // Eliminar de t_students (NO eliminar de t_persons — otras entidades pueden referenciarlo)
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('STUDENTS_ID', parseInt(id));

      if (error) throw error;

      if (deletedData) {
        await auditDelete(req, 't_students', deletedData as unknown as Record<string, any>, STUDENT_COLUMNS_TO_AUDIT);
      }
    }, 'deleteStudent');

    cacheManager.deleteByPrefix(CACHE_PREFIX);
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// TOGGLE STATUS
// ============================================================

export const toggleStudentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      // Obtener estado anterior (incluye person_id)
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('STUDENTS_ID, STATUS, person_id')
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      if (!oldData) {
        throw Object.assign(new Error('Estudiante no encontrado'), { code: '404' });
      }

      // Actualizar estado en t_students
      const { data: updatedData, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('STUDENTS_ID', parseInt(id))
        .select(STUDENT_FULL_COLUMNS)
        .single();

      if (error) throw error;

      // También actualizar estado en t_persons
      if (oldData.person_id) {
        await personService.togglePersonStatus(oldData.person_id, status ? 1 : 0);
      }

      // Auditoría
      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_students', id, oldData.STATUS, status ? 1 : 0);
      }

      return updatedData;
    });

    cacheManager.deleteByPrefix(CACHE_PREFIX);
    res.json(data);
  } catch (error: unknown) {
    if ((error as AppError).code === '404') {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    handleDbError(res, error);
  }
};

// ============================================================
// GET BY ID
// ============================================================

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_FULL_COLUMNS)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      if (error) throw error;
      return data as unknown as DBStudent;
    }, 'getStudentById');

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// CHECK AVAILABILITY
// ============================================================

export const checkIdAvailability = async (req: Request, res: Response) => {
  try {
    const { type, value, excludeId } = req.query;

    if (!type || !value) {
      return res.status(400).json({ message: 'Faltan parámetros: type y value son requeridos' });
    }

    if (type === 'ci') {
      const result = await personService.validateUniqueCi(value as string, excludeId ? parseInt(excludeId as string) : undefined);
      return res.json({ ...result, studentId: result.personId });
    }

    if (type === 'email') {
      const result = await personService.validateUniqueEmail(value as string, excludeId ? parseInt(excludeId as string) : undefined);
      return res.json({ ...result, studentId: result.personId });
    }

    return res.status(400).json({ message: 'Tipo de validación no válido. Use "ci" o "email"' });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// GET BY CI
// ============================================================

export const getStudentByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;

    if (!ci) {
      return res.status(400).json({ message: 'La cédula es requerida' });
    }

    // Buscar persona por CI
    const person = await personService.getPersonByCi(ci);

    if (!person) {
      return res.status(404).json({ message: 'Estudiante no encontrado', data: null });
    }

    // Buscar estudiante por person_id
    const student = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_FULL_COLUMNS)
        .eq('person_id', person.personId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as DBStudent | null;
    }, 'getStudentByCi');

    if (!student) {
      // Persona existe pero no como estudiante → devolver datos de persona
      // para que el frontend pueda pre-llenar el formulario
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
          birthDate: person.birthDate || '',
          gender: person.gender || '',
          address: person.address || '',
          maritalStatus: person.maritalStatus || '',
        }
      });
    }

    res.json({ data: mapDBToFrontend(student) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// LOOKUP CI (External API)
// ============================================================

export const lookupStudentCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;

    if (!ci) {
      return res.status(400).json({ message: 'La cédula es requerida' });
    }

    // Parse prefix y número: "V-12345678" → nacionalidad="V", cedula="12345678"
    const parts = ci.split('-');
    const nacionalidad = parts[0]?.toUpperCase() || 'V';
    const cedula = parts[1] || ci;

    // Validar que la cédula solo contenga dígitos
    if (!/^\d+$/.test(cedula)) {
      return res.status(400).json({ message: 'La cédula debe contener solo números' });
    }

    const result = await lookupCedula(nacionalidad, cedula);

    if (!result) {
      // No es un error — la API externa no está configurada o no encontró datos
      return res.status(200).json({ data: null });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('[lookupStudentCi] Error:', error);
    res.status(500).json({ message: 'Error al consultar la cédula en fuente externa' });
  }
};

// ============================================================
// CHANGE REGISTRATION
// ============================================================

interface ChangeRegistrationBody {
  changeType: 'institution' | 'tutor' | 'regime';
  newValue: string;
  reason?: string;
}

export const changeStudentRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { changeType, newValue, reason } = req.body as ChangeRegistrationBody;
    const adminId = req.user?.userId;

    if (!id) return res.status(400).json({ message: 'ID del estudiante requerido' });
    if (!changeType || !newValue) return res.status(400).json({ message: 'Tipo de cambio y nuevo valor son requeridos' });

    const validTypes = ['institution', 'tutor', 'regime'];
    if (!validTypes.includes(changeType)) return res.status(400).json({ message: 'Tipo de cambio inválido' });

    // Obtener estudiante con datos personales
    const student = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`${STUDENT_BASE_COLUMNS}, t_persons!inner(ci, first_name, last_name, email)`)
        .eq('STUDENTS_ID', parseInt(id))
        .maybeSingle();
      if (error) throw error;
      return data as any;
    }, 'getStudentForChange');

    if (!student) return res.status(404).json({ message: 'Estudiante no encontrado' });

    // Verificar prácticas activas
    const activePractices = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
        .eq('STUDENTS_ID', parseInt(id))
        .in('PRACTICES_STATUS', [PRACTICES_STATUS.PRE_INSCRITO, PRACTICES_STATUS.INSCRITO]);
      if (error) throw error;
      return data;
    }, 'checkActivePractices');

    const hasActivePractice = activePractices && activePractices.length > 0;

    const pendingEvaluations = await dbManager.withRetry(async (supabase) => {
      // Buscar evaluaciones activas en prácticas del estudiante
      const { data, error } = await supabase
        .from('t_evaluation')
        .select('EVALUATION_ID, STATUS, t_professional_practices!inner(STUDENTS_ID)')
        .eq('t_professional_practices.STUDENTS_ID', parseInt(id))
        .eq('STATUS', 1);
      if (error) throw error;
      return data;
    }, 'checkPendingEvaluations');

    const hasPendingEvaluations = pendingEvaluations && pendingEvaluations.length > 0;

    if (changeType === 'institution' && hasActivePractice) {
      return res.status(400).json({
        message: 'No se puede cambiar la institución. El estudiante tiene una práctica activa.',
        code: 'ACTIVE_PRACTICE_BLOCK'
      });
    }

    if (changeType === 'tutor' && hasPendingEvaluations) {
      return res.status(400).json({
        message: 'No se puede cambiar el tutor. El estudiante tiene evaluaciones pendientes.',
        code: 'PENDING_EVALUATIONS_BLOCK'
      });
    }

    let updateData: Record<string, unknown> = {};
    let oldValue = '';
    let newValueFormatted = newValue;

    if (changeType === 'tutor') {
      const tutor = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_tutors')
          .select('TUTOR_ID, t_persons!inner(first_name, last_name)')
          .eq('TUTOR_ID', parseInt(newValue))
          .maybeSingle();
        if (error) throw error;
        return data;
      }, 'verifyTutor');

      if (!tutor) return res.status(404).json({ message: 'Tutor no encontrado' });

      // Buscar la práctica activa del estudiante para obtener la asignación actual
      const activePractice = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_professional_practices')
          .select('PROFESSIONAL_PRACTICE_ID')
          .eq('STUDENTS_ID', parseInt(id))
          .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
          .eq('STATUS', 1)
          .maybeSingle();
        if (error) throw error;
        return data as { PROFESSIONAL_PRACTICE_ID: number } | null;
      }, 'getActivePracticeForTutorChange');

      if (!activePractice) {
        return res.status(400).json({ message: 'El estudiante no tiene una práctica activa (INSCRITO).' });
      }

      const currentAssignment = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_professional_practices_tutor')
          .select(`
            TUTOR_ID,
            ACTIVE,
            t_tutors!inner (
              TUTOR_ID,
              t_persons!inner (first_name, last_name)
            )
          `)
          .eq('PROFESSIONAL_PRACTICE_ID', activePractice.PROFESSIONAL_PRACTICE_ID)
          .eq('TUTOR_TYPE', 'ACADEMICO')
          .eq('ACTIVE', true)
          .maybeSingle();
        if (error) throw error;
        return data;
      }, 'getCurrentTutor');

      const currentTutorPerson = (currentAssignment as any)?.t_tutors?.t_persons;
      oldValue = currentTutorPerson ? `${currentTutorPerson.first_name || ''} ${currentTutorPerson.last_name || ''}`.trim() : 'Sin tutor';
      newValueFormatted = `${(tutor as any).t_persons.first_name} ${(tutor as any).t_persons.last_name}`.trim();

      await dbManager.withRetry(async (supabase) => {
        const { error } = await supabase
          .from('t_professional_practices_tutor')
          .update({ TUTOR_ID: parseInt(newValue) })
          .eq('PROFESSIONAL_PRACTICE_ID', activePractice.PROFESSIONAL_PRACTICE_ID)
          .eq('TUTOR_TYPE', 'ACADEMICO')
          .eq('ACTIVE', true);
        if (error) throw error;
      }, 'updateTutorAssignment');
    } else if (changeType === 'institution') {
      const institution = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_institution')
          .select('INSTITUTION_ID, INSTITUTION_NAME')
          .eq('INSTITUTION_ID', parseInt(newValue))
          .maybeSingle();
        if (error) throw error;
        return data;
      }, 'verifyInstitution');

      if (!institution) return res.status(404).json({ message: 'Institución no encontrada' });

      // Obtener práctica activa del estudiante
      const activeInstPractice = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_professional_practices')
          .select('PROFESSIONAL_PRACTICE_ID, INSTITUTION_ID')
          .eq('STUDENTS_ID', parseInt(id))
          .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
          .eq('STATUS', 1)
          .maybeSingle();
        if (error) throw error;
        return data as { PROFESSIONAL_PRACTICE_ID: number; INSTITUTION_ID: number | null } | null;
      }, 'getActivePracticeForInstChange');

      if (!activeInstPractice) {
        return res.status(400).json({ message: 'El estudiante no tiene una práctica activa (INSCRITO).' });
      }

      oldValue = activeInstPractice.INSTITUTION_ID ? String(activeInstPractice.INSTITUTION_ID) : 'Sin institución';
      newValueFormatted = institution.INSTITUTION_NAME;

      await dbManager.withRetry(async (supabase) => {
        const { error } = await supabase
          .from('t_professional_practices')
          .update({ INSTITUTION_ID: parseInt(newValue) })
          .eq('PROFESSIONAL_PRACTICE_ID', activeInstPractice.PROFESSIONAL_PRACTICE_ID);
        if (error) throw error;
      }, 'updateStudentInstitution');
    }

    if (changeType === 'regime') {
      const { data: oldStudent } = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('STUDENTS_ID, STUDENT_TYPE, MILITARY_RANK, EMPLOYMENT')
          .eq('STUDENTS_ID', parseInt(id))
          .single();
        if (error) throw error;
        return data;
      }, 'getStudentForRegime');

      if (!oldStudent) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }

      await dbManager.withRetry(async (supabase) => {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update(updateData)
          .eq('STUDENTS_ID', parseInt(id));
        if (error) throw error;
      }, 'updateStudentRegime');
    }

    // Registrar en activity log
    const personInfo = student.t_persons;
    await dbManager.withRetry(async (supabase) => {
      await supabase.from('t_activity_logs').insert({
        USER_ID: adminId,
        ACTION: `CAMBIO_REGISTRO_${changeType.toUpperCase()}`,
        ACTION_TYPE: 'UPDATE',
        ENTITY_TYPE: 'STUDENT',
        ENTITY_ID: parseInt(id),
        DETAILS: JSON.stringify({
          changeType,
          oldValue,
          newValue: newValueFormatted,
          reason: reason || 'Sin motivo especificado',
          studentCi: personInfo.ci,
          studentName: `${personInfo.first_name} ${personInfo.last_name}`
        }),
        IP_ADDRESS: req.ip,
        USER_AGENT: req.headers['user-agent']
      });
    }, 'logRegistrationChange');

    res.json({
      success: true,
      message: `Cambio de ${changeType} realizado exitosamente`,
      data: { changeType, oldValue, newValue: newValueFormatted, reason }
    });
  } catch (error: unknown) {
    console.error('[changeStudentRegistration] Error:', error);
    handleDbError(res, error);
  }
};

// ============================================================
// IMPORT / EXPORT
// ============================================================

export const importStudents = async (req: Request, res: Response) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron estudiantes para importar' });
    }

    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const studentData of students) {
      try {
        // 1. Buscar persona existente o crear nueva en t_persons
        const ci = `${studentData.identificationPrefix || 'V'}-${studentData.identificationNumber}`;
        const personRecord = await personService.findOrCreatePerson({
          ci,
          firstName: sanitizeText(studentData.firstName) ?? '',
          middleName: sanitizeText(studentData.middleName),
          lastName: sanitizeText(studentData.lastName) ?? '',
          secondLastName: sanitizeText(studentData.secondLastName),
          gender: genderToDb[studentData.sex?.toUpperCase()] || 'O',
          birthDate: studentData.birthDate || null,
          maritalStatus: maritalToDb[studentData.civilStatus?.toUpperCase()] || 'S',
          phone: studentData.phone || null,
          email: studentData.email || null,
          address: sanitizeText(studentData.address),
        });

        // 2. Crear estudiante
        const { data, error } = await supabase
          .from('t_students')
          .insert({
            person_id: personRecord.personId,
            STUDENT_TYPE: typeToDb[studentData.studentType?.toUpperCase()] || 'CIV',
            MILITARY_RANK: studentData.militaryRank || 'NO APLICA',
            EMPLOYMENT: studentData.works || 'NO',
            STATUS: true,
          })
          .select();

        if (error) {
          results.failed++;
          results.errors.push(`Error con ${studentData.identificationNumber}: ${error.message}`);
        } else {
          results.imported++;
        }
      } catch (err: unknown) {
        results.failed++;
        const error = err as Error;
        results.errors.push(`Error con ${studentData.identificationNumber}: ${error.message}`);
      }
    }

    res.json(results);
  } catch (error: unknown) {
    console.error('[importStudents] Error:', error);
    handleDbError(res, error);
  }
};

export const exportStudents = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const { data, error } = await supabase
      .from('t_students')
      .select(`
        STUDENTS_ID, STUDENT_TYPE, MILITARY_RANK, EMPLOYMENT, REGISTRATION_DATE, STATUS,
        t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status)
      `)
      .order('first_name', { ascending: true, foreignTable: 't_persons' });

    if (error) {
      console.error('[exportStudents] Error:', error);
      return res.status(500).json({ success: false, message: 'Error al exportar estudiantes' });
    }

    let filteredData = (data || []) as any[];
    if (status !== undefined) {
      filteredData = filteredData.filter((s: any) => s.STATUS === (status === 'true' ? 1 : 0));
    }

    const formattedData = filteredData.map((student: any) => {
      const p = student.t_persons;
      return {
        identificationPrefix: p.ci.split('-')[0],
        identificationNumber: p.ci.split('-')[1],
        firstName: p.first_name,
        middleName: p.middle_name,
        lastName: p.last_name,
        secondLastName: p.second_last_name,
        sex: genderFromDb[p.gender.trim()] || p.gender,
        birthDate: p.birthdate,
        civilStatus: maritalFromDb[p.marital_status?.trim() || ''] || p.marital_status,
        phone: p.phone,
        email: p.email,
        address: p.address,
        studentType: typeFromDb[student.STUDENT_TYPE.trim()] || student.STUDENT_TYPE,
        militaryRank: student.MILITARY_RANK,
        works: student.EMPLOYMENT,
        enrollmentDate: student.REGISTRATION_DATE,
        status: student.STATUS
      };
    });

    res.json({ success: true, data: formattedData });
  } catch (error: unknown) {
    console.error('[exportStudents] Error:', error);
    handleDbError(res, error);
  }
};

// ============================================================
// FULL EXPORT (JSON con todas las relaciones)
// ============================================================

export const exportFullStudents = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'json';
    const svc = await import('../services/export.service.js');

    if (format === 'sql') {
      const sql = await svc.exportStudentsSql();
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="estudiantes-${new Date().toISOString().split('T')[0]}.sql"`);
      return res.send(sql);
    }
    if (format === 'csv') {
      const csv = await svc.exportStudentsCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="estudiantes-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }
    if (format === 'xlsx') {
      const buffer = await svc.exportStudentsXlsx();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="estudiantes-${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(buffer);
    }

    const data = await svc.exportStudents();
    res.json(data);
  } catch (error: unknown) {
    console.error('[exportFullStudents] Error:', error);
    handleDbError(res, error);
  }
};
