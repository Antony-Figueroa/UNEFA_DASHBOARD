import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { supabase } from '../lib/supabase.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_students';
const CACHE_PREFIX = 'students:';

const STUDENT_COLUMNS_TO_AUDIT = [
  'STUDENTS_CI', 'NAME', 'SECOND_NAME', 'SURNAME', 'SECOND_SURNAME',
  'GENDER', 'BIRTHDATE', 'MARITAL_STATUS', 'CONTACT_PHONE', 'EMAIL',
  'ADDRESS', 'CAREER_ID', 'SEMESTER', 'SECTION', 'REGIME',
  'STUDENT_TYPE', 'MILITARY_RANK', 'EMPLOYMENT', 'STATUS'
];

// Columnas base sin relaciones
const STUDENT_COLUMNS_BASE = `
  STUDENTS_ID, 
  STUDENTS_CI, 
  NAME, 
  SECOND_NAME, 
  SURNAME, 
  SECOND_SURNAME, 
  GENDER, 
  BIRTHDATE, 
  MARITAL_STATUS, 
  CONTACT_PHONE, 
  EMAIL, 
  ADDRESS, 
  CAREER_ID, 
  SEMESTER, 
  SECTION, 
  REGIME, 
  STUDENT_TYPE, 
  MILITARY_RANK, 
  EMPLOYMENT, 
  REGISTRATION_DATE, 
  STATUS
`;

// Columnas con relaciones para lectura
const STUDENT_COLUMNS = `${STUDENT_COLUMNS_BASE}, t_career(CAREER_NAME), t_professional_practices(INTERNSHIP_STATUS, PRACTICES_STATUS)`;

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
    userMessage = 'Error: Registro no encontrado';
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

interface DBStudent {
  STUDENTS_ID: number;
  STUDENTS_CI: string;
  NAME: string;
  SECOND_NAME: string;
  SURNAME: string;
  SECOND_SURNAME: string;
  GENDER: string;
  BIRTHDATE: string;
  MARITAL_STATUS: string;
  CONTACT_PHONE: string;
  EMAIL: string;
  ADDRESS: string;
  CAREER_ID: number;
  t_career?: { CAREER_NAME: string } | { CAREER_NAME: string }[];
  t_professional_practices?: { INTERNSHIP_STATUS: number, PRACTICES_STATUS: number }[];
  SEMESTER: number;
  SECTION: string;
  REGIME: string;
  STUDENT_TYPE: string;
  MILITARY_RANK: string;
  EMPLOYMENT: boolean;
  REGISTRATION_DATE: string;
  STATUS: number;
}

