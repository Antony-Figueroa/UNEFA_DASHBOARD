import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

interface TutorStudent {
  enrollmentId: string;
  studentId: string;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  careerName: string;
  institutionName: string;
  period: string;
  practiceType: string;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  status: string;
  grade: number;
  totalHours: number;
}

interface DashboardStats {
  totalStudents: number;
  activeInternships: number;
  pendingGrades: number;
  completedInternships: number;
}

export const getTutorDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID')
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado para este usuario' 
      });
    }

    const tutorId = tutorData.TUTOR_ID;

    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        TUTOR_TYPE,
        t_professional_practices!inner (
          PROFESSIONAL_PRACTICE_ID,
          PRACTICES_STATUS,
          GRADE,
          STATUS
        )
      `)
      .eq('TUTOR_ID', tutorId);

    if (practicesError) throw practicesError;

    const stats: DashboardStats = {
      totalStudents: practices?.length || 0,
      activeInternships: practices?.filter((p: any) => 
        p.t_professional_practices?.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO && 
        p.t_professional_practices?.STATUS === 1
      ).length || 0,
      pendingGrades: practices?.filter((p: any) => 
        p.t_professional_practices?.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO && 
        (!p.t_professional_practices?.GRADE || p.t_professional_practices?.GRADE === 0)
      ).length || 0,
      completedInternships: practices?.filter((p: any) => 
        p.t_professional_practices?.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO
      ).length || 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[TutorDashboard] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTutorStudents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { status, search } = req.query;
    const supabase = dbManager.getConnection();

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID')
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado' 
      });
    }

    const tutorId = tutorData.TUTOR_ID;

    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        TUTOR_TYPE,
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          START_DATE,
          END_DATE,
          REGISTRATION_DATE,
          GRADE,
          PRACTICES_STATUS,
          STATUS,
          STUDENTS_ID,
          INSTITUTION_ID,
          PERIOD_ID,
          INTERNSHIP_TYPE_ID,
          t_persons!inner (ci, first_name, last_name, email, phone),
          t_career (CAREER_NAME),
          t_institution (
            INSTITUTION_NAME
          ),
          t_internships_period (
            DESCRIPTION
          ),
          t_internship_type (
            NAME
          )
        )
      `)
      .eq('TUTOR_ID', tutorId);

    if (practicesError) throw practicesError;

    const enrollmentIds = practices
      ?.map((p: any) => p.t_professional_practices?.PROFESSIONAL_PRACTICE_ID)
      .filter(Boolean) || [];

    let hoursMap = new Map<number, number>();
    if (enrollmentIds.length > 0) {
      const { data: trackingData } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID, TOUR')
        .in('PROFESSIONAL_PRACTICE_ID', enrollmentIds)
        .eq('STATUS', 1);

      trackingData?.forEach((t: any) => {
        hoursMap.set(t.PROFESSIONAL_PRACTICE_ID, 0);
      });
    }

    let students: TutorStudent[] = [];

    practices?.forEach((p: any) => {
      const practice = p.t_professional_practices;
      if (!practice || practice.STATUS !== 1) return;

      const person = (practice as any).t_persons;
      const institution = practice.t_institution;
      const period = practice.t_internships_period;
      const practiceType = practice.t_internship_type;

      const statusMap: Record<number, string> = {
        1: 'pre-enrolled',
        2: 'active',
        3: 'completed',
        4: 'suspended'
      };

      students.push({
        enrollmentId: String(practice.PROFESSIONAL_PRACTICE_ID),
        studentId: String(practice.STUDENTS_ID || ''),
        studentCi: person?.ci || '',
        studentName: `${person?.first_name || ''} ${person?.last_name || ''}`.trim(),
        studentEmail: person?.email || '',
        studentPhone: person?.phone || '',
        careerName: practice?.t_career?.CAREER_NAME || '',
        institutionName: institution?.INSTITUTION_NAME || '',
        period: period?.DESCRIPTION || '',
        practiceType: practiceType?.NAME || '',
        enrollmentDate: practice.REGISTRATION_DATE || '',
        startDate: practice.START_DATE || '',
        endDate: practice.END_DATE || '',
        status: statusMap[practice.PRACTICES_STATUS] || 'unknown',
        grade: practice.GRADE || 0,
        totalHours: hoursMap.get(practice.PROFESSIONAL_PRACTICE_ID) || 0
      });
    });

    if (status && status !== 'all') {
      students = students.filter(s => s.status === status);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      students = students.filter(s =>
        s.studentName.toLowerCase().includes(searchLower) ||
        s.studentCi.toLowerCase().includes(searchLower) ||
        s.institutionName.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('[TutorDashboard] Error getting students:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTutorTracking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { enrollmentId } = req.query;
    const supabase = dbManager.getConnection();

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID')
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado' 
      });
    }

    const tutorId = tutorData.TUTOR_ID;

    let query = supabase
      .from('t_professional_practices_tutor')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        TUTOR_TYPE,
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          CREATION_DATE,
          REPORT_TITLE,
          TRANSFER,
          TOUR,
          OBSERVATION,
          STATUS,
          STUDENTS_ID,
          t_persons!inner (ci, first_name, last_name)
        )
      `)
      .eq('TUTOR_ID', tutorId);

    const { data: practices, error: practicesError } = await query;

    if (practicesError) throw practicesError;

    const validPractices = practices?.filter((p: any) => 
      p.t_professional_practices && p.t_professional_practices.STATUS === 1
    ) || [];

    let tracking: any[] = validPractices.map((p: any) => {
      const practice = p.t_professional_practices;
      const person = (practice as any).t_persons;

      return {
        trackingId: String(practice.PROFESSIONAL_PRACTICE_ID),
        enrollmentId: String(practice.PROFESSIONAL_PRACTICE_ID),
        studentCi: person?.ci || '',
        studentName: `${person?.first_name || ''} ${person?.last_name || ''}`.trim(),
        reportTitle: practice.REPORT_TITLE || '',
        transfer: practice.TRANSFER === 1,
        route: practice.TOUR || '',
        observations: practice.OBSERVATION || '',
        creationDate: practice.CREATION_DATE || '',
        tutorType: p.TUTOR_TYPE
      };
    });

    if (enrollmentId) {
      tracking = tracking.filter(t => t.enrollmentId === enrollmentId);
    }

    res.json({
      success: true,
      data: tracking
    });

  } catch (error) {
    console.error('[TutorDashboard] Error getting tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener seguimientos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateStudentGrade = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { enrollmentId } = req.params;
    const { grade, observations } = req.body;
    const supabase = dbManager.getConnection();

    if (grade === undefined || grade === null) {
      return res.status(400).json({
        success: false,
        message: 'La nota es requerida'
      });
    }

    const numGrade = parseFloat(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 20) {
      return res.status(400).json({
        success: false,
        message: 'La nota debe ser un número entre 0 y 20'
      });
    }

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID')
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado' 
      });
    }

    const tutorId = tutorData.TUTOR_ID;

    const { data: tutorPractice, error: tutorPracticeError } = await supabase
      .from('t_professional_practices_tutor')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('TUTOR_ID', tutorId)
      .eq('PROFESSIONAL_PRACTICE_ID', enrollmentId)
      .single();

    if (tutorPracticeError || !tutorPractice) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para actualizar este estudiante'
      });
    }

    const updateData: any = { GRADE: numGrade };
    if (observations) {
      updateData.OBSERVATION = observations;
    }

    const { error: updateError } = await supabase
      .from('t_professional_practices')
      .update(updateData)
      .eq('PROFESSIONAL_PRACTICE_ID', enrollmentId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Nota actualizada exitosamente',
      data: { enrollmentId, grade: numGrade }
    });

  } catch (error) {
    console.error('[TutorDashboard] Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar nota',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTutorReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type } = req.query;
    const supabase = dbManager.getConnection();

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID, person_id, t_persons!inner(first_name, last_name)')
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado' 
      });
    }

    const tutorId = tutorData.TUTOR_ID;
    const tutorPerson = (tutorData as any).t_persons || {};
    const tutorName = `${tutorPerson.first_name || ''} ${tutorPerson.last_name || ''}`.trim();

    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        TUTOR_TYPE,
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          START_DATE,
          END_DATE,
          REGISTRATION_DATE,
          GRADE,
          PRACTICES_STATUS,
          STATUS,
          t_persons!inner (ci, first_name, last_name),
          t_career (CAREER_NAME),
          t_institution (
            INSTITUTION_NAME
          ),
          t_internships_period (
            DESCRIPTION
          )
        )
      `)
      .eq('TUTOR_ID', tutorId);

    if (practicesError) throw practicesError;

    const statusMap: Record<number, string> = {
      1: 'Pre-inscrito',
      2: 'Activo',
      3: 'Completado',
      4: 'Suspendido'
    };

    const students = (practices || [])
      .filter((p: any) => p.t_professional_practices?.STATUS === 1)
      .map((p: any) => {
        const practice = p.t_professional_practices;
        const person = (practice as any).t_persons;
        const institution = practice.t_institution;
        const period = practice.t_internships_period;

        return {
          studentCi: person?.ci || '',
          studentName: `${person?.first_name || ''} ${person?.last_name || ''}`.trim(),
          careerName: practice?.t_career?.CAREER_NAME || '',
          institutionName: institution?.INSTITUTION_NAME || '',
          period: period?.DESCRIPTION || '',
          status: statusMap[practice.PRACTICES_STATUS] || 'Desconocido',
          grade: practice.GRADE || 0,
          enrollmentDate: practice.REGISTRATION_DATE || '',
          startDate: practice.START_DATE || '',
          endDate: practice.END_DATE || ''
        };
      });

    const statusCounts = students.reduce((acc: Record<string, number>, s: any) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const periodCounts = students.reduce((acc: Record<string, number>, s: any) => {
      if (s.period) {
        acc[s.period] = (acc[s.period] || 0) + 1;
      }
      return acc;
    }, {});

    const grades = students
      .filter((s: any) => s.grade > 0)
      .map((s: any) => s.grade);
    
    const averageGrade = grades.length > 0 
      ? grades.reduce((a: number, b: number) => a + b, 0) / grades.length 
      : 0;

    res.json({
      success: true,
      data: {
        tutorInfo: {
          name: tutorName,
          tutorId
        },
        summary: {
          totalStudents: students.length,
          statusDistribution: statusCounts,
          periodDistribution: periodCounts,
          averageGrade: averageGrade.toFixed(1)
        },
        students
      }
    });

  } catch (error) {
    console.error('[TutorDashboard] Error getting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTutorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select(`
        TUTOR_ID,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name,
          phone,
          email,
          gender
        ),
        PROFESSION,
        TITULO,
        CONDITION,
        DEDICATION,
        CATEGORY,
        STATUS
      `)
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado' 
      });
    }

    const p = (tutorData as any).t_persons;
    const firstName = p?.first_name || '';
    const middleName = p?.middle_name || '';
    const lastName = p?.last_name || '';
    const secondLastName = p?.second_last_name || '';

    res.json({
      success: true,
      data: {
        tutorId: tutorData.TUTOR_ID,
        ci: p?.ci,
        name: firstName,
        secondName: middleName,
        surname: lastName,
        secondSurname: secondLastName,
        fullName: `${firstName} ${middleName} ${lastName} ${secondLastName}`.replace(/\s+/g, ' ').trim(),
        phone: p?.phone,
        gender: p?.gender,
        email: p?.email,
        profession: tutorData.PROFESSION,
        titulo: tutorData.TITULO,
        condition: tutorData.CONDITION,
        dedication: tutorData.DEDICATION,
        category: tutorData.CATEGORY,
        status: tutorData.STATUS
      }
    });

  } catch (error) {
    console.error('[TutorDashboard] Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTutorPractice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { practiceId } = req.params;
    const supabase = dbManager.getConnection();

    const { data: tutorData, error: tutorError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID')
      .eq('USER_ID', userId)
      .single();

    if (tutorError || !tutorData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor no encontrado' 
      });
    }

    const tutorId = tutorData.TUTOR_ID;

    const { data: tutorPractice, error: tutorPracticeError } = await supabase
      .from('t_professional_practices_tutor')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('TUTOR_ID', tutorId)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (tutorPracticeError || !tutorPractice) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a esta práctica'
      });
    }

    const { data: practice, error: practiceError } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        REGISTRATION_DATE,
        GRADE,
        PRACTICES_STATUS,
        STATUS,
        t_persons!inner (ci, first_name, last_name, email, phone),
        t_career (CAREER_NAME),
        t_institution (
          INSTITUTION_NAME
        ),
        t_internships_period (
          DESCRIPTION
        ),
        t_internship_type (
          NAME
        )
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1)
      .single();

    if (practiceError || !practice) {
      return res.status(404).json({
        success: false,
        message: 'Práctica no encontrada'
      });
    }

    const person = (practice as any).t_persons;
    const institution = practice.t_institution as any;
    const period = practice.t_internships_period as any;
    const practiceType = practice.t_internship_type as any;

    res.json({
      success: true,
      data: {
        practiceId: practice.PROFESSIONAL_PRACTICE_ID,
        studentCi: person?.ci || '',
        studentName: `${person?.first_name || ''} ${person?.last_name || ''}`.trim(),
        studentEmail: person?.email || '',
        studentPhone: person?.phone || '',
        careerName: (practice as any)?.t_career?.CAREER_NAME || '',
        institutionName: institution?.INSTITUTION_NAME || '',
        period: period?.DESCRIPTION || '',
        practiceType: practiceType?.NAME || '',
        startDate: practice.START_DATE || '',
        endDate: practice.END_DATE || '',
        registrationDate: practice.REGISTRATION_DATE || '',
        grade: practice.GRADE || 0,
        status: practice.PRACTICES_STATUS
      }
    });

  } catch (error) {
    console.error('[TutorDashboard] Error getting practice:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener práctica',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
