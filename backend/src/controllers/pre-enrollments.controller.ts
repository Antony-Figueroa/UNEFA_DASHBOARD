import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_professional_practices';

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
  SURNAME: string;
  CONTACT_PHONE?: string;
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
}

export const getPreEnrollments = async (req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          t_students (
            STUDENTS_CI,
            NAME,
            SURNAME,
            CONTACT_PHONE
          ),
          t_internships_period (DESCRIPTION),
          t_internship_type (NAME)
        `)
        .eq('PRACTICES_STATUS', 'PRE-INSCRITO')
        .order('REGISTRATION_DATE', { ascending: false });

      if (error) throw error;
      return (data as unknown) as ProfessionalPractice[];
    });

    // Mapear al formato del frontend
    const mappedData = data.map((item: ProfessionalPractice) => {
      const ciParts = item.t_students?.STUDENTS_CI?.split('-') || ['', ''];
      return {
        preEnrollmentId: item.PROFESSIONAL_PRACTICE_ID.toString(),
        identificationPrefix: ciParts[0] || 'V',
        identificationNumber: ciParts[1] || '',
        studentName: `${item.t_students?.NAME || ''} ${item.t_students?.SURNAME || ''}`.trim(),
        phone: item.t_students?.CONTACT_PHONE || '',
        period: item.t_internships_period?.DESCRIPTION || '',
        practiceType: item.t_internship_type?.NAME || '',
        enrollmentCode: item.ENROLLMENT || '',
        preEnrollmentDate: item.REGISTRATION_DATE,
        status: item.STATUS === 1
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
      enrollmentCode
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
      
      if (periodError || !periodData) throw new Error('Período no encontrado');

      // 3. Buscar Tipo de Práctica
      const { data: typeData, error: typeError } = await supabase
        .from('t_internship_type')
        .select('INTERNSHIP_TYPE_ID')
        .eq('NAME', practiceType)
        .single();
      
      if (typeError || !typeData) throw new Error('Tipo de práctica no encontrado');

      // 4. Insertar en t_professional_practices como PRE-INSCRITO
      // Nota: Usamos INSTITUTION_ID=1 y MANAGER_ID=1 como placeholders obligatorios
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          START_DATE: periodData.START_DATE,
          END_DATE: periodData.END_DATE,
          REPORT_TITLE: 'PENDIENTE',
          REGISTRATION_DATE: now,
          CREATION_DATE: now,
          GRADE: 0,
          PRACTICES_STATUS: 'PRE-INSCRITO',
          TRANSFER: 0,
          TOUR: '',
          PERIOD_ID: periodData.PERIOD_ID,
          INSTITUTION_ID: 1, // Placeholder
          STUDENTS_ID: student.STUDENTS_ID,
          STATUS: 1,
          MANAGER_ID: 1, // Placeholder
          OBSERVATION: '',
          ENROLLMENT: enrollmentCode,
          INTERSHIP_STATUS: 0, // 0 para pre-inscripción
          INTERNSHIP_TYPE_ID: typeData.INTERNSHIP_TYPE_ID
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updatePreEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period, practiceType, enrollmentCode, status } = req.body;

    const result = await dbManager.withRetry(async (supabase) => {
      let periodId, internshipTypeId;
      
      if (period) {
        const { data: p } = await supabase.from('t_internships_period').select('PERIOD_ID').eq('DESCRIPTION', period).single();
        periodId = p?.PERIOD_ID;
      }

      if (practiceType) {
        const { data: t } = await supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID').eq('NAME', practiceType).single();
        internshipTypeId = t?.INTERNSHIP_TYPE_ID;
      }

      const updateData: Partial<ProfessionalPractice> = {};
      if (periodId !== undefined) updateData.PERIOD_ID = periodId;
      if (internshipTypeId !== undefined) updateData.INTERNSHIP_TYPE_ID = internshipTypeId;
      if (enrollmentCode) updateData.ENROLLMENT = enrollmentCode;
      if (status !== undefined) updateData.STATUS = status ? 1 : 0;

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