export const getStudents = async (req: Request, res: Response) => {
  const { 
    page = '1', 
    limit = '100', 
    status, 
    search, 
    sortField = 'NAME', 
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
      // 1. Obtener IDs de estudiantes que tienen prácticas culminadas y aprobadas para excluirlos
      const { data: excludedPractices } = await supabase
        .from('t_professional_practices')
        .select('STUDENTS_ID')
        .eq('INTERNSHIP_STATUS', 2)
        .eq('PRACTICES_STATUS', 3);

      const excludedIds = (excludedPractices || []).map(p => p.STUDENTS_ID);

      let query = supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS, { count: 'exact' });

      // Excluir los IDs encontrados
      if (excludedIds.length > 0) {
        query = query.not('STUDENTS_ID', 'in', `(${excludedIds.join(',')})`);
      }

      // Filtrado por estado
      if (status !== undefined) {
        query = query.eq('STATUS', status === 'true' || status === '1' ? 1 : 0);
      }

      // Búsqueda por nombre o CI
      if (search) {
        query = query.or(`NAME.ilike.%${search}%,SURNAME.ilike.%${search}%,STUDENTS_CI.ilike.%${search}%`);
      }

      // Ordenamiento
      query = query.order(sortField as string, { ascending: sortOrder === 'asc' });

      // Paginación
      query = query.range(offset, offset + limitNum - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      
      return { data: data as unknown as DBStudent[], count };
    }, 'getStudents');

    // Mapear de DB a Frontend
    const mappedData = result.data.map(mapDBToFrontend);

    const response = {
      data: mappedData,
      total: result.count,
      page: pageNum,
      limit: limitNum,
      totalPages: result.count ? Math.ceil(result.count / limitNum) : 0
    };

    // Guardar en caché por 30 segundos para datos de lista
    cacheManager.set(cacheKey, response, 30000);

    res.json(response);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getStudentStats = async (req: Request, res: Response) => {
  try {
    const { institutionId, } = req.query;

    const stats = await dbManager.withRetry(async (supabase) => {
      // 1. Total Students
      const totalQuery = supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true });
      
      // 2. Active Students
      const activeQuery = supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('STATUS', 1);

      // Filters (This is basic, might need joins depending on DB schema)
      if (institutionId) {
        // Assuming there is a relation or a field. Let's check the schema if needed.
        // For now, let's stick to simple counts if fields are not obvious.
      }

      const [totalRes, activeRes] = await Promise.all([
        totalQuery,
        activeQuery
      ]);

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

const mapDBToFrontend = (s: DBStudent) => {
  // Mapeo inverso para mostrar nombres completos en el frontend si el DB usa códigos
  const genderMap: Record<string, string> = { 'M': 'MASCULINO', 'F': 'FEMENINO', 'O': 'OTRO' };
  const maritalMap: Record<string, string> = { 'S': 'SOLTERO', 'C': 'CASADO', 'D': 'DIVORCIADO', 'V': 'VIUDO' };
  const typeMap: Record<string, string> = { 'CIV': 'CIVIL', 'MIL': 'MILITAR' };
  const regimeMap: Record<string, string> = { 'D1': 'DIURNO', 'N1': 'NOCTURNO', 'M1': 'MIXTO' };

  return {
    studentId: String(s.STUDENTS_ID),
    identificationPrefix: s.STUDENTS_CI.split('-')[0],
    identificationNumber: s.STUDENTS_CI.split('-')[1],
    firstName: s.NAME,
    middleName: s.SECOND_NAME || undefined,
    lastName: s.SURNAME,
    secondLastName: s.SECOND_SURNAME || undefined,
    sex: genderMap[s.GENDER.trim()] || s.GENDER,
    birthDate: s.BIRTHDATE,
    civilStatus: maritalMap[s.MARITAL_STATUS.trim()] || s.MARITAL_STATUS,
    phone: s.CONTACT_PHONE,
    email: s.EMAIL,
    address: s.ADDRESS,
    careerId: String(s.CAREER_ID),
    careerName: Array.isArray(s.t_career) ? s.t_career[0]?.CAREER_NAME : s.t_career?.CAREER_NAME,
    semester: String(s.SEMESTER),
    section: s.SECTION,
    regime: regimeMap[s.REGIME.trim()] || s.REGIME,
    studentType: typeMap[s.STUDENT_TYPE.trim()] || s.STUDENT_TYPE,
    militaryRank: s.MILITARY_RANK,
    works: s.EMPLOYMENT ? (String(s.EMPLOYMENT).toUpperCase() === 'SI' || s.EMPLOYMENT === true ? "SI" : "NO") : "NO",
    enrollmentDate: s.REGISTRATION_DATE,
    status: s.STATUS === 1,
    isInUse: (Array.isArray(s.t_professional_practices) && s.t_professional_practices.length > 0)
  };
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const s = req.body;
    console.log('[Students] Attempting to create student with data:', JSON.stringify(s, null, 2));
    
    // Validación básica de campos requeridos
    if (!s.identificationNumber || !s.firstName || !s.lastName || !s.careerId) {
      return res.status(400).json({ 
        message: 'Error: Faltan campos requeridos (Cédula, Nombres, Apellidos y Carrera son obligatorios)' 
      });
    }

    const careerId = parseInt(s.careerId);
    if (isNaN(careerId)) {
      return res.status(400).json({ message: 'Error: El ID de carrera debe ser un número válido' });
    }

    const studentsCi = `${s.identificationPrefix || 'V'}-${s.identificationNumber}`;

    // 1. Validar edad (Mínimo 16 años)
    if (s.birthDate) {
      const birth = new Date(s.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 16) {
        return res.status(400).json({ message: 'Error: El estudiante debe tener al menos 16 años' });
      }
    }

    // 2. Validar formato de correo (opcional, ya que s.email puede ser null)
    if (s.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(s.email)) {
        return res.status(400).json({ 
          message: 'Error: El formato del correo electrónico no es válido' 
        });
      }
    }

    // 3. Validar duplicados (Cédula y Email)
    const duplicateCheck = await dbManager.withRetry(async (supabase) => {
      // Verificar CI
      const { data: existingStudentCi } = await supabase
        .from(TABLE_NAME)
        .select('STUDENTS_ID, STATUS, STUDENTS_CI, NAME, SURNAME')
        .eq('STUDENTS_CI', studentsCi)
        .maybeSingle();

      if (existingStudentCi) {
        console.warn(`[Students] Duplicate registration attempt (CI): ${studentsCi} from IP: ${req.ip} at ${new Date().toISOString()}`);
        console.warn(`[Students] Attempt data: ${JSON.stringify(s)}`);
        
        if (existingStudentCi.STATUS === 0) {
          return { 
            field: 'Cédula', 
            message: `La cédula ${studentsCi} ya está registrada pero el estudiante está INACTIVO. ¿Desea reactivarlo?`,
            reactivable: true,
            studentId: existingStudentCi.STUDENTS_ID
          };
        }
        return { field: 'Cédula', message: `La cédula ${studentsCi} ya está registrada` };
      }

      // Verificar Email (case-insensitive)
      if (s.email) {
        const { data: existingStudentEmail } = await supabase
          .from(TABLE_NAME)
          .select('STUDENTS_ID, STATUS, EMAIL')
          .ilike('EMAIL', s.email)
          .maybeSingle();

        if (existingStudentEmail) {
          console.warn(`[Students] Duplicate registration attempt (Email): ${s.email} from IP: ${req.ip} at ${new Date().toISOString()}`);
          console.warn(`[Students] Attempt data: ${JSON.stringify(s)}`);

          if (existingStudentEmail.STATUS === 0) {
            return { 
              field: 'Email', 
              message: `El correo ${s.email} ya está registrado pero el estudiante está INACTIVO. ¿Desea reactivarlo?`,
              reactivable: true,
              studentId: existingStudentEmail.STUDENTS_ID
            };
          }
          return { field: 'Email', message: `El correo ${s.email} ya está registrado` };
        }
      }

      return null;
    }, 'checkStudentDuplicates');

    if (duplicateCheck) {
      return res.status(400).json({ 
        message: duplicateCheck.message,
        reactivable: duplicateCheck.reactivable,
        studentId: duplicateCheck.studentId
      });
    }

    // Mapeo de valores de frontend a códigos de base de datos
    const genderMap: Record<string, string> = { 'MASCULINO': 'M', 'FEMENINO': 'F', 'OTRO': 'O' };
    const maritalMap: Record<string, string> = { 'SOLTERO': 'S', 'CASADO': 'C', 'DIVORCIADO': 'D', 'VIUDO': 'V' };
    const typeMap: Record<string, string> = { 'CIVIL': 'CIV', 'MILITAR': 'MIL' };
    const regimeMap: Record<string, string> = { 'DIURNO': 'D1', 'NOCTURNO': 'N1', 'MIXTO': 'M1' };

    const dbData = {
      STUDENTS_CI: studentsCi,
      NAME: s.firstName,
      SECOND_NAME: s.middleName || null,
      SURNAME: s.lastName,
      SECOND_SURNAME: s.secondLastName || null,
      GENDER: genderMap[s.sex?.toUpperCase()] || 'O',
      BIRTHDATE: s.birthDate,
      CONTACT_PHONE: s.phone,
      EMAIL: s.email,
      ADDRESS: s.address,
      MARITAL_STATUS: maritalMap[s.civilStatus?.toUpperCase()] || 'S',
      CAREER_ID: careerId,
      SEMESTER: s.semester ? String(s.semester) : '1',
      SECTION: s.section ? String(s.section) : '1',
      REGIME: regimeMap[s.regime?.toUpperCase()] || 'D1',
      STUDENT_TYPE: typeMap[s.studentType?.toUpperCase()] || 'CIV',
      MILITARY_RANK: s.militaryRank || null,
      EMPLOYMENT: s.works === "SI" ? "SI" : "NO",
      STATUS: s.status !== false ? 1 : 0,
      REGISTRATION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    console.log('[Students] Final DB data to insert:', JSON.stringify(dbData, null, 2));

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Insertar el registro
      const { data: insertedData, error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select('STUDENTS_ID')
        .single();

      if (insertError) {
        console.error('[Students] Insert error:', insertError);
        throw insertError;
      }

      // 2. Obtener el registro completo con la relación t_career
      const { data, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS)
        .eq('STUDENTS_ID', insertedData.STUDENTS_ID)
        .single();

      if (fetchError) {
        console.error('[Students] Fetch after insert error:', fetchError);
        throw fetchError;
      }
      return data as unknown as DBStudent;
    }, 'createStudent');

    // Registrar auditoría
    await auditCreate(req, 't_students', dbData, STUDENT_COLUMNS_TO_AUDIT);

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    console.error('[Students] Exception in createStudent:', error);
    handleDbError(res, error);
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const s = req.body;
    console.log(`[Students] Attempting to update student ${id} with data:`, JSON.stringify(s, null, 2));

    // Validación básica de campos requeridos
    if (!s.identificationNumber || !s.firstName || !s.lastName || !s.careerId) {
      return res.status(400).json({ 
        message: 'Error: Faltan campos requeridos (Cédula, Nombres, Apellidos y Carrera son obligatorios)' 
      });
    }

    const careerId = parseInt(s.careerId);
    if (isNaN(careerId)) {
      return res.status(400).json({ message: 'Error: El ID de carrera debe ser un número válido' });
    }

    const studentsCi = `${s.identificationPrefix || 'V'}-${s.identificationNumber}`;

    // 1. Validar edad (Mínimo 16 años)
    if (s.birthDate) {
      const birth = new Date(s.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 16) {
        return res.status(400).json({ message: 'Error: El estudiante debe tener al menos 16 años' });
      }
    }

    // 2. Validar formato de correo (opcional, ya que s.email puede ser null)
    if (s.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(s.email)) {
        return res.status(400).json({ 
          message: 'Error: El formato del correo electrónico no es válido' 
        });
      }
    }

    // 3. Validar duplicados (Cédula y Email) excluyendo al estudiante actual
    const duplicateCheck = await dbManager.withRetry(async (supabase) => {
      // Verificar CI
      const { data: existingStudentCi } = await supabase
        .from(TABLE_NAME)
        .select('STUDENTS_ID, STATUS')
        .eq('STUDENTS_CI', studentsCi)
        .neq('STUDENTS_ID', parseInt(id))
        .maybeSingle();

      if (existingStudentCi) {
        console.warn(`[Students] Duplicate update attempt (CI): ${studentsCi} by student ID: ${id} from IP: ${req.ip} at ${new Date().toISOString()}`);
        return { field: 'Cédula', message: `La cédula ${studentsCi} ya está registrada por otro estudiante` };
      }

      // Verificar Email (case-insensitive)
      if (s.email) {
        const { data: existingStudentEmail } = await supabase
          .from(TABLE_NAME)
          .select('STUDENTS_ID, STATUS')
          .ilike('EMAIL', s.email)
          .neq('STUDENTS_ID', parseInt(id))
          .maybeSingle();

        if (existingStudentEmail) {
          console.warn(`[Students] Duplicate update attempt (Email): ${s.email} by student ID: ${id} from IP: ${req.ip} at ${new Date().toISOString()}`);
          return { field: 'Email', message: `El correo ${s.email} ya está registrado por otro estudiante` };
        }
      }

      return null;
    }, 'checkStudentDuplicatesUpdate');

    if (duplicateCheck) {
      return res.status(400).json({ message: duplicateCheck.message });
    }

    // Mapeo de valores de frontend a códigos de base de datos
    const genderMap: Record<string, string> = { 'MASCULINO': 'M', 'FEMENINO': 'F', 'OTRO': 'O' };
    const maritalMap: Record<string, string> = { 'SOLTERO': 'S', 'CASADO': 'C', 'DIVORCIADO': 'D', 'VIUDO': 'V' };
    const typeMap: Record<string, string> = { 'CIVIL': 'CIV', 'MILITAR': 'MIL' };
    const regimeMap: Record<string, string> = { 'DIURNO': 'D1', 'NOCTURNO': 'N1', 'MIXTO': 'M1' };

    const dbData = {
      STUDENTS_CI: studentsCi,
      NAME: s.firstName,
      SECOND_NAME: s.middleName || null,
      SURNAME: s.lastName,
      SECOND_SURNAME: s.secondLastName || null,
      GENDER: genderMap[s.sex?.toUpperCase()] || 'O',
      BIRTHDATE: s.birthDate,
      CONTACT_PHONE: s.phone,
      EMAIL: s.email,
      ADDRESS: s.address,
      MARITAL_STATUS: maritalMap[s.civilStatus?.toUpperCase()] || 'S',
      CAREER_ID: careerId,
      SEMESTER: s.semester ? String(s.semester) : '1',
      SECTION: s.section ? String(s.section) : '1',
      REGIME: regimeMap[s.regime?.toUpperCase()] || 'D1',
      STUDENT_TYPE: typeMap[s.studentType?.toUpperCase()] || 'CIV',
      MILITARY_RANK: s.militaryRank || null,
      EMPLOYMENT: s.works === "SI" ? "SI" : "NO",
      STATUS: s.status !== false ? 1 : 0
    };

    console.log('[Students] Final DB data to update:', JSON.stringify(dbData, null, 2));

    const data = await dbManager.withRetry(async (supabase) => {
      // 0. Obtener datos antiguos para auditoría
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS_BASE)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      // 1. Actualizar el registro
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('STUDENTS_ID', parseInt(id));

      if (updateError) {
        console.error('[Students] Update error:', updateError);
        throw updateError;
      }

      // 2. Obtener el registro actualizado con la relación t_career
      const { data, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      if (fetchError) {
        console.error('[Students] Fetch after update error:', fetchError);
        throw fetchError;
      }

      // Registrar auditoría
      if (oldData) {
        await auditUpdate(req, 't_students', oldData as Record<string, any>, dbData, STUDENT_COLUMNS_TO_AUDIT);
      }

      return data as unknown as DBStudent;
    }, 'updateStudent');

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    console.error('[Students] Exception in updateStudent:', error);
    handleDbError(res, error);
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      // Obtener datos antes de eliminar para auditoría
      const { data: deletedData } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS_BASE)
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('STUDENTS_ID', parseInt(id));

      if (error) throw error;

      // Registrar auditoría
      if (deletedData) {
        await auditDelete(req, 't_students', deletedData as Record<string, any>, STUDENT_COLUMNS_TO_AUDIT);
      }
    }, 'deleteStudent');

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const toggleStudentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      // Obtener estado anterior
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('STATUS')
        .eq('STUDENTS_ID', parseInt(id))
        .single();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('STUDENTS_ID', parseInt(id))
        .select()
        .single();

      if (error) throw error;

      // Registrar auditoría de cambio de estado
      if (oldData && oldData.STATUS !== (status ? 1 : 0)) {
        await auditStatusChange(req, 't_students', id, oldData.STATUS, status ? 1 : 0);
      }

      return data;
    });

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS)
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

