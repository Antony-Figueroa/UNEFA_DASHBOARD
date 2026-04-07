/**
 * @file Controlador para prácticas con evaluaciones y culminación
 * @description Endpoints unificados para el módulo de Evaluaciones y Culminación
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';

const WEIGHTS: Record<string, number> = {
  'INSTITUCIONAL': 0.40,
  'ACADEMICO': 0.30,
  'COMITE': 0.30
};

/**
 * Obtiene todas las prácticas con información de evaluaciones y culminación
 */
export const getPracticesWithEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { 
      periodId, 
      careerId, 
      practiceTypeId, 
      evaluationStatus, 
      culminationStatus,
      result,
      search 
    } = req.query;

    // Obtener prácticas con información relacionada
    // Solo estado 2 = Inscripto (los pre-inscritos no se evalúan)
    const { data: practices, error } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        GRADE,
        PRACTICES_STATUS,
        EVALUATION_STATUS,
        t_students (
          STUDENTS_CI,
          NAME,
          SECOND_NAME,
          SURNAME,
          SECOND_SURNAME,
          CAREER_ID,
          t_career (
            CAREER_ID,
            CAREER_NAME
          )
        ),
        t_institution (
          INSTITUTION_ID,
          INSTITUTION_NAME
        ),
        t_internships_period (
          PERIOD_ID,
          DESCRIPTION
        ),
        t_internship_type (
          INTERNSHIP_TYPE_ID,
          NAME
        )
      `)
      .eq('STATUS', 1)
      .eq('PRACTICES_STATUS', 2); // Solo inscritos (no pre-inscritos)

    if (error) throw error;

    // Obtener opciones de filtros desde las tablas principales
    // Periodos - ordenados por fecha de inicio (cronológico)
    const { data: periodsData } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, DESCRIPTION, START_DATE')
      .eq('STATUS', 1)
      .order('START_DATE', { ascending: true });

    // Carreras
    const { data: careersData } = await supabase
      .from('t_career')
      .select('CAREER_ID, CAREER_NAME')
      .eq('STATUS', 1)
      .order('CAREER_NAME', { ascending: true });

    // Tipos de práctica
    const { data: practiceTypesData } = await supabase
      .from('t_internship_type')
      .select('INTERNSHIP_TYPE_ID, NAME')
      .eq('STATUS', 1)
      .order('NAME', { ascending: true });

    if (!practices || practices.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          periods: (periodsData || []).map((p: any) => ({ id: p.PERIOD_ID, name: p.DESCRIPTION })),
          careers: (careersData || []).map((c: any) => ({ id: c.CAREER_ID, name: c.CAREER_NAME })),
          practiceTypes: (practiceTypesData || []).map((t: any) => ({ id: t.INTERNSHIP_TYPE_ID, name: t.NAME }))
        }
      });
    }

    // Obtener IDs de prácticas
    const practiceIds = (practices as any[]).map(p => p.PROFESSIONAL_PRACTICE_ID);

    // Obtener evaluaciones de todas las prácticas
    const { data: allEvaluations } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, TOTAL_SCORE, EVALUATOR_NAME, STATUS')
      .eq('STATUS', 1)
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    // Obtener horas trabajadas
    const { data: tracking } = await supabase
      .from('t_tracking')
      .select('PROFESSIONAL_PRACTICE_ID, HOURS_WORKED')
      .eq('STATUS', 1)
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    // Obtener estados de culminación
    const { data: culminationRecords } = await supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID, STATUS, CERTIFICATE_NUMBER, CERTIFIED_AT')
      .in('PRACTICE_ID', practiceIds);

    const culminationMap = new Map<number, any>();
    (culminationRecords || []).forEach(c => {
      culminationMap.set(c.PRACTICE_ID, c);
    });

    // Map de horas
    const hoursMap = new Map<number, number>();
    (tracking || []).forEach(t => {
      const current = hoursMap.get(t.PROFESSIONAL_PRACTICE_ID) || 0;
      hoursMap.set(t.PROFESSIONAL_PRACTICE_ID, current + (t.HOURS_WORKED || 0));
    });

    // Procesar prácticas
    let processedPractices = (practices as any[]).map(p => {
      const student = p.t_students;
      const career = student?.t_career;
      const practiceType = p.t_internship_type;
      const period = p.t_internships_period;
      const evaluations = (allEvaluations || []).filter(e => e.PROFESSIONAL_PRACTICE_ID === p.PROFESSIONAL_PRACTICE_ID);
      const totalHours = hoursMap.get(p.PROFESSIONAL_PRACTICE_ID) || 0;
      const culmination = culminationMap.get(p.PROFESSIONAL_PRACTICE_ID);

      // Construir estado de evaluaciones
      const statusMap: Record<string, { completed: boolean; score: number; evaluatorName: string; evaluationId?: number }> = {
        'INSTITUCIONAL': { completed: false, score: 0, evaluatorName: '' },
        'ACADEMICO': { completed: false, score: 0, evaluatorName: '' },
        'COMITE': { completed: false, score: 0, evaluatorName: '' }
      };

      evaluations.forEach(e => {
        if (statusMap[e.EVALUATOR_TYPE]) {
          statusMap[e.EVALUATOR_TYPE] = {
            completed: true,
            score: e.TOTAL_SCORE || 0,
            evaluatorName: e.EVALUATOR_NAME || '',
            evaluationId: e.EVALUATION_ID
          };
        }
      });

      // Calcular estado de evaluación
      const completedCount = Object.values(statusMap).filter(s => s.completed).length;
      let evalStatus: 'pending' | 'partial' | 'completed' = 'pending';
      if (completedCount === 3) {
        evalStatus = 'completed';
      } else if (completedCount > 0) {
        evalStatus = 'partial';
      }

      // Calcular nota final
      let finalGrade: number | null = null;
      if (evalStatus === 'completed') {
        finalGrade = 
          (statusMap['INSTITUCIONAL'].score * WEIGHTS['INSTITUCIONAL']) +
          (statusMap['ACADEMICO'].score * WEIGHTS['ACADEMICO']) +
          (statusMap['COMITE'].score * WEIGHTS['COMITE']);
        finalGrade = Math.round(finalGrade * 100) / 100;
      }

      // Determinar resultado
      let practiceResult: 'approved' | 'failed' | 'pending' = 'pending';
      if (finalGrade !== null) {
        practiceResult = finalGrade >= 10 ? 'approved' : 'failed';
      }

      // Estado de culminación
      let culminStatus: 'pending' | 'approved' | 'certified' = 'pending';
      if (culmination) {
        if (culmination.STATUS === 2) {
          culminStatus = 'certified';
        } else if (culmination.STATUS === 1) {
          culminStatus = 'approved';
        }
      }

      const studentName = student 
        ? `${student.NAME || ''} ${student.SECOND_NAME || ''} ${student.SURNAME || ''} ${student.SECOND_SURNAME || ''}`.trim().replace(/\s+/g, ' ')
        : '';

      return {
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: student?.STUDENTS_CI || '',
        studentName,
        careerId: career?.CAREER_ID || 0,
        careerName: career?.CAREER_NAME || '',
        institutionId: p.t_institution?.INSTITUTION_ID || 0,
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        periodId: period?.PERIOD_ID || 0,
        periodName: period?.DESCRIPTION || '',
        practiceTypeId: practiceType?.INTERNSHIP_TYPE_ID || 0,
        practiceTypeName: practiceType?.NAME || '',
        startDate: p.START_DATE || '',
        endDate: p.END_DATE || '',
        totalHours,
        evaluationStatus: evalStatus,
        evaluations: {
          INSTITUCIONAL: statusMap['INSTITUCIONAL'],
          ACADEMICO: statusMap['ACADEMICO'],
          COMITE: statusMap['COMITE']
        },
        finalGrade,
        result: practiceResult,
        culminationStatus: culminStatus,
        certificateNumber: culmination?.CERTIFICATE_NUMBER,
        certifiedAt: culmination?.CERTIFIED_AT
      };
    });

    // Aplicar filtros
    if (periodId) {
      processedPractices = processedPractices.filter(p => p.periodId === Number(periodId));
    }
    if (careerId) {
      processedPractices = processedPractices.filter(p => p.careerId === Number(careerId));
    }
    if (practiceTypeId) {
      processedPractices = processedPractices.filter(p => p.practiceTypeId === Number(practiceTypeId));
    }
    if (evaluationStatus && evaluationStatus !== 'all') {
      processedPractices = processedPractices.filter(p => p.evaluationStatus === evaluationStatus);
    }
    if (culminationStatus && culminationStatus !== 'all') {
      processedPractices = processedPractices.filter(p => p.culminationStatus === culminationStatus);
    }
    if (result && result !== 'all') {
      processedPractices = processedPractices.filter(p => p.result === result);
    }
    if (search) {
      const searchLower = (search as string).toLowerCase();
      processedPractices = processedPractices.filter(p =>
        p.studentName.toLowerCase().includes(searchLower) ||
        p.studentCi.toLowerCase().includes(searchLower) ||
        p.institutionName.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: processedPractices,
      meta: {
        total: processedPractices.length,
        periods: (periodsData || []).map((p: any) => ({ id: p.PERIOD_ID, name: p.DESCRIPTION })),
        careers: (careersData || []).map((c: any) => ({ id: c.CAREER_ID, name: c.CAREER_NAME })),
        practiceTypes: (practiceTypesData || []).map((t: any) => ({ id: t.INTERNSHIP_TYPE_ID, name: t.NAME }))
      }
    });

  } catch (error) {
    console.error('[getPracticesWithEvaluations] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener prácticas'
    });
  }
};

/**
 * Obtiene estadísticas de evaluaciones
 */
export const getEvaluationStats = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { periodId, careerId, practiceTypeId } = req.query;

    // Obtener prácticas con información relacionada
    let query = supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_students (
          CAREER_ID
        ),
        t_internships_period (
          PERIOD_ID
        ),
        t_internship_type (
          INTERNSHIP_TYPE_ID
        )
      `)
      .eq('STATUS', 1)
      .eq('PRACTICES_STATUS', 2); // Solo inscritos

    const { data: practices, error } = await query;

    if (error) throw error;
    if (!practices || practices.length === 0) {
      return res.json({
        success: true,
        data: { total: 0, completed: 0, partial: 0, pending: 0, approved: 0, failed: 0 }
      });
    }

    const practiceIds = (practices as any[]).map(p => p.PROFESSIONAL_PRACTICE_ID);

    // Obtener evaluaciones
    const { data: evaluations } = await supabase
      .from('t_evaluation')
      .select('PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, TOTAL_SCORE')
      .eq('STATUS', 1)
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    // Contar evaluaciones por práctica
    const evalCountByPractice = new Map<number, number>();
    (evaluations || []).forEach(e => {
      const current = evalCountByPractice.get(e.PROFESSIONAL_PRACTICE_ID) || 0;
      evalCountByPractice.set(e.PROFESSIONAL_PRACTICE_ID, current + 1);
    });

    // Calcular estadísticas
    let completed = 0, partial = 0, pending = 0;

    (practices as any[]).forEach(p => {
      const count = evalCountByPractice.get(p.PROFESSIONAL_PRACTICE_ID) || 0;
      if (count === 3) completed++;
      else if (count > 0) partial++;
      else pending++;
    });

    // Calcular aprobados y reprobados (solo prácticas con 3 evaluaciones)
    let approved = 0, failed = 0;
    const practiceEvals = new Map<string, { scores: number[] }>();
    (evaluations || []).forEach(e => {
      const existing = practiceEvals.get(String(e.PROFESSIONAL_PRACTICE_ID)) || { scores: [] };
      existing.scores.push(e.TOTAL_SCORE);
      practiceEvals.set(String(e.PROFESSIONAL_PRACTICE_ID), existing);
    });

    practiceEvals.forEach(({ scores }) => {
      if (scores.length === 3) {
        const finalGrade = 
          scores[0] * WEIGHTS['INSTITUCIONAL'] +
          scores[1] * WEIGHTS['ACADEMICO'] +
          scores[2] * WEIGHTS['COMITE'];
        if (finalGrade >= 10) approved++;
        else failed++;
      }
    });

    res.json({
      success: true,
      data: { total: practices.length, completed, partial, pending, approved, failed }
    });
  } catch (error) {
    console.error('[EvaluationStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Obtiene estadísticas de culminación
 */
export const getCulminationStats = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { periodId, careerId, practiceTypeId } = req.query;

    // Obtener prácticas
    const { data: practices, error } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('STATUS', 1)
      .eq('PRACTICES_STATUS', 2); // Solo inscritos

    if (error) throw error;

    if (!practices || practices.length === 0) {
      return res.json({
        success: true,
        data: { total: 0, pending: 0, approved: 0, certified: 0 }
      });
    }

    const practiceIds = (practices as any[]).map(p => p.PROFESSIONAL_PRACTICE_ID);

    // Obtener estados de culminación
    const { data: culminationRecords } = await supabase
      .from('t_practice_culmination')
      .select('PRACTICE_ID, STATUS')
      .in('PRACTICE_ID', practiceIds);

    let pending = 0, approved = 0, certified = 0;

    // Contar prácticas sin registro de culminación como pending
    const culminMap = new Map<number, number>();
    (culminationRecords || []).forEach(c => {
      culminMap.set(c.PRACTICE_ID, c.STATUS);
    });

    (practices as any[]).forEach(p => {
      const status = culminMap.get(p.PROFESSIONAL_PRACTICE_ID);
      if (status === 2) certified++;
      else if (status === 1) approved++;
      else pending++;
    });

    res.json({
      success: true,
      data: {
        total: practices?.length || 0,
        pending,
        approved,
        certified
      }
    });
  } catch (error) {
    console.error('[getPracticesWithEvaluations] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener prácticas'
    });
  }
};