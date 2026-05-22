import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete } from '../utils/audit-helpers.js';
import { notifyEvaluationCreated } from '../services/notification.service.js';
import { evaluationConfig } from '../config/evaluation.config.js';

interface EvaluationCriteria {
  criteriaId: number;
  itemNumber: number;
  description: string;
  evaluatorType: string;
}

interface EvaluationDetail {
  criteriaId: number;
  itemNumber: number;
  score: number;
}

interface CreateEvaluationData {
  professionalPracticeId: number;
  evaluatorType: 'INSTITUCIONAL' | 'ACADEMICO' | 'COMITE';
  evaluatorId?: number;
  evaluatorName: string;
  evaluatorCi?: string;
  observations?: string;
  items: EvaluationDetail[];
}

/**
 * GET /api/evaluations/system-config
 * Devuelve la configuración global del sistema de evaluación.
 * Pública — no requiere autenticación.
 */
export const getSystemConfig = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: evaluationConfig
  });
};

export const getCriteria = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;
    const supabase = dbManager.getConnection();

    let query = supabase
      .from('t_evaluation_criteria')
      .select('*')
      .eq('STATUS', 1)
      .order('ITEM_NUMBER', { ascending: true });

    if (type) {
      query = query.eq('EVALUATOR_TYPE', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    const criteria: EvaluationCriteria[] = (data || []).map((c: any) => ({
      criteriaId: c.CRITERIA_ID,
      itemNumber: c.ITEM_NUMBER,
      description: c.DESCRIPTION,
      evaluatorType: c.EVALUATOR_TYPE
    }));

    res.json({ success: true, data: criteria });

  } catch (error) {
    console.error('[Evaluation] Error getting criteria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener criterios de evaluación'
    });
  }
};

export const getEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId, status } = req.query;
    const supabase = dbManager.getConnection();

    let query = supabase
      .from('t_evaluation')
      .select(`
        EVALUATION_ID,
        PROFESSIONAL_PRACTICE_ID,
        EVALUATOR_TYPE,
        EVALUATOR_ID,
        EVALUATOR_NAME,
        EVALUATOR_CI,
        TOTAL_SCORE,
        OBSERVATIONS,
        EVALUATION_DATE,
        REGISTERED_BY,
        STATUS
      `)
      .eq('STATUS', 1)
      .order('EVALUATION_DATE', { ascending: false });

    if (practiceId) {
      query = query.eq('PROFESSIONAL_PRACTICE_ID', practiceId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const evaluations = (data || []).map((e: any) => ({
      evaluationId: e.EVALUATION_ID,
      professionalPracticeId: e.PROFESSIONAL_PRACTICE_ID,
      evaluatorType: e.EVALUATOR_TYPE,
      evaluatorId: e.EVALUATOR_ID,
      evaluatorName: e.EVALUATOR_NAME,
      evaluatorCi: e.EVALUATOR_CI,
      totalScore: e.TOTAL_SCORE,
      observations: e.OBSERVATIONS,
      evaluationDate: e.EVALUATION_DATE,
      registeredBy: e.REGISTERED_BY,
      weight: evaluationConfig.weights[e.EVALUATOR_TYPE as keyof typeof evaluationConfig.weights] || 0
    }));

    res.json({ success: true, data: evaluations });

  } catch (error) {
    console.error('[Evaluation] Error getting evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evaluaciones'
    });
  }
};

export const getEvaluationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { data: evaluation, error: evalError } = await supabase
      .from('t_evaluation')
      .select('*')
      .eq('EVALUATION_ID', id)
      .single();

    if (evalError || !evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    const { data: details, error: detailError } = await supabase
      .from('t_evaluation_detail')
      .select(`
        DETAIL_ID,
        EVALUATION_ID,
        CRITERIA_ID,
        ITEM_NUMBER,
        SCORE
      `)
      .eq('EVALUATION_ID', id)
      .eq('STATUS', 1)
      .order('ITEM_NUMBER', { ascending: true });

    if (detailError) throw detailError;

    res.json({
      success: true,
      data: {
        evaluationId: (evaluation as any).EVALUATION_ID,
        professionalPracticeId: (evaluation as any).PROFESSIONAL_PRACTICE_ID,
        evaluatorType: (evaluation as any).EVALUATOR_TYPE,
        evaluatorId: (evaluation as any).EVALUATOR_ID,
        evaluatorName: (evaluation as any).EVALUATOR_NAME,
        evaluatorCi: (evaluation as any).EVALUATOR_CI,
        totalScore: (evaluation as any).TOTAL_SCORE,
        observations: (evaluation as any).OBSERVATIONS,
        evaluationDate: (evaluation as any).EVALUATION_DATE,
        registeredBy: (evaluation as any).REGISTERED_BY,
        items: (details || []).map((d: any) => ({
          detailId: d.DETAIL_ID,
          criteriaId: d.CRITERIA_ID,
          itemNumber: d.ITEM_NUMBER,
          score: d.SCORE
        }))
      }
    });

  } catch (error) {
    console.error('[Evaluation] Error getting evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evaluación'
    });
  }
};