export const checkIdAvailability = async (req: Request, res: Response) => {
  try {
    const { type, value, excludeId } = req.query;
    
    if (!type || !value) {
      return res.status(400).json({ message: 'Faltan parámetros: type y value son requeridos' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      let query = supabase
        .from(TABLE_NAME)
        .select('STUDENTS_ID, STATUS');

      if (type === 'ci') {
        query = query.eq('STUDENTS_CI', value as string);
      } else if (type === 'email') {
        query = query.ilike('EMAIL', value as string);
      } else {
        throw new Error('Tipo de validación no válido');
      }

      if (excludeId) {
        query = query.neq('STUDENTS_ID', parseInt(excludeId as string));
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      
      return data;
    }, 'checkAvailability');

    res.json({
      available: !result,
      status: result?.STATUS,
      studentId: result?.STUDENTS_ID
    });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getStudentByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;
    
    if (!ci) {
      return res.status(400).json({ message: 'La cédula es requerida' });
    }

    const student = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('STUDENTS_CI', ci)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }, 'getStudentByCi');

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado', data: null });
    }

    res.json({ data: student });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

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

    if (!id) {
      return res.status(400).json({ message: 'ID del estudiante requerido' });
    }

    if (!changeType || !newValue) {
      return res.status(400).json({ message: 'Tipo de cambio y nuevo valor son requeridos' });
    }

    const validTypes = ['institution', 'tutor', 'regime'];
    if (!validTypes.includes(changeType)) {
      return res.status(400).json({ message: 'Tipo de cambio inválido' });
    }

    // Get student current data
    const student = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('STUDENTS_ID', parseInt(id))
        .maybeSingle();
      if (error) throw error;
      return data;
    }, 'getStudentForChange');

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    // Check for active practices (validations)
    const activePractices = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
        .eq('STUDENTS_ID', parseInt(id))
        .in('PRACTICES_STATUS', [1, 2]); // 1=En Proceso, 2=Activa
      if (error) throw error;
      return data;
    }, 'checkActivePractices');

    const hasActivePractice = activePractices && activePractices.length > 0;

    // Check for pending evaluations
    const pendingEvaluations = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_evaluations')
        .select('EVALUATION_ID, STATUS')
        .eq('STUDENT_ID', parseInt(id))
        .eq('STATUS', 1); // 1=Pending
      if (error) throw error;
      return data;
    }, 'checkPendingEvaluations');

    const hasPendingEvaluations = pendingEvaluations && pendingEvaluations.length > 0;

    // Apply restrictions based on change type
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

    if (changeType === 'regime' && hasActivePractice) {
      return res.status(400).json({ 
        message: 'No se puede cambiar el régimen. El estudiante tiene una práctica activa.',
        code: 'ACTIVE_PRACTICE_BLOCK'
      });
    }

    // Perform the update based on change type
    let updateData: Record<string, unknown> = {};
    let oldValue = '';
    let newValueFormatted = newValue;

    if (changeType === 'regime') {
      const validRegimes = ['DIURNO', 'NOCTURNO', 'MIXTO'];
      if (!validRegimes.includes(newValue.toUpperCase())) {
        return res.status(400).json({ message: 'Régimen inválido. Debe ser DIURNO, NOCTURNO o MIXTO' });
      }
      oldValue = student.REGIME || '';
      updateData.REGIME = newValue.toUpperCase();
    } else if (changeType === 'tutor') {
      // Verify tutor exists
      const tutor = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_tutors')
          .select('TUTOR_ID, NAME, SURNAME')
          .eq('TUTOR_ID', parseInt(newValue))
          .maybeSingle();
        if (error) throw error;
        return data;
      }, 'verifyTutor');

      if (!tutor) {
        return res.status(404).json({ message: 'Tutor no encontrado' });
      }

      // Get current tutor assignment
      const currentAssignment = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_professional_practices_tutor')
          .select('TUTOR_ID, t_tutors!inner(NAME, SURNAME)')
          .eq('STUDENT_ID', parseInt(id))
          .eq('IS_ACTIVE', true)
          .maybeSingle();
        if (error) throw error;
        return data;
      }, 'getCurrentTutor');

      if (currentAssignment) {
        const tutorData = currentAssignment.t_tutors as { NAME?: string; SURNAME?: string } | undefined;
        oldValue = `${tutorData?.NAME || ''} ${tutorData?.SURNAME || ''}`.trim();
        newValueFormatted = `${tutor.NAME} ${tutor.SURNAME}`.trim();
        
        // Update tutor assignment
        await dbManager.withRetry(async (supabase) => {
          const { error } = await supabase
            .from('t_professional_practices_tutor')
            .update({ 
              TUTOR_ID: parseInt(newValue),
              MODIFIED_AT: new Date().toISOString()
            })
            .eq('STUDENT_ID', parseInt(id))
            .eq('IS_ACTIVE', true);
          if (error) throw error;
        }, 'updateTutorAssignment');
      }
    } else if (changeType === 'institution') {
      // Verify institution exists
      const institution = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_institution')
          .select('INSTITUTION_ID, INSTITUTION_NAME')
          .eq('INSTITUTION_ID', parseInt(newValue))
          .maybeSingle();
        if (error) throw error;
        return data;
      }, 'verifyInstitution');

      if (!institution) {
        return res.status(404).json({ message: 'Institución no encontrada' });
      }

      oldValue = student.INSTITUTION_ID ? String(student.INSTITUTION_ID) : 'Sin institución';
      newValueFormatted = institution.INSTITUTION_NAME;
      updateData.INSTITUTION_ID = parseInt(newValue);
    }

    // Update student if regime change
    if (changeType === 'regime') {
      await dbManager.withRetry(async (supabase) => {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update(updateData)
          .eq('STUDENTS_ID', parseInt(id));
        if (error) throw error;
      }, 'updateStudentRegime');
    }

    // Log the change in activity log
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
          studentCi: student.STUDENTS_CI,
          studentName: `${student.NAME} ${student.SURNAME}`
        }),
        IP_ADDRESS: req.ip,
        USER_AGENT: req.headers['user-agent']
      });
    }, 'logRegistrationChange');

    res.json({
      success: true,
      message: `Cambio de ${changeType} realizado exitosamente`,
      data: {
        changeType,
        oldValue,
        newValue: newValueFormatted,
        reason
      }
    });

  } catch (error: unknown) {
    console.error('[changeStudentRegistration] Error:', error);
    handleDbError(res, error);
  }
};

