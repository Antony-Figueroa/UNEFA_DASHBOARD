import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_professional_practices';

const handleDbError = (res: Response, error: unknown) => {
  const dbError = error as { message?: string; details?: string; code?: string; hint?: string; status?: number };
  console.error('[PreEnrollmentsController] Error:', {
    message: dbError.message,
    code: dbError.code,
    status: dbError.status,
    details: dbError.details,
    hint: dbError.hint
  });
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST204') {
    userMessage = 'Error: Registro no encontrado';
  } else if (dbError.message) {
    userMessage = dbError.message;
  }

  res.status(dbError.status || 500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code,
    hint: dbError.hint
  });
};

interface Student {
  STUDENTS_ID: number;
  person_id: number;
  t_persons?: { ci: string; first_name: string; last_name: string; phone?: string };
}

interface ProfessionalPracticeTutor {
  TUTOR_ID: number;
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
  INTERNSHIP_STATUS?: number;
  INTERNSHIP_TYPE_ID?: number;
  CAREER_ID?: number;
  SEMESTER?: string;
  SECTION?: string;
  REGIME?: string;
  t_students?: Student;
  t_internships_period?: { DESCRIPTION: string };
  t_internship_type?: { NAME: string };
  t_career?: { CAREER_NAME: string };
  t_professional_practices_tutor?: ProfessionalPracticeTutor[];
}