export const createEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const data: CreateEvaluationData = req.body;
    const supabase = dbManager.getConnection();

    if (!data.professionalPracticeId || !data.evaluatorType || !data.evaluatorName || !data.items?.length) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    if (!['INSTITUCIONAL', 'ACADEMICO', 'COMITE'].includes(data.evaluatorType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de evaluador inválido'
      });
    }

    const { data: existing, error: checkError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
      .eq('EVALUATOR_TYPE', data.evaluatorType)
      .eq('STATUS', 1)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una evaluación de este tipo para esta práctica'
      });
    }

    // Cada criterio se puntúa según system config, se escala el promedio al displayScale
    const { score: scoreCfg } = evaluationConfig;
    const rawAverage = data.items.reduce((sum, item) => sum + item.score, 0) / data.items.length;
    const totalScore = parseFloat(((rawAverage / scoreCfg.max) * scoreCfg.displayScale).toFixed(2));

    const { data: evaluation, error: evalError } = await supabase
      .from('t_evaluation')
      .insert({
        PROFESSIONAL_PRACTICE_ID: data.professionalPracticeId,
        EVALUATOR_TYPE: data.evaluatorType,
        EVALUATOR_ID: data.evaluatorId || null,
        EVALUATOR_NAME: data.evaluatorName,
        EVALUATOR_CI: data.evaluatorCi || null,
        TOTAL_SCORE: totalScore,
        OBSERVATIONS: data.observations || null,
        REGISTERED_BY: userId
      })
      .select('EVALUATION_ID')
      .single();

    if (evalError) throw evalError;

    const evaluationId = (evaluation as any).EVALUATION_ID;

    const detailInserts = data.items.map(item => ({
      EVALUATION_ID: evaluationId,
      CRITERIA_ID: item.criteriaId,
      ITEM_NUMBER: item.itemNumber,
      SCORE: item.score
    }));

    const { error: detailError } = await supabase
      .from('t_evaluation_detail')
      .insert(detailInserts);

    if (detailError) throw detailError;

    await updatePracticeGrade(data.professionalPracticeId);

    // Auditoría de creación de evaluación
    try {
      // Obtener datos del estudiante para auditoría
      const { data: practice } = await supabase
        .from('t_professional_practices')
        .select('t_students(NAME, SURNAME)')
        .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
        .single();

      const studentsData = practice?.t_students as unknown as Array<{ NAME?: string; SURNAME?: string }> | undefined;
      const studentName = studentsData && studentsData.length > 0 
        ? `${studentsData[0].NAME || ''} ${studentsData[0].SURNAME || ''}`.trim() 
        : 'Estudiante';

      await auditCreate(req, 't_evaluation', {
        EVALUATION_ID: evaluationId,
        PROFESSIONAL_PRACTICE_ID: data.professionalPracticeId,
        EVALUATOR_TYPE: data.evaluatorType,
        EVALUATOR_NAME: data.evaluatorName,
        TOTAL_SCORE: totalScore
      }, ['EVALUATOR_TYPE', 'EVALUATOR_NAME', 'TOTAL_SCORE', 'OBSERVATIONS']);

      // Notificación a admins
      await notifyEvaluationCreated(data.evaluatorName, data.professionalPracticeId, studentName);
    } catch (auditError) {
      console.error('[Audit] Error auditing evaluation:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'Evaluación creada exitosamente',
      data: { evaluationId, totalScore }
    });

  } catch (error) {
    console.error('[Evaluation] Error creating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear evaluación'
    });
  }
};

