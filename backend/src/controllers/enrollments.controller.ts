import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';

const TABLE_NAME = 't_professional_practices';
const CACHE_PREFIX = 'enrollments:';
const CACHE_TTL = 300000; // 5 minutes for enrollments
const ENROLLMENT_COLUMNS = 'PROFESSIONAL_PRACTICE_ID, START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, GRADE, PRACTICES_STATUS, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERSHIP_STATUS, INTERNSHIP_TYPE_ID';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST204') {
    userMessage = 'Error: Registro no encontrado';
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

interface Student {
  STUDENTS_CI: string;
  NAME: string;
  SECOND_NAME?: string;
  SURNAME: string;
  SECOND_SURNAME?: string;
  t_career?: {
    CAREER_NAME: string;
  };
}

interface TutorAssociation {
  TUTOR_ID: number;
  TUTOR_TYPE: string;
  t_tutors?: {
    NAME: string;
    SURNAME: string;
  };
}

interface ProfessionalPractice {
  PROFESSIONAL_PRACTICE_ID: number;
  START_DATE?: string;
  END_DATE?: string;
  REPORT_TITLE?: string;
  REGISTRATION_DATE: string;
  CREATION_DATE?: string;
  GRADE?: number;
  PRACTICES_STATUS?: string;
  TRANSFER?: number;
  TOUR?: string;
  PERIOD_ID?: number;
  INSTITUTION_ID: number;
  STUDENTS_ID?: number;
  STATUS: number;
  MANAGER_ID: number;
  OBSERVATION?: string;
  ENROLLMENT: string;
  INTERSHIP_STATUS?: number;
  INTERNSHIP_TYPE_ID?: number;
  t_students?: Student;
  t_internships_period?: { DESCRIPTION: string };
  t_internship_type?: { NAME: string };
  t_institution?: { INSTITUTION_NAME: string };
  t_institution_manager?: { NAME: string; SURNAME: string };
  t_professional_practices_tutor?: TutorAssociation[];
}

