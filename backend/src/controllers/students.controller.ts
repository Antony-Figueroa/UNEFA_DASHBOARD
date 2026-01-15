import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';

const TABLE_NAME = 't_students';
const CACHE_PREFIX = 'students:';

// Columnas específicas para proyección para mejorar el rendimiento
const STUDENT_COLUMNS = `
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
  STATUS,
  t_career(CAREER_NAME)
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
      let query = supabase
        .from(TABLE_NAME)
        .select(STUDENT_COLUMNS, { count: 'exact' });

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

const mapDBToFrontend = (s: DBStudent) => ({
  studentId: String(s.STUDENTS_ID),
  identificationPrefix: s.STUDENTS_CI.split('-')[0],
  identificationNumber: s.STUDENTS_CI.split('-')[1],
  firstName: s.NAME,
  middleName: s.SECOND_NAME || undefined,
  lastName: s.SURNAME,
  secondLastName: s.SECOND_SURNAME || undefined,
  sex: s.GENDER,
  birthDate: s.BIRTHDATE,
  civilStatus: s.MARITAL_STATUS,
  phone: s.CONTACT_PHONE,
  email: s.EMAIL,
  address: s.ADDRESS,
  careerId: String(s.CAREER_ID),
  careerName: Array.isArray(s.t_career) ? s.t_career[0]?.CAREER_NAME : s.t_career?.CAREER_NAME,
  semester: String(s.SEMESTER),
  section: s.SECTION,
  regime: s.REGIME,
  studentType: s.STUDENT_TYPE,
  militaryRank: s.MILITARY_RANK,
  works: s.EMPLOYMENT ? "SI" : "NO",
  enrollmentDate: s.REGISTRATION_DATE,
  status: s.STATUS === 1
});

export const createStudent = async (req: Request, res: Response) => {
  try {
    const s = req.body;
    
    // Validación básica de campos requeridos
    if (!s.identificationNumber || !s.firstName || !s.lastName || !s.careerId) {
      return res.status(400).json({ 
        message: 'Error: Faltan campos requeridos (Cédula, Nombres, Apellidos y Carrera son obligatorios)' 
      });
    }

    const careerId = parseInt(s.careerId);
    const semester = parseInt(s.semester);

    if (isNaN(careerId)) {
      return res.status(400).json({ message: 'Error: El ID de carrera debe ser un número válido' });
    }

    const dbData = {
      STUDENTS_CI: `${s.identificationPrefix || 'V'}-${s.identificationNumber}`,
      NAME: s.firstName,
      SECOND_NAME: s.middleName || null,
      SURNAME: s.lastName,
      SECOND_SURNAME: s.secondLastName || null,
      GENDER: s.sex,
      BIRTHDATE: s.birthDate,
      CONTACT_PHONE: s.phone,
      EMAIL: s.email,
      ADDRESS: s.address,
      MARITAL_STATUS: s.civilStatus,
      CAREER_ID: careerId,
      SEMESTER: isNaN(semester) ? 1 : semester,
      SECTION: s.section,
      REGIME: s.regime,
      STUDENT_TYPE: s.studentType,
      MILITARY_RANK: s.militaryRank,
      EMPLOYMENT: s.works === "SI",
      STATUS: s.status !== false ? 1 : 0,
      REGISTRATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select(STUDENT_COLUMNS)
        .single();

      if (error) throw error;
      return data as unknown as DBStudent;
    }, 'createStudent');

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const s = req.body;

    // Validación básica de campos requeridos
    if (!s.identificationNumber || !s.firstName || !s.lastName || !s.careerId) {
      return res.status(400).json({ 
        message: 'Error: Faltan campos requeridos (Cédula, Nombres, Apellidos y Carrera son obligatorios)' 
      });
    }

    const careerId = parseInt(s.careerId);
    const semester = parseInt(s.semester);

    if (isNaN(careerId)) {
      return res.status(400).json({ message: 'Error: El ID de carrera debe ser un número válido' });
    }

    const dbData = {
      STUDENTS_CI: `${s.identificationPrefix || 'V'}-${s.identificationNumber}`,
      NAME: s.firstName,
      SECOND_NAME: s.middleName || null,
      SURNAME: s.lastName,
      SECOND_SURNAME: s.secondLastName || null,
      GENDER: s.sex,
      BIRTHDATE: s.birthDate,
      CONTACT_PHONE: s.phone,
      EMAIL: s.email,
      ADDRESS: s.address,
      MARITAL_STATUS: s.civilStatus,
      CAREER_ID: careerId,
      SEMESTER: isNaN(semester) ? 1 : semester,
      SECTION: s.section,
      REGIME: s.regime,
      STUDENT_TYPE: s.studentType,
      MILITARY_RANK: s.militaryRank,
      EMPLOYMENT: s.works === "SI",
      STATUS: s.status !== false ? 1 : 0
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('STUDENTS_ID', parseInt(id))
        .select(STUDENT_COLUMNS)
        .single();

      if (error) throw error;
      return data as unknown as DBStudent;
    }, 'updateStudent');

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('STUDENTS_ID', parseInt(id));

      if (error) throw error;
    }, 'deleteStudent');

    // Invalidar caché de estudiantes
    cacheManager.deleteByPrefix(CACHE_PREFIX);
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const toggleStudentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('STUDENTS_ID', parseInt(id))
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