export const importStudents = async (req: Request, res: Response) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se proporcionaron estudiantes para importar' 
      });
    }

    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const studentData of students) {
      try {
        const { data, error } = await supabase
          .from('t_students')
          .insert({
            IDENTIFICATION_PREFIX: studentData.identificationPrefix || 'V',
            IDENTIFICATION_NUMBER: studentData.identificationNumber,
            FIRST_NAME: studentData.firstName,
            MIDDLE_NAME: studentData.middleName || null,
            LAST_NAME: studentData.lastName,
            SECOND_LAST_NAME: studentData.secondLastName || null,
            SEX: studentData.sex,
            BIRTH_DATE: studentData.birthDate,
            CIVIL_STATUS: studentData.civilStatus || 'SOLTERO',
            PHONE: studentData.phone,
            EMAIL: studentData.email,
            ADDRESS: studentData.address || '',
            CAREER_ID: studentData.careerId,
            SEMESTER: studentData.semester || '01',
            SECTION: studentData.section || '001',
            REGIME: studentData.regime || 'DIURNO',
            STUDENT_TYPE: studentData.studentType || 'CIVIL',
            MILITARY_RANK: studentData.militaryRank || 'NO APLICA',
            WORKS: studentData.works || 'NO',
            STATUS: true
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
    const { status, careerId, regime } = req.query;

    let query = supabase
      .from('t_students')
      .select(`
        *,
        t_career(CAREER_NAME),
        t_institution(INSTITUTION_NAME)
      `)
      .order('FIRST_NAME', { ascending: true });

    if (status !== undefined) {
      query = query.eq('STATUS', status === 'true');
    }
    if (careerId) {
      query = query.eq('CAREER_ID', careerId);
    }
    if (regime) {
      query = query.eq('REGIME', regime);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[exportStudents] Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al exportar estudiantes' 
      });
    }

    const formattedData = (data || []).map(student => ({
      identificationPrefix: student.IDENTIFICATION_PREFIX,
      identificationNumber: student.IDENTIFICATION_NUMBER,
      firstName: student.FIRST_NAME,
      middleName: student.MIDDLE_NAME,
      lastName: student.LAST_NAME,
      secondLastName: student.SECOND_LAST_NAME,
      sex: student.SEX,
      birthDate: student.BIRTH_DATE,
      civilStatus: student.CIVIL_STATUS,
      phone: student.PHONE,
      email: student.EMAIL,
      address: student.ADDRESS,
      careerId: student.CAREER_ID,
      careerName: student.t_career?.CAREER_NAME,
      semester: student.SEMESTER,
      section: student.SECTION,
      regime: student.REGIME,
      studentType: student.STUDENT_TYPE,
      militaryRank: student.MILITARY_RANK,
      works: student.WORKS,
      enrollmentDate: student.ENROLLMENT_DATE,
      status: student.STATUS
    }));

    res.json({ success: true, data: formattedData });
  } catch (error: unknown) {
    console.error('[exportStudents] Error:', error);
    handleDbError(res, error);
  }
};