export const updateEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { evaluatorName, evaluatorCi, observations, items } = req.body;
    const supabase = dbManager.getConnection();

    const { data: existing, error: checkError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, PROFESSIONAL_PRACTICE_ID')
      .eq('EVALUATION_ID', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    const { score: scoreCfg } = evaluationConfig;
    let totalScore = 0;
    if (items && items.length > 0) {
      const rawAverage = items.reduce((sum: number, item: any) => sum + item.score, 0) / items.length;
      totalScore = parseFloat(((rawAverage / scoreCfg.max) * scoreCfg.displayScale).toFixed(2));
    }

    const { error: updateError } = await supabase
      .from('t_evaluation')
      .update({
        EVALUATOR_NAME: evaluatorName,
        EVALUATOR_CI: evaluatorCi,
        OBSERVATIONS: observations,
        TOTAL_SCORE: totalScore
      })
      .eq('EVALUATION_ID', id);

    if (updateError) throw updateError;

    if (items && items.length > 0) {
      await supabase
        .from('t_evaluation_detail')
        .delete()
        .eq('EVALUATION_ID', id);

      const detailInserts = items.map((item: any) => ({
        EVALUATION_ID: id,
        CRITERIA_ID: item.criteriaId,
        ITEM_NUMBER: item.itemNumber,
        SCORE: item.score
      }));

      await supabase
        .from('t_evaluation_detail')
        .insert(detailInserts);
    }

    await updatePracticeGrade((existing as any).PROFESSIONAL_PRACTICE_ID);

    // Auditoría de actualización
    try {
      const oldData = { ...existing, evaluatorName: (existing as any).EVALUATOR_NAME };
      await auditUpdate(req, 't_evaluation',
        oldData as Record<string, any>,
        { ...req.body, TOTAL_SCORE: totalScore } as Record<string, any>,
        ['EVALUATOR_NAME', 'EVALUATOR_CI', 'TOTAL_SCORE', 'OBSERVATIONS']
      );
    } catch (auditError) {
      console.error('[Audit] Error auditing evaluation update:', auditError);
    }

    res.json({
      success: true,
      message: 'Evaluación actualizada exitosamente'
    });

  } catch (error) {
    console.error('[Evaluation] Error updating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evaluación'
    });
  }
};

export const deleteEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { data: existing, error: checkError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, PROFESSIONAL_PRACTICE_ID')
      .eq('EVALUATION_ID', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    await supabase
      .from('t_evaluation_detail')
      .delete()
      .eq('EVALUATION_ID', id);

    await supabase
      .from('t_evaluation')
      .update({ STATUS: 0 })
      .eq('EVALUATION_ID', id);

    await updatePracticeGrade((existing as any).PROFESSIONAL_PRACTICE_ID);

    // Auditoría de eliminación
    try {
      await auditDelete(req, 't_evaluation',
        existing as Record<string, any>,
        ['EVALUATOR_TYPE', 'EVALUATOR_NAME', 'TOTAL_SCORE']
      );
    } catch (auditError) {
      console.error('[Audit] Error auditing evaluation deletion:', auditError);
    }

    res.json({
      success: true,
      message: 'Evaluación eliminada exitosamente'
    });

  } catch (error) {
    console.error('[Evaluation] Error deleting evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evaluación'
    });
  }
};

export const getPracticeEvaluationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;
    const supabase = dbManager.getConnection();

    const { data: practice, error: practiceError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, GRADE, EVALUATION_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (practiceError || !practice) {
      return res.status(404).json({
        success: false,
        message: 'Práctica no encontrada'
      });
    }

    const { data: evaluations, error: evalError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, EVALUATOR_TYPE, TOTAL_SCORE, EVALUATOR_NAME')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1);

    if (evalError) throw evalError;

    const evaluatorTypes = Object.keys(evaluationConfig.weights);
    const statusMap: Record<string, { completed: boolean; score: number; evaluatorName: string; evaluationId?: number }> = {};
    evaluatorTypes.forEach(type => {
      statusMap[type] = { completed: false, score: 0, evaluatorName: '' };
    });

    (evaluations || []).forEach((e: any) => {
      if (statusMap[e.EVALUATOR_TYPE]) {
        statusMap[e.EVALUATOR_TYPE] = {
          completed: true,
          score: e.TOTAL_SCORE,
          evaluatorName: e.EVALUATOR_NAME,
          evaluationId: e.EVALUATION_ID
        };
      }
    });

    const totalEvaluatorTypes = Object.keys(evaluationConfig.weights).length;
    const completedCount = Object.values(statusMap).filter(s => s.completed).length;
    let evaluationStatus = 'pending';
    if (completedCount === totalEvaluatorTypes) {
      evaluationStatus = 'completed';
    } else if (completedCount > 0) {
      evaluationStatus = 'partial';
    }
    let finalGrade = 0;
    if (completedCount === totalEvaluatorTypes) {
      finalGrade = Object.entries(evaluationConfig.weights).reduce((sum, [type, weight]) => {
        return sum + (statusMap[type]?.score || 0) * weight;
      }, 0);
    }

    res.json({
      success: true,
      data: {
        practiceId,
        currentGrade: (practice as any).GRADE,
        evaluationStatus,
        evaluations: statusMap,
        finalGrade: finalGrade.toFixed(2),
        completedCount
      }
    });

  } catch (error) {
    console.error('[Evaluation] Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de evaluación'
    });
  }
};

