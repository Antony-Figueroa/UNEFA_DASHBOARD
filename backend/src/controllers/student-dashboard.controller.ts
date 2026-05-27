import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate } from '../utils/audit-helpers.js';
import { notifyRequestCreated } from '../services/notification.service.js';

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
  requiredHours: number;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
  professionalPracticeId: number | null;
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

interface ActivityLogSummary {
  totalHours: number;
  totalLogs: number;
  approvedLogs: number;
  pendingLogs: number;
  recentLogs: Array<{
    id: number;
    date: string;
    hours: number;
    description: string;
    type: string;
    approved: boolean;
  }>;
}

interface DashboardStats {
  hasActiveInternship: boolean;
  pendingRequests: number;
  hoursProgress: {
    completed: number;
    required: number;
    percentage: number;
  };
}

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: studentData, error: studentError } = await supabase
      .from('t_students')
      .select('STUDENTS_ID, CAREER_ID, t_persons!inner(ci, first_name, last_name, email, phone)')
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
        t_internship_type (NAME, HOURS_REQUIRED),
        t_institution (
          INSTITUTION_NAME,
          INSTITUTION_ADDRESS,
          INSTITUTION_CONTACT
        ),
        t_professional_practices_tutor (
          TUTOR_TYPE,
          t_persons!inner (
            first_name,
            last_name,
            phone,
            email
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
    let activityLogs: ActivityLogSummary = {
      totalHours: 0,
      totalLogs: 0,
      approvedLogs: 0,
      pendingLogs: 0,
      recentLogs: []
    };
    
    if (enrollment) {
      const practiceId = (enrollment as any).PROFESSIONAL_PRACTICE_ID;
      const academicTutor = (enrollment as any).t_professional_practices_tutor?.find(
        (t: any) => t.TUTOR_TYPE === 'ACADEMICO'
      );

      const requiredHours = (enrollment as any).t_internship_type?.HOURS_REQUIRED || 120;

      internship = {
        enrollmentId: String(practiceId),
        studentCi: (studentData as any).t_persons?.ci || '',
        studentName: `${(studentData as any).t_persons?.first_name || ''} ${(studentData as any).t_persons?.last_name || ''}`.trim(),
        studentEmail: (studentData as any).t_persons?.email,
        studentPhone: (studentData as any).t_persons?.phone,
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
        requiredHours: requiredHours,
        tutorName: academicTutor ? `${academicTutor.t_persons?.first_name || ''} ${academicTutor.t_persons?.last_name || ''}`.trim() : '',
        tutorPhone: academicTutor?.t_persons?.phone || '',
        tutorEmail: academicTutor?.t_persons?.email || '',
        professionalPracticeId: practiceId
      };

      if (studentData.CAREER_ID) {
        const { data: career } = await supabase
          .from('t_career')
          .select('CAREER_NAME')
          .eq('CAREER_ID', studentData.CAREER_ID)
          .single();
        internship.careerName = career?.CAREER_NAME || '';
      }

      const { data: logsData } = await supabase
        .from('t_activity_logs')
        .select('ACTIVITY_LOG_ID, ACTIVITY_DATE, HOURS_WORKED, ACTIVITY_DESCRIPTION, ACTIVITY_TYPE, SUPERVISOR_APPROVED')
        .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
        .order('ACTIVITY_DATE', { ascending: false });

      if (logsData && logsData.length > 0) {
        const totalHours = logsData.reduce((sum: number, log: any) => sum + (parseFloat(log.HOURS_WORKED) || 0), 0);
        const approvedLogs = logsData.filter((log: any) => log.SUPERVISOR_APPROVED).length;
        
        activityLogs = {
          totalHours,
          totalLogs: logsData.length,
          approvedLogs,
          pendingLogs: logsData.length - approvedLogs,
          recentLogs: logsData.slice(0, 5).map((log: any) => ({
            id: log.ACTIVITY_LOG_ID,
            date: log.ACTIVITY_DATE,
            hours: parseFloat(log.HOURS_WORKED) || 0,
            description: log.ACTIVITY_DESCRIPTION,
            type: log.ACTIVITY_TYPE,
            approved: log.SUPERVISOR_APPROVED || false
          }))
        };

        internship.totalHours = totalHours;
      }
    }

    const { count: pendingRequests } = await supabase
      .from('t_student_requests')
      .select('*', { count: 'exact', head: true })
      .eq('STUDENT_ID', studentId)
      .eq('STATUS', 'pending');

    const stats: DashboardStats = {
      hasActiveInternship: !!internship && internship.status === 'active',
      pendingRequests: pendingRequests || 0,
      hoursProgress: {
        completed: activityLogs.totalHours,
        required: internship?.requiredHours || 120,
        percentage: internship ? Math.min(100, Math.round((activityLogs.totalHours / internship.requiredHours) * 100)) : 0
      }
    };

    res.json({
      success: true,
      data: {
        student: {
          id: studentData.STUDENTS_ID,
          ci: (studentData as any).t_persons?.ci || '',
          name: (studentData as any).t_persons?.first_name || '',
          surname: (studentData as any).t_persons?.last_name || '',
          email: (studentData as any).t_persons?.email,
          phone: (studentData as any).t_persons?.phone
        },
        internship,
        activityLogs,
        stats
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
        SEMESTER,
        SECTION,
        REGIME,
        STUDENT_TYPE,
        MILITARY_RANK,
        EMPLOYMENT,
        STATUS,
        REGISTRATION_DATE,
        CAREER_ID,
        t_career (CAREER_NAME),
        t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birth_date, address, marital_status)
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
        ci: (student as any).t_persons?.ci || '',
        name: (student as any).t_persons?.first_name || '',
        secondName: (student as any).t_persons?.middle_name || '',
        surname: (student as any).t_persons?.last_name || '',
        secondSurname: (student as any).t_persons?.second_last_name || '',
        fullName: `${(student as any).t_persons?.first_name || ''} ${(student as any).t_persons?.middle_name || ''} ${(student as any).t_persons?.last_name || ''} ${(student as any).t_persons?.second_last_name || ''}`.replace(/\s+/g, ' ').trim(),
        email: (student as any)?.t_persons?.email,
        phone: (student as any)?.t_persons?.phone,
        gender: (student as any)?.t_persons?.gender,
        birthdate: (student as any)?.t_persons?.birth_date,
        address: (student as any)?.t_persons?.address,
        maritalStatus: (student as any)?.t_persons?.marital_status,
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
      description: t.DESCRIPTION,
      isReassignment: t.IS_REASSIGNMENT || false,
      category: t.CATEGORY || 'GENERAL'
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
    const { typeId, subject, description, reassignmentData } = req.body;
    const supabase = dbManager.getConnection();

    if (!typeId || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Tipo, asunto y descripción son requeridos'
      });
    }

    // Verificar si es una solicitud de reasignación
    const { data: requestType } = await supabase
      .from('t_request_types')
      .select('IS_REASSIGNMENT')
      .eq('REQUEST_TYPE_ID', typeId)
      .single();

    const isReassignment = requestType?.IS_REASSIGNMENT === 1;

    // Si es reasignación, validar que tenga los datos
    if (isReassignment && !reassignmentData) {
      return res.status(400).json({
        success: false,
        message: 'Los datos de reasignación son requeridos para este tipo de solicitud'
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

    const insertData: Record<string, unknown> = {
      STUDENT_ID: student.STUDENTS_ID,
      REQUEST_TYPE_ID: typeId,
      SUBJECT: subject,
      DESCRIPTION: description,
      STATUS: 'pending',
      IS_REASSIGNMENT: isReassignment ? 1 : 0
    };

    if (isReassignment && reassignmentData) {
      insertData.REASSIGNMENT_DATA = reassignmentData;
    }

    const { data, error } = await supabase
      .from('t_student_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Auditoría de solicitud creada
    try {
      const requestId = data.REQUEST_ID;
      
      // Obtener nombre del estudiante
      const { data: studentData } = await supabase
        .from('t_students')
        .select('t_persons!inner(first_name, last_name)')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .single();

      const studentName = studentData ? `${(studentData as any).t_persons?.first_name || ''} ${(studentData as any).t_persons?.last_name || ''}`.trim() : 'Estudiante';
      
      // Obtener nombre del tipo de solicitud
      const { data: typeData } = await supabase
        .from('t_request_types')
        .select('NAME')
        .eq('REQUEST_TYPE_ID', typeId)
        .single();

      const typeName = typeData?.NAME || 'Solicitud';

      await auditCreate(req, 't_student_requests', {
        REQUEST_ID: requestId,
        SUBJECT: subject,
        STATUS: 'pending'
      }, ['SUBJECT', 'DESCRIPTION', 'STATUS']);

      // Notificación al admin
      await notifyRequestCreated(studentName, typeName, requestId);
    } catch (auditError) {
      console.error('[Audit] Error auditing request creation:', auditError);
    }

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