export const getEnrollments = async (req: Request, res: Response) => {
  const cacheKey = `${CACHE_PREFIX}list`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${ENROLLMENT_COLUMNS},
          t_students (
            STUDENTS_CI,
            NAME,
            SECOND_NAME,
            SURNAME,
            SECOND_SURNAME,
            t_career (CAREER_NAME)
          ),
          t_internships_period (DESCRIPTION),
          t_internship_type (NAME),
          t_institution (INSTITUTION_NAME),
          t_institution_manager (NAME, SURNAME),
          t_professional_practices_tutor (
            TUTOR_ID,
            TUTOR_TYPE,
            t_tutors (NAME, SURNAME)
          )
        `)
        .eq('STATUS', 1)
        .order('REGISTRATION_DATE', { ascending: false });

      if (error) throw error;
      return (data as unknown) as ProfessionalPractice[];
    }, 'getEnrollments');

    // Mapear datos al formato que espera el frontend
    const mappedData = (data || []).map((item: ProfessionalPractice) => {
      const ciParts = item.t_students?.STUDENTS_CI?.split('-') || ['', ''];
      
      const academicTutor = item.t_professional_practices_tutor?.find((t: TutorAssociation) => t.TUTOR_TYPE === 'ACADEMICO');
      const methodologicalTutor = item.t_professional_practices_tutor?.find((t: TutorAssociation) => t.TUTOR_TYPE === 'METODOLOGICO');

      return {
        enrollmentId: item.PROFESSIONAL_PRACTICE_ID?.toString() || '',
        identificationPrefix: ciParts[0] || 'V',
        identificationNumber: ciParts[1] || '',
        studentName: `${item.t_students?.NAME || ''} ${item.t_students?.SURNAME || ''}`.trim(),
        careerName: item.t_students?.t_career?.CAREER_NAME || '',
        academicTutorId: academicTutor?.TUTOR_ID?.toString() || '',
        academicTutorName: academicTutor ? `${academicTutor.t_tutors?.NAME || ''} ${academicTutor.t_tutors?.SURNAME || ''}`.trim() : '',
        methodologicalTutorId: methodologicalTutor?.TUTOR_ID?.toString() || '',
        methodologicalTutorName: methodologicalTutor ? `${methodologicalTutor.t_tutors?.NAME || ''} ${methodologicalTutor.t_tutors?.SURNAME || ''}`.trim() : '',
        institutionId: item.INSTITUTION_ID?.toString() || '',
        institutionName: item.t_institution?.INSTITUTION_NAME || '',
        institutionResponsibleId: item.MANAGER_ID?.toString() || '',
        institutionResponsibleName: item.t_institution_manager ? `${item.t_institution_manager.NAME || ''} ${item.t_institution_manager.SURNAME || ''}`.trim() : '',
        practiceType: item.t_internship_type?.NAME || '',
        period: item.t_internships_period?.DESCRIPTION || '',
        enrollmentDate: item.REGISTRATION_DATE || '',
        status: item.STATUS === 1
      };
    });

    cacheManager.set(cacheKey, mappedData, CACHE_TTL);
    res.json(mappedData);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createEnrollment = async (req: Request, res: Response) => {
  try {
    const {
      identificationPrefix,
      identificationNumber,
      period, // Descripción del periodo
      practiceType, // Nombre del tipo de práctica
      institutionId,
      institutionResponsibleId,
      academicTutorId,
      methodologicalTutorId
    } = req.body;

    const now = new Date().toISOString();

    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Buscar Estudiante
      const fullCI = `${identificationPrefix}-${identificationNumber}`;
      const { data: student, error: studentError } = await supabase
        .from('t_students')
        .select('STUDENTS_ID')
        .eq('STUDENTS_CI', fullCI)
        .single();
      
      if (studentError || !student) throw new Error('Estudiante no encontrado');

      // 2. Buscar Periodo
      const { data: periodData, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, START_DATE, END_DATE')
        .eq('DESCRIPTION', period)
        .single();
      
      if (periodError || !periodData) throw new Error('Periodo no encontrado');

      // 3. Buscar Tipo de Práctica
      const { data: typeData, error: typeError } = await supabase
        .from('t_internship_type')
        .select('INTERNSHIP_TYPE_ID')
        .eq('NAME', practiceType)
        .single();
      
      if (typeError || !typeData) throw new Error('Tipo de práctica no encontrado');

      // 4. Insertar en t_professional_practices
      const { data: practice, error: practiceError } = await supabase
        .from(TABLE_NAME)
        .insert([{
          START_DATE: periodData.START_DATE,
          END_DATE: periodData.END_DATE,
          REPORT_TITLE: '',
          REGISTRATION_DATE: now,
          CREATION_DATE: now,
          GRADE: 0,
          PRACTICES_STATUS: 'ACTIVA',
          TRANSFER: 0,
          TOUR: '',
          PERIOD_ID: periodData.PERIOD_ID,
          INSTITUTION_ID: parseInt(institutionId),
          STUDENTS_ID: student.STUDENTS_ID,
          STATUS: 1,
          MANAGER_ID: parseInt(institutionResponsibleId),
          OBSERVATION: '',
          ENROLLMENT: '', // Se podría generar un código si fuera necesario
          INTERSHIP_STATUS: 1,
          INTERNSHIP_TYPE_ID: typeData.INTERNSHIP_TYPE_ID
        }])
        .select()
        .single();

      if (practiceError) throw practiceError;

      // 5. Insertar Tutores
      const tutorsToInsert = [
        {
          TUTOR_ID: parseInt(academicTutorId),
          PROFESSIONAL_PRACTICE_ID: practice.PROFESSIONAL_PRACTICE_ID,
          TUTOR_TYPE: 'ACADEMICO'
        },
        {
          TUTOR_ID: parseInt(methodologicalTutorId),
          PROFESSIONAL_PRACTICE_ID: practice.PROFESSIONAL_PRACTICE_ID,
          TUTOR_TYPE: 'METODOLOGICO'
        }
      ];

      const { error: tutorsError } = await supabase
        .from('t_professional_practices_tutor')
        .insert(tutorsToInsert);

      if (tutorsError) throw tutorsError;

      return practice;
    }, 'createEnrollment');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      academicTutorId,
      methodologicalTutorId,
      institutionId,
      institutionResponsibleId,
      practiceType,
      period
    } = req.body;

    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Buscar Periodo y Tipo si cambiaron
      let periodId, internshipTypeId;
      
      if (period) {
        const { data: p } = await supabase.from('t_internships_period').select('PERIOD_ID').eq('DESCRIPTION', period).single();
        periodId = p?.PERIOD_ID;
      }

      if (practiceType) {
        const { data: t } = await supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID').eq('NAME', practiceType).single();
        internshipTypeId = t?.INTERNSHIP_TYPE_ID;
      }

      // 2. Actualizar t_professional_practices
      const updateData: Partial<ProfessionalPractice> = {};
      if (institutionId) updateData.INSTITUTION_ID = parseInt(institutionId);
      if (institutionResponsibleId) updateData.MANAGER_ID = parseInt(institutionResponsibleId);
      if (periodId) updateData.PERIOD_ID = periodId;
      if (internshipTypeId) updateData.INTERNSHIP_TYPE_ID = internshipTypeId;

      const { data: practice, error: practiceError } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
        .select()
        .single();

      if (practiceError) throw practiceError;

      // 3. Actualizar Tutores (borrar y volver a insertar es más simple)
      if (academicTutorId || methodologicalTutorId) {
        await supabase
          .from('t_professional_practices_tutor')
          .delete()
          .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id));

        const tutorsToInsert = [];
        if (academicTutorId) {
          tutorsToInsert.push({
            TUTOR_ID: parseInt(academicTutorId),
            PROFESSIONAL_PRACTICE_ID: parseInt(id),
            TUTOR_TYPE: 'ACADEMICO'
          });
        }
        if (methodologicalTutorId) {
          tutorsToInsert.push({
            TUTOR_ID: parseInt(methodologicalTutorId),
            PROFESSIONAL_PRACTICE_ID: parseInt(id),
            TUTOR_TYPE: 'METODOLOGICO'
          });
        }

        if (tutorsToInsert.length > 0) {
          const { error: tutorsError } = await supabase
            .from('t_professional_practices_tutor')
            .insert(tutorsToInsert);
          if (tutorsError) throw tutorsError;
        }
      }

      return practice;
    }, 'updateEnrollment');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id));

      if (error) throw error;
    }, 'deleteEnrollment');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
