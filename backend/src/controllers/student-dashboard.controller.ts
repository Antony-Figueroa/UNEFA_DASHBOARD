import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

interface StudentInternship {
  enrollmentId: string;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  careerName: string;
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  period: string;
  practiceType: string;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  status: string;
  grade: number;
  totalHours: number;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
}

interface RequestType {
  id: number;
  name: string;
  description: string;
}

interface StudentRequest {
  id: number;
  typeId: number;
  typeName: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  response: string | null;
  createdAt: string;
  processedAt: string | null;
}

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: studentData, error: studentError } = await supabase
      .from('t_students')
      .select('STUDENTS_ID, STUDENTS_CI, NAME, SURNAME, EMAIL, CONTACT_PHONE, CAREER_ID')
      .eq('USER_ID', userId)
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado para este usuario' 
      });
    }

    const studentId = studentData.STUDENTS_ID;

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        REGISTRATION_DATE,
        GRADE,
        PRACTICES_STATUS,
        STATUS,
        OBSERVATION,
        PERIOD_ID,
        INSTITUTION_ID,
        INTERNSHIP_TYPE_ID,
        t_internships_period (DESCRIPTION),
        t_internship_type (NAME),
        t_institution (
          INSTITUTION_NAME,
          INSTITUTION_ADDRESS,
          INSTITUTION_CONTACT
        ),
        t_professional_practices_tutor (
          TUTOR_TYPE,
          t_tutors (
            NAME,
            SURNAME,
            CONTACT_PHONE,
            EMAIL
          )
        )
      `)
      .eq('STUDENTS_ID', studentId)
      .eq('STATUS', 1)
      .order('REGISTRATION_DATE', { ascending: false })
      .limit(1)
      .maybeSingle();

    const statusMap: Record<number, string> = {
      1: 'pre-enrolled',
      2: 'active',
      3: 'completed',
      4: 'suspended'
    };

    let internship: StudentInternship | null = null;
    
    if (enrollment) {
      const academicTutor = (enrollment as any).t_professional_practices_tutor?.find(
        (t: any) => t.TUTOR_TYPE === 'ACADEMICO'
      );

      internship = {
        enrollmentId: String((enrollment as any).PROFESSIONAL_PRACTICE_ID),
        studentCi: studentData.STUDENTS_CI,
        studentName: `${studentData.NAME} ${studentData.SURNAME}`,
        studentEmail: studentData.EMAIL,
        studentPhone: studentData.CONTACT_PHONE,
        careerName: '',
        institutionName: (enrollment as any).t_institution?.INSTITUTION_NAME || '',
        institutionAddress: (enrollment as any).t_institution?.INSTITUTION_ADDRESS || '',
        institutionPhone: (enrollment as any).t_institution?.INSTITUTION_CONTACT || '',
        period: (enrollment as any).t_internships_period?.DESCRIPTION || '',
        practiceType: (enrollment as any).t_internship_type?.NAME || '',
        enrollmentDate: (enrollment as any).REGISTRATION_DATE || '',
        startDate: (enrollment as any).START_DATE || '',
        endDate: (enrollment as any).END_DATE || '',
        status: statusMap[(enrollment as any).PRACTICES_STATUS] || 'unknown',
        grade: (enrollment as any).GRADE || 0,
        totalHours: 0,
        tutorName: academicTutor ? `${academicTutor.t_tutors?.NAME || ''} ${academicTutor.t_tutors?.SURNAME || ''}`.trim() : '',
        tutorPhone: academicTutor?.t_tutors?.CONTACT_PHONE || '',
        tutorEmail: academicTutor?.t_tutors?.EMAIL || ''
      };

      if (studentData.CAREER_ID) {
        const { data: career } = await supabase
          .from('t_career')
          .select('CAREER_NAME')
          .eq('CAREER_ID', studentData.CAREER_ID)
          .single();
        internship.careerName = career?.CAREER_NAME || '';
      }
    }

    const { count: pendingRequests } = await supabase
      .from('t_student_requests')
      .select('*', { count: 'exact', head: true })
      .eq('STUDENT_ID', studentId)
      .eq('STATUS', 'pending');

    res.json({
      success: true,
      data: {
        student: {
          id: studentData.STUDENTS_ID,
          ci: studentData.STUDENTS_CI,
          name: studentData.NAME,
          surname: studentData.SURNAME,
          email: studentData.EMAIL,
          phone: studentData.CONTACT_PHONE
        },
        internship,
        stats: {
          hasActiveInternship: !!internship && internship.status === 'active',
          pendingRequests: pendingRequests || 0
        }
      }
    });

  } catch (error) {
    console.error('[StudentDashboard] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: student, error } = await supabase
      .from('t_students')
      .select(`
        STUDENTS_ID,
        STUDENTS_CI,
        NAME,
        SECOND_NAME,
        SURNAME,
        SECOND_SURNAME,
        EMAIL,
        CONTACT_PHONE,
        GENDER,
        BIRTHDATE,
        ADDRESS,
        MARITAL_STATUS,
        SEMESTER,
        SECTION,
        REGIME,
        STUDENT_TYPE,
        MILITARY_RANK,
        EMPLOYMENT,
        STATUS,
        REGISTRATION_DATE,
        CAREER_ID,
        t_career (CAREER_NAME)
      `)
      .eq('USER_ID', userId)
      .single();

    if (error || !student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        id: student.STUDENTS_ID,
        ci: student.STUDENTS_CI,
        name: student.NAME,
        secondName: student.SECOND_NAME,
        surname: student.SURNAME,
        secondSurname: student.SECOND_SURNAME,
        fullName: `${student.NAME || ''} ${student.SECOND_NAME || ''} ${student.SURNAME || ''} ${student.SECOND_SURNAME || ''}`.replace(/\s+/g, ' ').trim(),
        email: student.EMAIL,
        phone: student.CONTACT_PHONE,
        gender: student.GENDER,
        birthdate: student.BIRTHDATE,
        address: student.ADDRESS,
        maritalStatus: student.MARITAL_STATUS,
        semester: student.SEMESTER,
        section: student.SECTION,
        regime: student.REGIME,
        studentType: student.STUDENT_TYPE,
        militaryRank: student.MILITARY_RANK,
        employment: student.EMPLOYMENT,
        careerName: (student as any).t_career?.CAREER_NAME || '',
        status: student.STATUS,
        registrationDate: student.REGISTRATION_DATE
      }
    });

  } catch (error) {
    console.error('[StudentDashboard] Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRequestTypes = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_request_types')
      .select('*')
      .eq('IS_ACTIVE', 1)
      .order('NAME');

    if (error) throw error;

    const types: RequestType[] = (data || []).map((t: any) => ({
      id: t.REQUEST_TYPE_ID,
      name: t.NAME,
      description: t.DESCRIPTION
    }));

    res.json({ success: true, data: types });

  } catch (error) {
    console.error('[StudentDashboard] Error getting request types:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de solicitud'
    });
  }
};

export const getStudentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('USER_ID', userId)
      .single();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    const { data, error } = await supabase
      .from('t_student_requests')
      .select(`
        REQUEST_ID,
        REQUEST_TYPE_ID,
        SUBJECT,
        DESCRIPTION,
        STATUS,
        RESPONSE,
        CREATED_AT,
        PROCESSED_AT,
        t_request_types (NAME)
      `)
      .eq('STUDENT_ID', student.STUDENTS_ID)
      .order('CREATED_AT', { ascending: false });

    if (error) throw error;

    const requests: StudentRequest[] = (data || []).map((r: any) => ({
      id: r.REQUEST_ID,
      typeId: r.REQUEST_TYPE_ID,
      typeName: r.t_request_types?.NAME || '',
      subject: r.SUBJECT,
      description: r.DESCRIPTION,
      status: r.STATUS,
      response: r.RESPONSE,
      createdAt: r.CREATED_AT,
      processedAt: r.PROCESSED_AT
    }));

    res.json({ success: true, data: requests });

  } catch (error) {
    console.error('[StudentDashboard] Error getting requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes'
    });
  }
};

export const createStudentRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { typeId, subject, description } = req.body;
    const supabase = dbManager.getConnection();

    if (!typeId || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Tipo, asunto y descripción son requeridos'
      });
    }

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('USER_ID', userId)
      .single();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    const { data, error } = await supabase
      .from('t_student_requests')
      .insert({
        STUDENT_ID: student.STUDENTS_ID,
        REQUEST_TYPE_ID: typeId,
        SUBJECT: subject,
        DESCRIPTION: description,
        STATUS: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: { id: data.REQUEST_ID }
    });

  } catch (error) {
    console.error('[StudentDashboard] Error creating request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud'
    });
  }
};
