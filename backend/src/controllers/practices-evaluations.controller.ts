/**
 * @file Controlador para prácticas con evaluaciones y culminación
 * @description Endpoints unificados para el módulo de Evaluaciones y Culminación
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { evaluationConfig } from '../config/evaluation.config.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

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
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_career (
          CAREER_ID,
          CAREER_NAME,
          MINIMUM_GRADE
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
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO); // Solo inscritos (no pre-inscritos)

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

    // Obtener horas trabajadas desde t_practice_visits
    const { data: visits } = await supabase
      .from('t_practice_visits')
      .select('PROFESSIONAL_PRACTICE_ID, HOURS_WORKED')
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
    (visits || []).forEach(t => {
      const current = hoursMap.get(t.PROFESSIONAL_PRACTICE_ID) || 0;
      hoursMap.set(t.PROFESSIONAL_PRACTICE_ID, current + (t.HOURS_WORKED || 0));
    });

    // Procesar prácticas
    let processedPractices = (practices as any[]).map(p => {
      const student = p.t_persons;
      const career = p.t_career;
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
          Object.entries(evaluationConfig.weights).reduce((sum, [type, weight]) => {
            return sum + ((statusMap[type]?.score || 0) * weight);
          }, 0);
        finalGrade = Math.round(finalGrade * 100) / 100;
      }

      // Obtener nota mínima de la carrera
      const minimumGrade = career?.MINIMUM_GRADE || 10;

      // Determinar resultado usando la nota mínima de la carrera
      let practiceResult: 'approved' | 'failed' | 'pending' = 'pending';
      if (finalGrade !== null) {
        practiceResult = finalGrade >= minimumGrade ? 'approved' : 'failed';
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

      // Devolver también la nota mínima para uso en el frontend
      const studentName = student 
        ? `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.second_last_name || ''}`.trim().replace(/\s+/g, ' ')
        : '';

      return {
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: student?.ci || '',
        studentName,
        careerId: career?.CAREER_ID || 0,
        careerName: career?.CAREER_NAME || '',
        minimumGrade,
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
        CAREER_ID,
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
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO); // Solo inscritos

    const { data: practices, error } = await query;

    if (error) throw error;
    if (!practices || practices.length === 0) {
      return res.json({
        success: true,
        data: { total: 0, completed: 0, partial: 0, pending: 0, approved: 0, failed: 0 }
      });
    }

    const practiceIds = (practices as any[]).map(p => p.PROFESSIONAL_PRACTICE_ID);

    // Obtener MINIMUM_GRADE de todas las carreras involucradas
    const careerIds = [...new Set((practices as any[]).map(p => p.CAREER_ID).filter(Boolean))] as number[];
    const careerMinGradeMap = new Map<number, number>();
    if (careerIds.length > 0) {
      const { data: careers } = await supabase
        .from('t_career')
        .select('CAREER_ID, MINIMUM_GRADE')
        .in('CAREER_ID', careerIds);
      (careers || []).forEach((c: any) => {
        careerMinGradeMap.set(c.CAREER_ID, c.MINIMUM_GRADE || 10);
      });
    }
    // Mapa practiceId -> minimumGrade (fallback 10 si no hay carrera)
    const practiceMinGrade = new Map<number, number>();
    (practices as any[]).forEach(p => {
      practiceMinGrade.set(p.PROFESSIONAL_PRACTICE_ID, careerMinGradeMap.get(p.CAREER_ID) || 10);
    });

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

    const evaluatorTypes = Object.keys(evaluationConfig.weights);
    const totalEvaluatorTypes = evaluatorTypes.length;
    (practices as any[]).forEach(p => {
      const count = evalCountByPractice.get(p.PROFESSIONAL_PRACTICE_ID) || 0;
      if (count === totalEvaluatorTypes) completed++;
      else if (count > 0) partial++;
      else pending++;
    });

    // Calcular aprobados y reprobados (solo prácticas con todas las evaluaciones)
    let approved = 0, failed = 0;
    const practiceEvals = new Map<string, Record<string, number>>();
    (evaluations || []).forEach(e => {
      const existing = practiceEvals.get(String(e.PROFESSIONAL_PRACTICE_ID)) || {};
      existing[e.EVALUATOR_TYPE] = e.TOTAL_SCORE;
      practiceEvals.set(String(e.PROFESSIONAL_PRACTICE_ID), existing);
    });

    practiceEvals.forEach((typeScores, practiceId) => {
      const hasAll = evaluatorTypes.every(type => typeScores[type] !== undefined);
      if (hasAll) {
        const finalGrade = evaluatorTypes.reduce((sum, type) => {
          return sum + (typeScores[type] || 0) * evaluationConfig.weights[type as keyof typeof evaluationConfig.weights];
        }, 0);
        const minGrade = practiceMinGrade.get(Number(practiceId)) || 10;
        if (finalGrade >= minGrade) approved++;
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
      message: 'Error al obtener prácticas'
    });
  }
};

/**
 * Obtiene el detalle completo de un estudiante y su práctica
 */