/**
 * GET /api/evaluations/practice/:practiceId/tutor-info
 * Retorna el nombre y CI de la persona encargada de evaluar según el tipo:
 * - INSTITUCIONAL → responsable de la institución (t_institution_manager via MANAGER_ID)
 * - ACADEMICO    → tutor académico asignado (t_professional_practices_tutor con TUTOR_TYPE = 'ACADEMICO')
 * - COMITE       → siempre null (sin datos precargados)
 */
export const getPracticeTutorInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "type" es requerido (INSTITUCIONAL, ACADEMICO)'
      });
    }

    const allowedTypes = ['INSTITUCIONAL', 'ACADEMICO'];
    if (!allowedTypes.includes(type)) {
      return res.json({ success: true, data: null });
    }

    const supabase = dbManager.getConnection();

    if (type === 'INSTITUCIONAL') {
      // INSTITUCIONAL → obtener el responsable de la institución (MANAGER_ID)
      const { data: practice } = await supabase
        .from('t_professional_practices')
        .select('MANAGER_ID')
        .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
        .maybeSingle();

      if (!practice || !(practice as any).MANAGER_ID) {
        return res.json({ success: true, data: null });
      }

      const { data: manager } = await supabase
        .from('t_institution_manager')
        .select('MANAGER_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME')
        .eq('MANAGER_ID', (practice as any).MANAGER_ID)
        .maybeSingle();

      if (!manager) {
        return res.json({ success: true, data: null });
      }

      const fullName = [(manager as any).NAME, (manager as any).SECOND_NAME, (manager as any).SURNAME, (manager as any).SECOND_SURNAME]
        .filter(Boolean)
        .join(' ')
        .trim();

      return res.json({
        success: true,
        data: {
          name: fullName,
          ci: (manager as any).MANAGER_CI
        }
      });
    }

    // ACADEMICO → obtener el tutor académico asignado
    const { data: tutorAssignment } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        TUTOR_ID,
        t_tutors!inner(TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME)
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('TUTOR_TYPE', 'ACADEMICO')
      .maybeSingle();

    if (!tutorAssignment) {
      return res.json({ success: true, data: null });
    }

    const tutor = (tutorAssignment as any).t_tutors;
    const fullName = [tutor.NAME, tutor.SECOND_NAME, tutor.SURNAME, tutor.SECOND_SURNAME]
      .filter(Boolean)
      .join(' ')
      .trim();

    res.json({
      success: true,
      data: {
        name: fullName,
        ci: tutor.TUTOR_CI
      }
    });

  } catch (error) {
    console.error('[Evaluation] Error getting tutor info:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del evaluador'
    });
  }
};

async function updatePracticeGrade(practiceId: number): Promise<void> {
  const supabase = dbManager.getConnection();

  const { data: evaluations } = await supabase
    .from('t_evaluation')
    .select('EVALUATOR_TYPE, TOTAL_SCORE')
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
    .eq('STATUS', 1);

  if (!evaluations || evaluations.length === 0) {
    await supabase
      .from('t_professional_practices')
      .update({ EVALUATION_STATUS: 'pending' })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);
    return;
  }

  const typeScores: Record<string, number> = {};
  (evaluations as any[]).forEach((e: any) => {
    typeScores[e.EVALUATOR_TYPE] = e.TOTAL_SCORE;
  });

  const evaluatorTypes = Object.keys(evaluationConfig.weights);
  const allCompleted = evaluatorTypes.every(type => typeScores[type] !== undefined);

  if (allCompleted) {
    const finalGrade = evaluatorTypes.reduce((sum, type) => {
      return sum + (typeScores[type] || 0) * evaluationConfig.weights[type as keyof typeof evaluationConfig.weights];
    }, 0);

    await supabase
      .from('t_professional_practices')
      .update({ 
        GRADE: parseFloat(finalGrade.toFixed(2)),
        EVALUATION_STATUS: 'completed'
      })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);
  } else {
    await supabase
      .from('t_professional_practices')
      .update({ EVALUATION_STATUS: 'partial' })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);
  }
}