export const getPreEnrollments = async (req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          t_persons!inner (
            ci,
            first_name,
            last_name,
            phone
          ),
          t_career (CAREER_NAME),
          t_internships_period (DESCRIPTION),
          t_internship_type (NAME),
          t_professional_practices_tutor (TUTOR_ID)
        `)
        .eq('PRACTICES_STATUS', 1) // 1 para PRE-INSCRITO
        .order('REGISTRATION_DATE', { ascending: false });

      if (error) throw error;
      return (data as unknown) as ProfessionalPractice[];
    });

    // Mapear al formato del frontend
    const mappedData = data.map((item: any) => {
      const ciParts = item.t_persons?.ci?.split('-') || ['', ''];
      return {
        preEnrollmentId: item.PROFESSIONAL_PRACTICE_ID.toString(),
        identificationPrefix: ciParts[0] || 'V',
        identificationNumber: ciParts[1] || '',
        studentName: `${item.t_persons?.first_name || ''} ${item.t_persons?.last_name || ''}`.trim(),
        phone: item.t_persons?.phone || '',
        careerId: item.CAREER_ID?.toString() || '',
        careerName: item.t_career?.CAREER_NAME || '',
        semester: item.SEMESTER || '',
        section: item.SECTION || '',
        regime: item.REGIME || '',
        period: item.t_internships_period?.DESCRIPTION || '',
        practiceType: item.t_internship_type?.NAME || '',
        enrollmentCode: item.ENROLLMENT || '',
        preEnrollmentDate: item.REGISTRATION_DATE,
        status: item.STATUS === 1,
        isInUse: Array.isArray(item.t_professional_practices_tutor) && item.t_professional_practices_tutor.length > 0
      };
    });

    res.json(mappedData);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createPreEnrollment = async (req: Request, res: Response) => {
  try {
    const {
      identificationPrefix,
      identificationNumber,
      period,
      practiceType,
      enrollmentCode,
      careerId,
      semester,
      section,
      regime
    } = req.body;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const result = await dbManager.withRetry(async (supabase) => {
      // 1. Buscar Estudiante vía t_persons
      const fullCI = `${identificationPrefix}-${identificationNumber}`;
      console.log(`[PreEnrollmentsController] Buscando estudiante con C.I.: ${fullCI}`);
      const { data: person, error: personError } = await supabase
        .from('t_persons')
        .select('person_id')
        .eq('ci', fullCI)
        .maybeSingle();
      
      if (personError) throw personError;
      if (!person) {
        const err = new Error(`Estudiante con C.I. ${fullCI} no encontrado.`);
        (err as any).status = 404;
        throw err;
      }

      const { data: student, error: studentError } = await supabase
        .from('t_students')
        .select('STUDENTS_ID, person_id, t_persons!inner(ci, first_name, last_name, phone)')
        .eq('person_id', person.person_id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) {
        const err = new Error(`Registro de estudiante vinculado a C.I. ${fullCI} no encontrado.`);
        (err as any).status = 404;
        throw err;
      }

      // 2.1. Validar que no tenga una pre-inscripción activa
      const { data: activePreEnrollment, error: activePreError } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PRACTICES_STATUS', '1') // '1' para PRE-INSCRITO
        .eq('STATUS', 1)
        .maybeSingle();

      if (activePreError) throw activePreError;
      if (activePreEnrollment) {
        const err = new Error('El estudiante ya posee una pre-inscripción activa.');
        (err as any).status = 409;
        throw err;
      }

      // 2.2. Validar inscripción activa
      const { data: activeEnrollment, error: activeEnrollmentError } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PRACTICES_STATUS', '2') // '2' para INSCRITO/ACTIVO
        .eq('STATUS', 1) 
        .maybeSingle();

      if (activeEnrollmentError) throw activeEnrollmentError;
      if (activeEnrollment) {
        const err = new Error('El estudiante ya tiene una inscripción activa y no puede pre-inscribirse.');
        (err as any).status = 409;
        throw err;
      }

      // 2. Buscar Periodo
      const { data: periodData, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID, START_DATE, END_DATE')
        .eq('DESCRIPTION', period)
        .maybeSingle();
      
      if (periodError) throw periodError;
      if (!periodData) {
        const err = new Error(`Período "${period}" no encontrado.`);
        (err as any).status = 400;
        throw err;
      }

      // 3. Buscar Tipo de Práctica
      const { data: typeData, error: typeError } = await supabase
        .from('t_internship_type')
        .select('INTERNSHIP_TYPE_ID')
        .eq('NAME', practiceType)
        .maybeSingle();
      
      if (typeError) throw typeError;
      if (!typeData) {
        const err = new Error(`Tipo de práctica "${practiceType}" no encontrado.`);
        (err as any).status = 400;
        throw err;
      }

      // 4. Validar duplicados (mismo estudiante, mismo periodo, mismo tipo de práctica)
      const { data: existingEntry, error: checkError } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PERIOD_ID', periodData.PERIOD_ID)
        .eq('INTERNSHIP_TYPE_ID', typeData.INTERNSHIP_TYPE_ID)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingEntry) {
        const err = new Error('Ya existe un registro para este estudiante en el mismo período y tipo de práctica.');
        (err as any).status = 409;
        throw err;
      }

      // 4b. Buscar Carrera (opcional para pre-inscripciones, se puede seleccionar después)
      let careerIdNumber: number | null = null;
      if (careerId) {
        const { data: careerData } = await supabase
          .from('t_career')
          .select('CAREER_ID')
          .eq('CAREER_ID', careerId)
          .maybeSingle();
        if (careerData) {
          careerIdNumber = careerData.CAREER_ID;
        }
      }

      // 5. Preparar institución y responsable (opcional para pre-inscripciones)
      // Estos campos ahora son nullable, se asignan durante la inscripción正式
      let finalInstId: number | null = null;
      let finalManagerId: number | null = null;

      // Intentar buscar una combinación válida si existe
      const { data: managerData, error: managerFetchError } = await supabase
        .from('t_institution_manager')
        .select('MANAGER_ID, INSTITUTION_ID')
        .eq('STATUS', 1)
        .limit(1)
        .maybeSingle();

      if (managerFetchError) {
        console.log('[PreEnrollmentsController] Error buscando responsable (se omite):', managerFetchError.message);
      } else if (managerData) {
        finalInstId = managerData.INSTITUTION_ID;
        finalManagerId = managerData.MANAGER_ID;
        console.log('[PreEnrollmentsController] Encontrada institución/responsable (opcional):', finalInstId, finalManagerId);
      } else {
        console.log('[PreEnrollmentsController] No se encontró institución con responsable (opcional - se omite)');
      }

      // 6. Insertar en t_professional_practices como PRE-INSCRITO
      console.log(`[PreEnrollmentsController] Insertando pre-inscripción para estudiante ID: ${student.STUDENTS_ID}`);
      const { data: insertedData, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          START_DATE: periodData.START_DATE,
          END_DATE: periodData.END_DATE,
          REPORT_TITLE: 'PENDIENTE',
          REGISTRATION_DATE: now,
          CREATION_DATE: now,
          GRADE: 0,
          PRACTICES_STATUS: '1', 
          TRANSFER: 0,
          TOUR: '',
          PERIOD_ID: periodData.PERIOD_ID,
          INSTITUTION_ID: finalInstId, 
          STUDENTS_ID: student.STUDENTS_ID,
          student_person_id: student.person_id,
          STATUS: 1,
          MANAGER_ID: finalManagerId, 
          OBSERVATION: '',
          ENROLLMENT: enrollmentCode,
          INTERNSHIP_STATUS: 1, 
          INTERNSHIP_TYPE_ID: typeData.INTERNSHIP_TYPE_ID,
          CAREER_ID: careerIdNumber,
          SEMESTER: semester || '',
          SECTION: section || '',
          REGIME: regime || ''
        }])
        .select(`
          *,
          t_students (
            STUDENTS_ID,
            person_id,
            t_persons!inner (
              ci,
              first_name,
              last_name,
              phone
            )
          ),
          t_career (CAREER_NAME),
          t_internships_period (DESCRIPTION),
          t_internship_type (NAME)
        `)
        .single();

      if (error) throw error;
      
      // Mapear la respuesta al formato del frontend
      const ciParts = insertedData.t_students?.t_persons?.ci?.split('-') || ['', ''];
      const mappedResult = {
        preEnrollmentId: insertedData.PROFESSIONAL_PRACTICE_ID.toString(),
        identificationPrefix: ciParts[0] || 'V',
        identificationNumber: ciParts[1] || '',
        studentName: `${insertedData.t_students?.t_persons?.first_name || ''} ${insertedData.t_students?.t_persons?.last_name || ''}`.trim(),
        phone: insertedData.t_students?.t_persons?.phone || '',
        careerId: insertedData.CAREER_ID?.toString() || '',
        careerName: insertedData.t_career?.CAREER_NAME || '',
        semester: insertedData.SEMESTER || '',
        section: insertedData.SECTION || '',
        regime: insertedData.REGIME || '',
        period: insertedData.t_internships_period?.DESCRIPTION || '',
        practiceType: insertedData.t_internship_type?.NAME || '',
        enrollmentCode: insertedData.ENROLLMENT || '',
        preEnrollmentDate: insertedData.REGISTRATION_DATE,
        status: insertedData.STATUS === 1,
        isInUse: false
      };
      
      return mappedResult;
    });

    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updatePreEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period, practiceType, enrollmentCode, status, careerId, semester, section, regime } = req.body;

    const result = await dbManager.withRetry(async (supabase) => {
      let periodId, internshipTypeId, careerIdNumber;
      
      if (period) {
        const { data: p } = await supabase.from('t_internships_period').select('PERIOD_ID').eq('DESCRIPTION', period).single();
        periodId = p?.PERIOD_ID;
      }

      if (practiceType) {
        const { data: t } = await supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID').eq('NAME', practiceType).single();
        internshipTypeId = t?.INTERNSHIP_TYPE_ID;
      }

      if (careerId) {
        const { data: c } = await supabase.from('t_career').select('CAREER_ID').eq('CAREER_ID', careerId).single();
        careerIdNumber = c?.CAREER_ID;
      }

      const updateData: Partial<ProfessionalPractice> = {};
      if (periodId !== undefined) updateData.PERIOD_ID = periodId;
      if (internshipTypeId !== undefined) updateData.INTERNSHIP_TYPE_ID = internshipTypeId;
      if (enrollmentCode) updateData.ENROLLMENT = enrollmentCode;
      if (status !== undefined) updateData.STATUS = status ? 1 : 0;
      if (careerIdNumber !== undefined) updateData.CAREER_ID = careerIdNumber;
      if (semester !== undefined) updateData.SEMESTER = semester;
      if (section !== undefined) updateData.SECTION = section;
      if (regime !== undefined) updateData.REGIME = regime;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('PROFESSIONAL_PRACTICE_ID', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getTypesByStudent = async (req: Request, res: Response) => {
  try {
    const { prefix, ci, period, careerId } = req.query;

    if (!prefix || !ci || !period || !careerId) {
      return res.status(400).json({ message: 'prefix, ci, period, and careerId are required' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      const fullCI = `${prefix}-${ci}`;

      const { data: person, error: personError } = await supabase
        .from('t_persons')
        .select('person_id')
        .eq('ci', fullCI)
        .maybeSingle();

      if (personError) throw personError;
      if (!person) return [];

      const { data: student, error: studentError } = await supabase
        .from('t_students')
        .select('STUDENTS_ID')
        .eq('person_id', person.person_id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) return [];

      const { data: periodData, error: periodError } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID')
        .eq('DESCRIPTION', String(period))
        .maybeSingle();

      if (periodError) throw periodError;
      if (!periodData) return [];

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`INTERNSHIP_TYPE_ID`)
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PERIOD_ID', periodData.PERIOD_ID)
        .eq('CAREER_ID', Number(careerId))
        .eq('STATUS', 1);

      if (error) throw error;

      return (data || []).map((r: { INTERNSHIP_TYPE_ID: number }) => r.INTERNSHIP_TYPE_ID);
    });

    res.json({ typeIds: result });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deletePreEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('PROFESSIONAL_PRACTICE_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
