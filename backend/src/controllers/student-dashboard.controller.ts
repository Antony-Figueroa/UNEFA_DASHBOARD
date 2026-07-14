import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate } from '../utils/audit-helpers.js';
import { notifyRequestCreated } from '../services/notification.service.js';
import { PRACTICES_STATUS, PRACTICES_STATUS_LABELS } from '../constants/practice-status.constants.js';
import { sanitizeText } from '../utils/text-utils.js';

/** Prioridad para elegir el enrollment activo: INSCRITO > PRE_INSCRITO > CULMINADO */
const ENROLLMENT_PRIORITY: Record<number, number> = {
  [PRACTICES_STATUS.INSCRITO]: 0,
  [PRACTICES_STATUS.PRE_INSCRITO]: 1,
  [PRACTICES_STATUS.CULMINADO]: 2,
};

/** Elige el mejor enrollment (mayor prioridad, desempata por fecha descendente) */
function pickBestEnrollment(enrollments: any[]): any | null {
  if (!enrollments || enrollments.length === 0) return null;
  return enrollments.reduce((best, e) => {
    const bestPrio = ENROLLMENT_PRIORITY[best.PRACTICES_STATUS] ?? 99;
    const currPrio = ENROLLMENT_PRIORITY[e.PRACTICES_STATUS] ?? 99;
    if (currPrio < bestPrio) return e;
    if (currPrio === bestPrio && new Date(e.REGISTRATION_DATE || 0) > new Date(best.REGISTRATION_DATE || 0)) return e;
    return best;
  });
}

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

    // Primero obtener el person_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('person_id')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const personId = userData.person_id;

    // Luego buscar el estudiante por person_id
    const { data: studentData, error: studentError } = await supabase
      .from('t_students')
      .select('STUDENTS_ID, t_persons!inner(ci, first_name, last_name, email, phone)')
      .eq('person_id', personId)
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado para este usuario' 
      });
    }

    const studentId = studentData.STUDENTS_ID;

    const { data: allEnrollments, error: enrollmentError } = await supabase
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
        CAREER_ID,
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
          ACTIVE,
          t_tutors (
            t_persons!inner (
              first_name,
              last_name,
              phone,
              email
            )
          )
        )
      `)
      .eq('STUDENTS_ID', studentId)
      .eq('STATUS', 1);

    const enrollment = pickBestEnrollment(allEnrollments);

    const statusMap: Record<number, string> = {
      [PRACTICES_STATUS.RETIRADO]: 'withdrawn',
      [PRACTICES_STATUS.PRE_INSCRITO]: 'pre-enrolled',
      [PRACTICES_STATUS.INSCRITO]: 'active',
      [PRACTICES_STATUS.CULMINADO]: 'completed',
      [PRACTICES_STATUS.REPROBADO]: 'failed',
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
      const activeTutors = ((enrollment as any).t_professional_practices_tutor || []).filter((t: any) => t.ACTIVE !== false);
      const academicTutor = activeTutors.find(
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
        tutorName: academicTutor ? `${academicTutor.t_tutors?.t_persons?.first_name || ''} ${academicTutor.t_tutors?.t_persons?.last_name || ''}`.trim() : '',
        tutorPhone: academicTutor?.t_tutors?.t_persons?.phone || '',
        tutorEmail: academicTutor?.t_tutors?.t_persons?.email || '',
        professionalPracticeId: practiceId
      };

      const careerId = (enrollment as any).CAREER_ID;
      if (careerId) {
        const { data: career } = await supabase
          .from('t_career')
          .select('CAREER_NAME')
          .eq('CAREER_ID', careerId)
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

    // Primero obtener el person_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('person_id')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const personId = userData.person_id;

    const { data: student, error } = await supabase
      .from('t_students')
      .select(`
        STUDENTS_ID,
        STUDENT_TYPE,
        MILITARY_RANK,
        EMPLOYMENT,
        STATUS,
        REGISTRATION_DATE,
        t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status)
      `)
      .eq('person_id', personId)
      .single();

    if (error || !student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    // Obtener enrollment activo para datos de carrera/semestre/sección
    const { data: profileEnrollments } = await supabase
      .from('t_professional_practices')
      .select(`
        PRACTICES_STATUS, REGISTRATION_DATE,
        SEMESTER, SECTION, REGIME, CAREER_ID,
        t_career (CAREER_NAME)
      `)
      .eq('STUDENTS_ID', student.STUDENTS_ID)
      .eq('STATUS', 1);

    const enrollment = pickBestEnrollment(profileEnrollments);

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
        birthdate: (student as any)?.t_persons?.birthdate,
        address: (student as any)?.t_persons?.address,
        maritalStatus: (student as any)?.t_persons?.marital_status,
        semester: (enrollment as any)?.SEMESTER || null,
        section: (enrollment as any)?.SECTION || null,
        regime: (enrollment as any)?.REGIME || null,
        studentType: student.STUDENT_TYPE,
        militaryRank: student.MILITARY_RANK,
        employment: student.EMPLOYMENT,
        careerName: (enrollment as any)?.t_career?.CAREER_NAME || '',
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

    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('person_id')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('person_id', userData.person_id)
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
        CREATION_DATE,
        PROCESSED_AT,
        t_request_types (NAME)
      `)
      .eq('STUDENT_ID', student.STUDENTS_ID)
      .order('CREATION_DATE', { ascending: false });

    if (error) throw error;

    const requests: StudentRequest[] = (data || []).map((r: any) => ({
      id: r.REQUEST_ID,
      typeId: r.REQUEST_TYPE_ID,
      typeName: r.t_request_types?.NAME || '',
      subject: r.SUBJECT,
      description: r.DESCRIPTION,
      status: r.STATUS,
      response: r.RESPONSE,
      createdAt: r.CREATION_DATE,
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

export const getStudentTracking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    // Primero obtener el person_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('person_id')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const personId = userData.person_id;

    const { data: studentData } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('person_id', personId)
      .single();

    if (!studentData) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    const studentId = studentData.STUDENTS_ID;

    const { data: trackEnrollments } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE, END_DATE, GRADE, PRACTICES_STATUS, REGISTRATION_DATE,
        CAREER_ID,
        t_internships_period(DESCRIPTION),
        t_internship_type(NAME, HOURS_REQUIRED),
        t_institution(INSTITUTION_NAME),
        t_professional_practices_tutor(
          TUTOR_TYPE,
          t_tutors(t_persons!inner(first_name, last_name, phone, email))
        )
      `)
      .eq('STUDENTS_ID', studentId)
      .eq('STATUS', 1);

    const practice = pickBestEnrollment(trackEnrollments);

    if (!practice) {
      return res.json({ success: true, data: { internship: null, tracking: [], visits: [], activityLogs: { totalHours: 0, totalLogs: 0, approvedLogs: 0, pendingLogs: 0, recentLogs: [] } } });
    }

    const practiceId = (practice as any).PROFESSIONAL_PRACTICE_ID;
    const academicTutor = (practice as any).t_professional_practices_tutor?.find((t: any) => t.TUTOR_TYPE === 'ACADEMICO');
    const requiredHours = (practice as any).t_internship_type?.HOURS_REQUIRED || 120;

    const { data: logsData } = await supabase
      .from('t_activity_logs')
      .select('ACTIVITY_LOG_ID, ACTIVITY_DATE, HOURS_WORKED, ACTIVITY_DESCRIPTION, ACTIVITY_TYPE, SUPERVISOR_APPROVED')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .order('ACTIVITY_DATE', { ascending: false });

    const totalHours = (logsData || []).reduce((sum: number, log: any) => sum + (parseFloat(log.HOURS_WORKED) || 0), 0);
    const approvedLogs = (logsData || []).filter((l: any) => l.SUPERVISOR_APPROVED).length;

    const { data: visitsData } = await supabase
      .from('t_practice_visits')
      .select('VISIT_ID, VISIT_DATE, VISIT_TYPE, OBSERVATIONS, SUPERVISOR_NAME')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .order('VISIT_DATE', { ascending: false });

    let trackingData: any[] = [];
    try {
      const { data: trackData } = await supabase
        .from('t_tracking')
        .select('*')
        .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
        .order('CREATED_AT', { ascending: false });
      trackingData = trackData || [];
    } catch {
      // t_tracking no existe
    }

    // Obtener nombre de carrera
    let careerName = '';
    const trackCareerId = (practice as any).CAREER_ID;
    if (trackCareerId) {
      const { data: career } = await supabase
        .from('t_career')
        .select('CAREER_NAME')
        .eq('CAREER_ID', trackCareerId)
        .single();
      careerName = career?.CAREER_NAME || '';
    }

    const statusMap: Record<number, string> = {
      [PRACTICES_STATUS.PRE_INSCRITO]: 'pre-enrolled',
      [PRACTICES_STATUS.INSCRITO]: 'active',
      [PRACTICES_STATUS.CULMINADO]: 'completed',
      4: 'suspended',
    };

    const internship = {
      enrollmentId: String(practiceId),
      period: (practice as any).t_internships_period?.DESCRIPTION || '',
      status: statusMap[(practice as any).PRACTICES_STATUS] || 'unknown',
      careerName,
      practiceType: (practice as any).t_internship_type?.NAME || '',
      institutionName: (practice as any).t_institution?.INSTITUTION_NAME || '',
      startDate: (practice as any).START_DATE || '',
      endDate: (practice as any).END_DATE || '',
      requiredHours,
      completedHours: totalHours,
      grade: (practice as any).GRADE || null,
      tutorName: academicTutor ? `${academicTutor.t_tutors?.t_persons?.first_name || ''} ${academicTutor.t_tutors?.t_persons?.last_name || ''}`.trim() : '',
      tutorPhone: academicTutor?.t_tutors?.t_persons?.phone || '',
      tutorEmail: academicTutor?.t_tutors?.t_persons?.email || '',
    };

    res.json({
      success: true,
      data: {
        internship,
        tracking: trackingData,
        visits: (visitsData || []).map((v: any) => ({
          visitId: v.VISIT_ID,
          visitDate: v.VISIT_DATE,
          visitType: v.VISIT_TYPE,
          observations: v.OBSERVATIONS,
          supervisorName: v.SUPERVISOR_NAME,
        })),
        activityLogs: {
          totalHours,
          totalLogs: logsData?.length || 0,
          approvedLogs,
          pendingLogs: (logsData?.length || 0) - approvedLogs,
          recentLogs: (logsData || []).slice(0, 10).map((log: any) => ({
            id: log.ACTIVITY_LOG_ID,
            date: log.ACTIVITY_DATE,
            hours: parseFloat(log.HOURS_WORKED) || 0,
            description: log.ACTIVITY_DESCRIPTION,
            type: log.ACTIVITY_TYPE,
            approved: log.SUPERVISOR_APPROVED || false,
          })),
        },
      },
    });
  } catch (error) {
    console.error('[StudentTracking] Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de seguimiento' });
  }
};

export const updateStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, phone, address } = req.body;
    const supabase = dbManager.getConnection();

    // Basic field validation
    const errors: string[] = [];
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Correo electrónico inválido');
    }
    if (phone !== undefined && !/^0\d{3}-?\d{7}$/.test(phone)) {
      errors.push('Formato de teléfono inválido (ej: 0412-1234567)');
    }
    if (address !== undefined && address.length < 10) {
      errors.push('Dirección debe tener al menos 10 caracteres');
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    // Build allowed fields only — no unexpected mutations
    const updates: Record<string, string> = {};
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar al menos un campo para actualizar (email, phone, address)'
      });
    }

    // Find student's person record
    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('person_id')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const student = { person_id: userData.person_id };
    const studentError = null;

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Update person record
    const { error: updateError } = await supabase
      .from('t_persons')
      .update(updates)
      .eq('person_id', student.person_id);

    if (updateError) throw updateError;

    // Re-fetch updated profile to return consistent shape
    const { data: updated } = await supabase
      .from('t_students')
      .select(`
        STUDENTS_ID,
        STUDENT_TYPE,
        MILITARY_RANK, EMPLOYMENT, STATUS, REGISTRATION_DATE,
        t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status)
      `)
      .eq('person_id', student.person_id)
      .single();

    if (!updated) {
      return res.status(500).json({ success: false, message: 'Error al recuperar perfil actualizado' });
    }

    // Obtener enrollment activo para carrera/semestre/sección
    const { data: updateEnrollments } = await supabase
      .from('t_professional_practices')
      .select(`
        PRACTICES_STATUS, REGISTRATION_DATE,
        SEMESTER, SECTION, REGIME, CAREER_ID,
        t_career (CAREER_NAME)
      `)
      .eq('STUDENTS_ID', updated.STUDENTS_ID)
      .eq('STATUS', 1);

    const updateEnrollment = pickBestEnrollment(updateEnrollments);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        id: updated.STUDENTS_ID,
        ci: (updated as any).t_persons?.ci || '',
        name: (updated as any).t_persons?.first_name || '',
        secondName: (updated as any).t_persons?.middle_name || '',
        surname: (updated as any).t_persons?.last_name || '',
        secondSurname: (updated as any).t_persons?.second_last_name || '',
        fullName: `${(updated as any).t_persons?.first_name || ''} ${(updated as any).t_persons?.middle_name || ''} ${(updated as any).t_persons?.last_name || ''} ${(updated as any).t_persons?.second_last_name || ''}`.replace(/\s+/g, ' ').trim(),
        email: (updated as any)?.t_persons?.email,
        phone: (updated as any)?.t_persons?.phone,
        gender: (updated as any)?.t_persons?.gender,
        birthdate: (updated as any)?.t_persons?.birthdate,
        address: (updated as any)?.t_persons?.address,
        maritalStatus: (updated as any)?.t_persons?.marital_status,
        semester: (updateEnrollment as any)?.SEMESTER || null,
        section: (updateEnrollment as any)?.SECTION || null,
        regime: (updateEnrollment as any)?.REGIME || null,
        studentType: updated.STUDENT_TYPE,
        militaryRank: updated.MILITARY_RANK,
        employment: updated.EMPLOYMENT,
        careerName: (updateEnrollment as any)?.t_career?.CAREER_NAME || '',
        status: updated.STATUS,
        registrationDate: updated.REGISTRATION_DATE
      }
    });

  } catch (error) {
    console.error('[StudentDashboard] Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAvailableOptions = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const [tutorsRaw, institutionsRaw, careersRaw] = await Promise.all([
      supabase
        .from('t_tutors')
        .select('TUTOR_ID, t_persons!inner(first_name, last_name)')
        .eq('STATUS', 1),
      supabase
        .from('t_institution')
        .select('INSTITUTION_ID, INSTITUTION_NAME')
        .eq('STATUS', 1)
        .order('INSTITUTION_NAME'),
      supabase
        .from('t_career')
        .select('CAREER_ID, CAREER_NAME')
        .eq('STATUS', 1)
        .order('CAREER_NAME'),
    ]);

    const tutors = (tutorsRaw.data || []).map((t: any) => ({
      tutorId: t.TUTOR_ID,
      name: t.t_persons?.first_name || '',
      surname: t.t_persons?.last_name || '',
    }));

    const institutions = (institutionsRaw.data || []).map((i: any) => ({
      institutionId: i.INSTITUTION_ID,
      institutionName: i.INSTITUTION_NAME,
    }));

    const careers = (careersRaw.data || []).map((c: any) => ({
      careerId: c.CAREER_ID,
      careerName: c.CAREER_NAME,
    }));

    res.json({ success: true, data: { tutors, institutions, careers } });
  } catch (error) {
    console.error('[StudentDashboard] Error getting available options:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar opciones disponibles',
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

    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('person_id')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID, person_id')
      .eq('person_id', userData.person_id)
      .single();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    const insertData: Record<string, unknown> = {
      STUDENT_ID: student.STUDENTS_ID,
      student_person_id: student.person_id,
      REQUEST_TYPE_ID: typeId,
      SUBJECT: sanitizeText(subject) ?? '',
      DESCRIPTION: sanitizeText(description) ?? '',
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