export const getStudentDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = parseInt(id, 10);
    
    if (isNaN(practiceId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de práctica inválido'
      });
    }
    
    const supabase = dbManager.getConnection();

    // Obtener práctica con información relacionada
    const { data: practice, error } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        GRADE,
        PRACTICES_STATUS,
        EVALUATION_STATUS,
        ENROLLMENT,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_career (
          CAREER_ID,
          CAREER_NAME
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
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1)
      .single();

    if (error || !practice) {
      return res.status(404).json({
        success: false,
        message: 'Práctica no encontrada'
      });
    }

    const student = (practice as any).t_persons;
    const career = (practice as any).t_career;
    const period = (practice as any).t_internships_period;
    const practiceType = (practice as any).t_internship_type;
    const institution = (practice as any).t_institution;

    // Obtener evaluaciones
    const { data: evaluations } = await supabase
      .from('t_evaluation')
      .select('*')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1);

    // Obtener visitas
    const { data: visits } = await supabase
      .from('t_practice_visits')
      .select('*')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1)
      .order('VISIT_DATE', { ascending: false });

    // Obtener documentos
    const { data: documents } = await supabase
      .from('t_documents')
      .select('*')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1)
      .order('CREATION_DATE', { ascending: false });

    // Obtener culminación
    const { data: culmination } = await supabase
      .from('t_practice_culmination')
      .select('*')
      .eq('PRACTICE_ID', practiceId)
      .single();

    // Obtener horas trabajadas desde t_practice_visits
    let totalHours = (visits || []).reduce((sum, v) => sum + (v.HOURS_WORKED || 0), 0);

    // Procesar estado de evaluaciones
    const evaluatorTypes = Object.keys(evaluationConfig.weights);
    const evalStatusMap: Record<string, { completed: boolean; score: number | null }> = {};
    evaluatorTypes.forEach(type => {
      evalStatusMap[type] = { completed: false, score: null };
    });

    let finalGrade: number | null = null;
    let evalStatus: 'pending' | 'partial' | 'completed' = 'pending';

    (evaluations || []).forEach(e => {
      if (evalStatusMap[e.EVALUATOR_TYPE]) {
        evalStatusMap[e.EVALUATOR_TYPE] = {
          completed: true,
          score: e.TOTAL_SCORE || null
        };
      }
    });

    const completedCount = Object.values(evalStatusMap).filter(e => e.completed).length;
    if (completedCount === evaluatorTypes.length) {
      evalStatus = 'completed';
      finalGrade = 
        Object.entries(evaluationConfig.weights).reduce((sum, [type, weight]) => {
          return sum + ((evalStatusMap[type]?.score || 0) * weight);
        }, 0);
      finalGrade = Math.round(finalGrade * 100) / 100;
    } else if (completedCount > 0) {
      evalStatus = 'partial';
    }

    // Etiquetas de estado
    const statusLabels: Record<number, string> = {
      1: 'Pre Inscripto',
      2: 'Inscripto',
      3: 'Culminado',
      0: 'Retirado'
    };

    // Procesar culminación
    let culminStatus: 'pending' | 'approved' | 'certified' = 'pending';
    let certificateNumber: string | undefined;
    let certifiedAt: string | undefined;

    if (culmination) {
      if (culmination.STATUS === 2) {
        culminStatus = 'certified';
        certificateNumber = culmination.CERTIFICATE_NUMBER;
        certifiedAt = culmination.CERTIFIED_AT;
      } else if (culmination.STATUS === 1) {
        culminStatus = 'approved';
      }
    }

    const studentName = student 
      ? `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.second_last_name || ''}`.trim().replace(/\s+/g, ' ')
      : '';

    res.json({
      success: true,
      data: {
        student: {
          studentCi: student?.ci || '',
          studentName,
          careerId: career?.CAREER_ID || 0,
          careerName: career?.CAREER_NAME || ''
        },
        practice: {
          practiceId: practice.PROFESSIONAL_PRACTICE_ID,
          enrollment: practice.ENROLLMENT || '',
          startDate: practice.START_DATE || '',
          endDate: practice.END_DATE || '',
          institutionId: institution?.INSTITUTION_ID || 0,
          institutionName: institution?.INSTITUTION_NAME || '',
          periodId: period?.PERIOD_ID || 0,
          periodName: period?.DESCRIPTION || '',
          practiceTypeId: practiceType?.INTERNSHIP_TYPE_ID || 0,
          practiceTypeName: practiceType?.NAME || '',
          totalHours,
          practicesStatus: practice.PRACTICES_STATUS,
          practicesStatusLabel: statusLabels[practice.PRACTICES_STATUS] || 'Desconocido'
        },
        evaluations: {
          institucional: evalStatusMap.INSTITUCIONAL,
          academico: evalStatusMap.ACADEMICO,
          comite: evalStatusMap.COMITE,
          finalGrade,
          status: evalStatus
        },
        visits: (visits || []).map(v => ({
          visitId: v.VISIT_ID,
          visitDate: v.VISIT_DATE,
          visitType: v.VISIT_TYPE,
          visitCase: v.VISIT_CASE || '',
          hoursWorked: v.HOURS_WORKED || 0,
          activitiesPerformed: v.ACTIVITIES_PERFORMED || '',
          observations: v.OBSERVATIONS || '',
          recommendations: v.RECOMMENDATIONS || ''
        })),
        documents: (documents || []).map(d => ({
          documentId: d.DOCUMENT_ID,
          documentType: d.DOCUMENT_TYPE || '',
          fileName: d.FILE_NAME || '',
          filePath: d.FILE_PATH || '',
          status: d.DOCUMENT_STATUS || 'PENDING',
          uploadedAt: d.CREATION_DATE || ''
        })),
        culmination: {
          status: culminStatus,
          certificateNumber,
          certifiedAt
        }
      }
    });

  } catch (error) {
    console.error('[getStudentDetail] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del estudiante'
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
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO); // Solo inscritos

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