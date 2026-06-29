import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sanitizeText } from '../utils/text-utils.js';
import { auditCreate, auditUpdate, auditDelete } from '../utils/audit-helpers.js';
import { notifyEvaluationCreated } from '../services/notification.service.js';
import { getPersonField } from '../utils/person-utils.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getEvalConfig, scaleToDisplay, calculateWeightedGrade, invalidateEvalConfigCache } from '../services/evaluation-config.service.js';
import { checkSequentialPrerequisite } from '../utils/sequential-validation.js';

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
  comiteMemberIndex?: number;
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
  const config = await getEvalConfig();
  res.json({
    success: true,
    data: config
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
        COMITE_MEMBER_INDEX,
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

    const evalConfig = await getEvalConfig();

    const evaluations = (data || []).map((e: any) => ({
      evaluationId: e.EVALUATION_ID,
      professionalPracticeId: e.PROFESSIONAL_PRACTICE_ID,
      evaluatorType: e.EVALUATOR_TYPE,
      comiteMemberIndex: e.COMITE_MEMBER_INDEX || undefined,
      evaluatorId: e.EVALUATOR_ID,
      evaluatorName: e.EVALUATOR_NAME,
      evaluatorCi: e.EVALUATOR_CI,
      totalScore: e.TOTAL_SCORE,
      observations: e.OBSERVATIONS,
      evaluationDate: e.EVALUATION_DATE,
      registeredBy: e.REGISTERED_BY,
      weight: evalConfig.weights[e.EVALUATOR_TYPE as keyof typeof evalConfig.weights] || 0
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
        comiteMemberIndex: (evaluation as any).COMITE_MEMBER_INDEX || undefined,
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

    if (data.evaluatorType === 'COMITE') {
      if (!data.comiteMemberIndex || ![1, 2, 3].includes(data.comiteMemberIndex)) {
        return res.status(400).json({
          success: false,
          message: 'comiteMemberIndex es requerido (1, 2 o 3) para evaluaciones COMITE'
        });
      }

      const { data: existingComite, error: comiteError } = await supabase
        .from('t_evaluation')
        .select('EVALUATION_ID')
        .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
        .eq('EVALUATOR_TYPE', 'COMITE')
        .eq('COMITE_MEMBER_INDEX', data.comiteMemberIndex)
        .eq('STATUS', 1)
        .maybeSingle();

      if (existingComite) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una evaluación del miembro #${data.comiteMemberIndex} del comité para esta práctica`
        });
      }
    } else {
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
    }

    // Auto-completar desde pre-asignación si es COMITE y no se proporcionó nombre
    if (data.evaluatorType === 'COMITE' && data.comiteMemberIndex) {
      const { data: preAssignment } = await supabase
        .from('t_committee_assignment')
        .select('EVALUATOR_NAME, EVALUATOR_CI')
        .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
        .eq('COMITE_MEMBER_INDEX', data.comiteMemberIndex)
        .maybeSingle();

      if (preAssignment) {
        // Si el nombre enviado difiere del pre-asignado, registrar advertencia pero no bloquear
        if (data.evaluatorName && data.evaluatorName.trim().toLowerCase() !== preAssignment.EVALUATOR_NAME.trim().toLowerCase()) {
          console.warn(
            `[Evaluation] COMITE member #${data.comiteMemberIndex}: name "${data.evaluatorName}" differs from pre-assigned "${preAssignment.EVALUATOR_NAME}"`
          );
        }
        // Si no se envió nombre, auto-completar desde pre-asignación
        if (!data.evaluatorName || data.evaluatorName.trim().length < 3) {
          data.evaluatorName = preAssignment.EVALUATOR_NAME;
          if (!data.evaluatorCi && preAssignment.EVALUATOR_CI) {
            data.evaluatorCi = preAssignment.EVALUATOR_CI;
          }
        }
      }
    }

    // Validar que la práctica no esté culminada (no se pueden agregar evaluaciones nuevas)
    const { data: practiceStatus } = await supabase
      .from('t_professional_practices')
      .select('PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
      .single();

    if (practiceStatus && practiceStatus.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden agregar evaluaciones a una práctica culminada.'
      });
    }

    if (practiceStatus && practiceStatus.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden agregar evaluaciones a una práctica reprobada.'
      });
    }

    // Verificar congelamiento (cierre de actas)
    const { data: frozenEval } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
      .not('FROZEN_AT', 'is', null)
      .limit(1)
      .maybeSingle();

    if (frozenEval) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden agregar evaluaciones: las actas están cerradas. Solicite una corrección al coordinador.'
      });
    }

    // Validar prerrequisito secuencial (ej: HOSP debe estar culminado antes de evaluar COM)
    const seqCheck = await checkSequentialPrerequisite(supabase, { practiceId: data.professionalPracticeId });
    if (!seqCheck.valid) {
      return res.status(400).json({ success: false, message: seqCheck.message });
    }

    // Cada criterio se puntúa según system config, se escala el promedio al displayScale
    const rawAverage = data.items.reduce((sum, item) => sum + item.score, 0) / data.items.length;
    const totalScore = await scaleToDisplay(rawAverage);

    const { data: evaluation, error: evalError } = await supabase
      .from('t_evaluation')
      .insert({
        PROFESSIONAL_PRACTICE_ID: data.professionalPracticeId,
        EVALUATOR_TYPE: data.evaluatorType,
        COMITE_MEMBER_INDEX: data.evaluatorType === 'COMITE' ? data.comiteMemberIndex : null,
        EVALUATOR_ID: data.evaluatorId || null,
        EVALUATOR_NAME: sanitizeText(data.evaluatorName) ?? '',
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
        .select('t_persons!inner(first_name, last_name)')
        .eq('PROFESSIONAL_PRACTICE_ID', data.professionalPracticeId)
        .single();

      const sFirst = getPersonField((practice as any)?.t_persons, 'first_name') || '';
      const sLast = getPersonField((practice as any)?.t_persons, 'last_name') || '';
      const studentName = (sFirst || sLast) ? `${sFirst} ${sLast}`.trim() : 'Estudiante';

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

    // No permitir modificar evaluaciones de prácticas culminadas
    const { data: practiceStatus } = await supabase
      .from('t_professional_practices')
      .select('PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', (existing as any).PROFESSIONAL_PRACTICE_ID)
      .single();

    if (practiceStatus && practiceStatus.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO) {
      return res.status(403).json({
        success: false,
        message: 'No se puede modificar evaluaciones de prácticas culminadas.'
      });
    }

    // Verificar congelamiento (cierre de actas) — permitir si fue descongelada
    const { data: evalFreezeCheck } = await supabase
      .from('t_evaluation')
      .select('FROZEN_AT, UNFROZEN_AT')
      .eq('EVALUATION_ID', id)
      .single();

    if (evalFreezeCheck?.FROZEN_AT && !evalFreezeCheck?.UNFROZEN_AT) {
      return res.status(403).json({
        success: false,
        message: 'No se puede modificar: las actas están cerradas. Solicite una corrección al coordinador.'
      });
    }

    let totalScore = 0;
    if (items && items.length > 0) {
      const rawAverage = items.reduce((sum: number, item: any) => sum + item.score, 0) / items.length;
      totalScore = await scaleToDisplay(rawAverage);
    }

    const { error: updateError } = await supabase
      .from('t_evaluation')
      .update({
        EVALUATOR_NAME: sanitizeText(evaluatorName) ?? '',
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

    // No permitir borrar evaluaciones de prácticas culminadas
    const { data: practiceRow } = await supabase
      .from('t_professional_practices')
      .select('PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', (existing as any).PROFESSIONAL_PRACTICE_ID)
      .single();

    if (practiceRow && practiceRow.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO) {
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar evaluaciones de prácticas culminadas.'
      });
    }

    // Verificar congelamiento
    const { data: delFreezeCheck } = await supabase
      .from('t_evaluation')
      .select('FROZEN_AT, UNFROZEN_AT')
      .eq('EVALUATION_ID', id)
      .single();

    if (delFreezeCheck?.FROZEN_AT && !delFreezeCheck?.UNFROZEN_AT) {
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar: las actas están cerradas. Solicite una corrección al coordinador.'
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
      .select('PROFESSIONAL_PRACTICE_ID, PERIOD_ID, PRACTICES_STATUS, GRADE, EVALUATION_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (practiceError || !practice) {
      return res.status(404).json({
        success: false,
        message: 'Práctica no encontrada'
      });
    }

    const evalConfig = await getEvalConfig();

    // Determinar si se puede evaluar (periodo activo + ventana)
    let canEvaluate = true;
    let periodMessage = '';

    try {
      const { data: period } = await supabase
        .from('t_internships_period')
        .select('PERIOD_STATUS, START_DATE, END_DATE')
        .eq('PERIOD_ID', (practice as any).PERIOD_ID)
        .single();

      if (period) {
        const now = new Date();
        const startDate = new Date(period.START_DATE);
        const effectiveEndDate = new Date(period.END_DATE);
        effectiveEndDate.setDate(effectiveEndDate.getDate() + evalConfig.evaluationWindowDays);

        if ((practice as any).PRACTICES_STATUS !== 2) {
          canEvaluate = false;
          periodMessage = 'La práctica no está inscrita.';
        } else if (period.PERIOD_STATUS !== '2') {
          canEvaluate = false;
          periodMessage = 'El periodo académico no está activo.';
        } else if (now < startDate) {
          canEvaluate = false;
          periodMessage = 'El periodo académico aún no ha iniciado.';
        } else if (now > effectiveEndDate) {
          canEvaluate = false;
          periodMessage = `La ventana de evaluación cerró el ${effectiveEndDate.toLocaleDateString('es-VE')}.`;
        }
      }
    } catch (periodError) {
      console.error('[Evaluation] Error checking period:', periodError);
      canEvaluate = false;
      periodMessage = 'Error al verificar el periodo académico.';
    }

    const { data: evaluations, error: evalError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, EVALUATOR_TYPE, TOTAL_SCORE, EVALUATOR_NAME, COMITE_MEMBER_INDEX')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1);

    if (evalError) throw evalError;

    const committeeMin = evalConfig.committeeMinMembers ?? 3;
    const evaluatorTypes = Object.keys(evalConfig.weights);
    const statusMap: Record<string, any> = {};
    evaluatorTypes.forEach(type => {
      if (type === 'COMITE') {
        statusMap[type] = { completed: false, score: 0, completedCount: `0/${committeeMin}`, members: [], evaluatorName: '' };
      } else {
        statusMap[type] = { completed: false, score: 0, evaluatorName: '' };
      }
    });

    (evaluations || []).forEach((e: any) => {
      if (e.EVALUATOR_TYPE === 'COMITE') {
        const comiteStatus = statusMap['COMITE'];
        comiteStatus.members.push({
          memberIndex: e.COMITE_MEMBER_INDEX,
          score: e.TOTAL_SCORE,
          evaluatorName: e.EVALUATOR_NAME,
          evaluationId: e.EVALUATION_ID
        });
        comiteStatus.completedCount = `${comiteStatus.members.length}/${committeeMin}`;
        // Score provisional: promedio simple de total_scores
        comiteStatus.score = parseFloat(
          (comiteStatus.members.reduce((sum: number, m: any) => sum + m.score, 0) / comiteStatus.members.length).toFixed(1)
        );
        comiteStatus.evaluatorName = comiteStatus.members.map((m: any) => m.evaluatorName).join(', ');
      } else if (statusMap[e.EVALUATOR_TYPE]) {
        statusMap[e.EVALUATOR_TYPE] = {
          completed: true,
          score: e.TOTAL_SCORE,
          evaluatorName: e.EVALUATOR_NAME,
          evaluationId: e.EVALUATION_ID
        };
      }
    });

    // COMITE se considera completado cuando alcanza el mínimo de miembros configurado
    if (statusMap['COMITE']?.members?.length >= committeeMin) {
      statusMap['COMITE'].completed = true;
    }

    const totalEvaluatorTypes = evaluatorTypes.length;
    const completedCount = Object.values(statusMap).filter((s: any) => s.completed).length;
    let evaluationStatus = 'pending';
    if (completedCount === totalEvaluatorTypes) {
      evaluationStatus = 'completed';
    } else if (completedCount > 0) {
      evaluationStatus = 'partial';
    }
    let finalGrade = 0;
    if (completedCount === totalEvaluatorTypes) {
      finalGrade = Object.entries(evalConfig.weights).reduce((sum, [type, weight]) => {
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
        finalGrade: finalGrade.toFixed(1),
        completedCount,
        canEvaluate,
        periodMessage
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
 * GET /api/evaluations/batch-status?ids=1,2,3
 * Retorna el estado de evaluación de múltiples prácticas en una sola llamada.
 * Elimina el N+1 del frontend.
 */
export const getBatchPracticeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.query;
    if (!ids || typeof ids !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Se requieren IDs de prácticas separados por coma (?ids=1,2,3)'
      });
    }

    const practiceIds = ids.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
    if (practiceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'IDs de práctica inválidos' });
    }

    const supabase = dbManager.getConnection();

    // 1. Traer todas las prácticas en un solo query
    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, PERIOD_ID, PRACTICES_STATUS, GRADE, EVALUATION_STATUS, CAREER_ID, INTERNSHIP_TYPE_ID, STUDENTS_ID, EXTENSION_GRANTED')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    if (practicesError) throw practicesError;
    if (!practices || practices.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const batchEvalConfig = await getEvalConfig();

    // 2. Traer periodos de todas las prácticas
    const periodIds = [...new Set((practices as any[]).map(p => p.PERIOD_ID).filter(Boolean))];
    const { data: periods } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, PERIOD_STATUS, START_DATE, END_DATE')
      .in('PERIOD_ID', periodIds);

    const periodMap = new Map<number, any>();
    (periods || []).forEach(p => periodMap.set(p.PERIOD_ID, p));

    // 3. Traer evaluaciones de todas las prácticas
    const { data: evaluations, error: evalError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, PROFESSIONAL_PRACTICE_ID, EVALUATOR_TYPE, TOTAL_SCORE, EVALUATOR_NAME, COMITE_MEMBER_INDEX')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
      .eq('STATUS', 1);

    if (evalError) throw evalError;

    // 4. Agrupar evaluaciones por práctica
    const evalByPractice = new Map<number, any[]>();
    (evaluations || []).forEach((e: any) => {
      const list = evalByPractice.get(e.PROFESSIONAL_PRACTICE_ID) || [];
      list.push(e);
      evalByPractice.set(e.PROFESSIONAL_PRACTICE_ID, list);
    });

    const evaluatorTypes = Object.keys(batchEvalConfig.weights);
    const result: Record<number, any> = {};

    // 5. Procesar cada práctica
    for (const practice of (practices as any[])) {
      const period = periodMap.get(practice.PERIOD_ID);
      const practiceEvals = evalByPractice.get(practice.PROFESSIONAL_PRACTICE_ID) || [];

      // Determinar canEvaluate
      let canEvaluate = true;
      let periodMessage = '';

      if (period) {
        const now = new Date();
        const startDate = new Date(period.START_DATE);
        const effectiveEndDate = new Date(period.END_DATE);
        effectiveEndDate.setDate(effectiveEndDate.getDate() + batchEvalConfig.evaluationWindowDays);

        if (practice.PRACTICES_STATUS !== 2) {
          canEvaluate = false;
          periodMessage = 'La práctica no está inscrita.';
        } else if (period.PERIOD_STATUS !== '2') {
          canEvaluate = false;
          periodMessage = 'El periodo académico no está activo.';
        } else if (now < startDate) {
          canEvaluate = false;
          periodMessage = 'El periodo académico aún no ha iniciado.';
        } else if (now > effectiveEndDate) {
          canEvaluate = false;
          periodMessage = `La ventana de evaluación cerró el ${effectiveEndDate.toLocaleDateString('es-VE')}.`;
        }

        // Si tiene carga extemporánea autorizada, las evaluaciones se habilitan aunque el periodo esté cerrado
        if (practice.EXTENSION_GRANTED && practice.PRACTICES_STATUS === 2) {
          canEvaluate = true;
          periodMessage = 'Carga extemporánea habilitada.';
        }
      }

      const committeeMin = batchEvalConfig.committeeMinMembers ?? 3;
      // Construir status map
      const statusMap: Record<string, any> = {};
      evaluatorTypes.forEach(type => {
        if (type === 'COMITE') {
          statusMap[type] = { completed: false, score: 0, completedCount: `0/${committeeMin}`, members: [], evaluatorName: '' };
        } else {
          statusMap[type] = { completed: false, score: 0, evaluatorName: '' };
        }
      });

      practiceEvals.forEach((e: any) => {
        if (e.EVALUATOR_TYPE === 'COMITE') {
          const comite = statusMap['COMITE'];
          comite.members.push({
            memberIndex: e.COMITE_MEMBER_INDEX,
            score: e.TOTAL_SCORE,
            evaluatorName: e.EVALUATOR_NAME,
            evaluationId: e.EVALUATION_ID
          });
          comite.completedCount = `${comite.members.length}/${committeeMin}`;
          comite.score = comite.members.length > 0
            ? parseFloat((comite.members.reduce((sum: number, m: any) => sum + m.score, 0) / comite.members.length).toFixed(1))
            : 0;
          comite.evaluatorName = comite.members.map((m: any) => m.evaluatorName).join(', ');
        } else if (statusMap[e.EVALUATOR_TYPE]) {
          statusMap[e.EVALUATOR_TYPE] = {
            completed: true,
            score: e.TOTAL_SCORE,
            evaluatorName: e.EVALUATOR_NAME,
            evaluationId: e.EVALUATION_ID
          };
        }
      });

      if (statusMap['COMITE']?.members?.length >= committeeMin) {
        statusMap['COMITE'].completed = true;
      }

      const completedCount = Object.values(statusMap).filter((s: any) => s.completed).length;
      let evaluationStatus = 'pending';
      if (completedCount === evaluatorTypes.length) {
        evaluationStatus = 'completed';
      } else if (completedCount > 0) {
        evaluationStatus = 'partial';
      }

      let finalGrade = 0;
      if (completedCount === evaluatorTypes.length) {
        const scores: Record<string, number> = {};
        evaluatorTypes.forEach(type => { scores[type] = statusMap[type]?.score || 0; });
        finalGrade = await calculateWeightedGrade(scores);
      }

      // Verificar prerrequisito secuencial
      let sequentialBlocked = false;
      let sequentialBlockedReason = '';
      if (canEvaluate && practice.CAREER_ID && practice.INTERNSHIP_TYPE_ID && practice.STUDENTS_ID) {
        const seqCheck = await checkSequentialPrerequisite(supabase, {
          studentsId: practice.STUDENTS_ID,
          careerId: practice.CAREER_ID,
          internshipTypeId: practice.INTERNSHIP_TYPE_ID
        });
        if (!seqCheck.valid) {
          sequentialBlocked = true;
          sequentialBlockedReason = seqCheck.message ?? '';
        }
      }

      result[practice.PROFESSIONAL_PRACTICE_ID] = {
        practiceId: String(practice.PROFESSIONAL_PRACTICE_ID),
        currentGrade: practice.GRADE,
        evaluationStatus,
        evaluations: statusMap,
        finalGrade: finalGrade.toFixed(1),
        completedCount,
        canEvaluate: canEvaluate && !sequentialBlocked,
        practicesStatus: practice.PRACTICES_STATUS,
        sequentialBlocked,
        extensionGranted: practice.EXTENSION_GRANTED || false,
        periodMessage: sequentialBlocked ? sequentialBlockedReason : periodMessage
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Evaluation] Error getting batch status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estados de evaluación'
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
        .select('t_persons!inner(ci, first_name, middle_name, last_name, second_last_name)')
        .eq('MANAGER_ID', (practice as any).MANAGER_ID)
        .maybeSingle();

      if (!manager) {
        return res.json({ success: true, data: null });
      }

      const mFirst = getPersonField((manager as any).t_persons, 'first_name') || '';
      const mMiddle = getPersonField((manager as any).t_persons, 'middle_name') || '';
      const mLast = getPersonField((manager as any).t_persons, 'last_name') || '';
      const mSecondLast = getPersonField((manager as any).t_persons, 'second_last_name') || '';
      const fullName = [mFirst, mMiddle, mLast, mSecondLast].filter(Boolean).join(' ').trim();

      return res.json({
        success: true,
        data: {
          name: fullName,
          ci: getPersonField((manager as any).t_persons, 'ci')
        }
      });
    }

    // ACADEMICO → obtener el tutor académico asignado
    // Nota: NO se puede usar t_persons!inner directo sobre t_professional_practices_tutor
    // porque no hay FK directa. La cadena es:
    // t_professional_practices_tutor → t_tutors (via TUTOR_ID) → t_persons (via person_id)
    const { data: tutorAssignment } = await supabase
      .from('t_professional_practices_tutor')
      .select(`
        TUTOR_ID,
        t_tutors!inner (
          t_persons!inner (ci, first_name, middle_name, last_name, second_last_name)
        )
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('TUTOR_TYPE', 'ACADEMICO')
      .maybeSingle();

    if (!tutorAssignment) {
      return res.json({ success: true, data: null });
    }

    const tutorPerson = (tutorAssignment as any).t_tutors?.t_persons;
    const tFirst = getPersonField(tutorPerson, 'first_name') || '';
    const tMiddle = getPersonField(tutorPerson, 'middle_name') || '';
    const tLast = getPersonField(tutorPerson, 'last_name') || '';
    const tSecondLast = getPersonField(tutorPerson, 'second_last_name') || '';
    const fullName = [tFirst, tMiddle, tLast, tSecondLast].filter(Boolean).join(' ').trim();

    res.json({
      success: true,
      data: {
        name: fullName,
        ci: getPersonField(tutorPerson, 'ci')
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

/**
 * POST /evaluations/:practiceId/mark-failed
 * Marca manualmente una práctica como REPROBADO (para casos extremos/migración)
 */
export const markPracticeAsFailed = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;
    const supabase = dbManager.getConnection();

    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select('PRACTICES_STATUS, EVALUATION_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (!practice) {
      res.status(404).json({ message: 'Práctica no encontrada' });
      return;
    }

    if (practice.PRACTICES_STATUS !== PRACTICES_STATUS.INSCRITO) {
      res.status(400).json({ message: 'Solo se puede marcar como reprobada una práctica en estado Inscrito' });
      return;
    }

    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    res.json({ message: 'Práctica marcada como reprobada exitosamente' });
  } catch (error) {
    console.error('[EvaluationController] Error marking practice as failed:', error);
    res.status(500).json({ message: 'Error al marcar práctica como reprobada' });
  }
};

/**
 * POST /api/practices/:practiceId/grant-extension
 * Concede carga extemporánea para una práctica en periodo cerrado.
 * Salta las validaciones de periodo y fecha en el middleware.
 */
export const grantExtension = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de la extensión es requerido (mínimo 10 caracteres)'
      });
    }

    // Verificar que la práctica existe
    const { data: practice, error: practiceError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (practiceError || !practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('t_professional_practices')
      .update({
        EXTENSION_GRANTED: true,
        EXTENSION_REASON: reason.trim(),
        EXTENSION_GRANTED_BY: userId,
        EXTENSION_GRANTED_AT: now
      })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    if (updateError) throw updateError;

    // Auditoría
    await auditCreate(req, 't_professional_practices', {
      ACTION: 'GRANT_EXTENSION',
      PROFESSIONAL_PRACTICE_ID: practiceId,
      REASON: reason.trim()
    }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'REASON']);

    res.json({
      success: true,
      message: 'Carga extemporánea habilitada. Ya puedes registrar las evaluaciones pendientes.'
    });

  } catch (error) {
    console.error('[Evaluation] Error granting extension:', error);
    res.status(500).json({ success: false, message: 'Error al habilitar carga extemporánea' });
  }
};

/**
 * POST /api/practices/:practiceId/revoke-extension
 * Revoca la carga extemporánea de una práctica.
 * Vuelve a aplicar las validaciones de periodo estándar.
 */
export const revokeExtension = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de la revocación es requerido (mínimo 10 caracteres)'
      });
    }

    const { data: practice, error: practiceError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (practiceError || !practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const { error: updateError } = await supabase
      .from('t_professional_practices')
      .update({
        EXTENSION_GRANTED: false,
        EXTENSION_REASON: reason.trim(),
        EXTENSION_GRANTED_BY: userId,
        EXTENSION_GRANTED_AT: new Date().toISOString()
      })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    if (updateError) throw updateError;

    await auditCreate(req, 't_professional_practices', {
      ACTION: 'REVOKE_EXTENSION',
      PROFESSIONAL_PRACTICE_ID: practiceId,
      REASON: reason.trim()
    }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'REASON']);

    res.json({
      success: true,
      message: 'Carga extemporánea revocada. Las validaciones de periodo han sido restauradas.'
    });

  } catch (error) {
    console.error('[Evaluation] Error revoking extension:', error);
    res.status(500).json({ success: false, message: 'Error al revocar carga extemporánea' });
  }
};

/**
 * POST /api/evaluations/freeze
 * Congela todas las evaluaciones de las prácticas indicadas (cierre de actas).
 */
export const freezeEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceIds } = req.body;
    const supabase = dbManager.getConnection();

    if (!practiceIds || !Array.isArray(practiceIds) || practiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren IDs de práctica'
      });
    }

    // Validar que todas las prácticas existan
    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

    if (practicesError || !practices || practices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prácticas no encontradas'
      });
    }

    // Congelar evaluaciones que aún no estén congeladas
    const { data: frozenResult, error: freezeError } = await (supabase
      .from('t_evaluation')
      .update({ FROZEN_AT: new Date().toISOString() }) as any)
      .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
      .is('FROZEN_AT', null)
      .select('EVALUATION_ID, PROFESSIONAL_PRACTICE_ID');

    if (freezeError) throw freezeError;

    const frozenCount = frozenResult?.length || 0;

    if (frozenCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay evaluaciones para congelar. Todas ya están congeladas.'
      });
    }

    // Auditoría
    try {
      const practiceIdsSet = [...new Set((frozenResult || []).map((r: any) => r.PROFESSIONAL_PRACTICE_ID))];
      for (const pid of practiceIdsSet) {
        await auditCreate(req, 't_evaluation', {
          PROFESSIONAL_PRACTICE_ID: pid,
          ACTION: 'FREEZE',
          FROZEN_AT: new Date().toISOString()
        }, ['PROFESSIONAL_PRACTICE_ID', 'ACTION', 'FROZEN_AT']);
      }
    } catch (auditError) {
      console.error('[Audit] Error auditing freeze:', auditError);
    }

    res.json({
      success: true,
      message: `${frozenCount} evaluaciones congeladas`,
      data: { frozenCount }
    });

  } catch (error) {
    console.error('[Evaluation] Error freezing evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al congelar evaluaciones'
    });
  }
};

/**
 * POST /api/evaluations/:id/unfreeze
 * Descongela una evaluación para permitir corrección post-cierre.
 */
export const unfreezeEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de la corrección es requerido (mínimo 10 caracteres)'
      });
    }

    const { data: evaluation, error: evalError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID, FROZEN_AT, UNFROZEN_AT')
      .eq('EVALUATION_ID', id)
      .single();

    if (evalError || !evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    if (!(evaluation as any).FROZEN_AT) {
      return res.status(400).json({
        success: false,
        message: 'La evaluación no está congelada. No es necesario descongelarla.'
      });
    }

    if ((evaluation as any).UNFROZEN_AT) {
      return res.status(400).json({
        success: false,
        message: 'La evaluación ya fue descongelada previamente. No se permite doble descongelamiento.'
      });
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('t_evaluation')
      .update({
        UNFROZEN_AT: now,
        UNFREEZE_REASON: reason.trim(),
        UNFREEZE_AUTHORIZED_BY: userId
      })
      .eq('EVALUATION_ID', id);

    if (updateError) throw updateError;

    // Auditoría
    try {
      await auditUpdate(req, 't_evaluation',
        { FROZEN_AT: (evaluation as any).FROZEN_AT, UNFROZEN_AT: null },
        { UNFROZEN_AT: now, UNFREEZE_REASON: reason.trim(), UNFREEZE_AUTHORIZED_BY: userId },
        ['UNFROZEN_AT', 'UNFREEZE_REASON', 'UNFREEZE_AUTHORIZED_BY']
      );
    } catch (auditError) {
      console.error('[Audit] Error auditing unfreeze:', auditError);
    }

    res.json({
      success: true,
      message: 'Evaluación descongelada para corrección'
    });

  } catch (error) {
    console.error('[Evaluation] Error unfreezing evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descongelar evaluación'
    });
  }
};

/**
 * POST /api/evaluations/unfreeze-practice
 * Descongela TODAS las evaluaciones de una práctica (corrección post-cierre).
 */
export const unfreezePracticeEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId, reason } = req.body;
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    if (!practiceId || typeof practiceId !== 'number') {
      return res.status(400).json({ success: false, message: 'practiceId requerido' });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de la corrección es requerido (mínimo 10 caracteres)'
      });
    }

    const now = new Date().toISOString();

    const { data: frozenEvals, error: findError } = await supabase
      .from('t_evaluation')
      .select('EVALUATION_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .not('FROZEN_AT', 'is', null)
      .is('UNFROZEN_AT', null);

    if (findError) throw findError;

    if (!frozenEvals || frozenEvals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay evaluaciones congeladas para descongelar en esta práctica.'
      });
    }

    const evalIds = (frozenEvals as any[]).map(e => e.EVALUATION_ID);

    const { error: updateError } = await supabase
      .from('t_evaluation')
      .update({
        UNFROZEN_AT: now,
        UNFREEZE_REASON: reason.trim(),
        UNFREEZE_AUTHORIZED_BY: userId
      })
      .in('EVALUATION_ID', evalIds);

    if (updateError) throw updateError;

    // Auditoría
    try {
      await auditCreate(req, 't_evaluation', {
        ACTION: 'UNFREEZE_PRACTICE',
        PROFESSIONAL_PRACTICE_ID: practiceId,
        REASON: reason.trim()
      }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'REASON']);
    } catch (auditError) {
      console.error('[Audit] Error auditing unfreeze:', auditError);
    }

    res.json({
      success: true,
      message: `${evalIds.length} evaluación(es) descongelada(s) para corrección`
    });

  } catch (error) {
    console.error('[Evaluation] Error unfreezing practice evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descongelar evaluaciones'
    });
  }
};

async function updatePracticeGrade(practiceId: number): Promise<void> {
  const supabase = dbManager.getConnection();
  const gradeConfig = await getEvalConfig();

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
  const comiteScores: number[] = [];

  (evaluations as any[]).forEach((e: any) => {
    if (e.EVALUATOR_TYPE === 'COMITE') {
      comiteScores.push(e.TOTAL_SCORE);
    } else {
      typeScores[e.EVALUATOR_TYPE] = e.TOTAL_SCORE;
    }
  });

  // Para COMITE, el score es el promedio de los miembros existentes
  // Se considera completado si hay al menos committeeMinMembers
  const committeeMinMembers = gradeConfig.committeeMinMembers ?? 3;
  if (comiteScores.length >= committeeMinMembers) {
    typeScores['COMITE'] = parseFloat(
      (comiteScores.reduce((sum, s) => sum + s, 0) / comiteScores.length).toFixed(1)
    );
  }

  const evaluatorTypes = Object.keys(gradeConfig.weights);
  const allCompleted = evaluatorTypes.every(type => typeScores[type] !== undefined);

  if (allCompleted) {
    const finalGrade = await calculateWeightedGrade(typeScores);

    // Obtener MINIMUM_GRADE de la carrera y PRACTICES_STATUS actual
    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select('CAREER_ID, PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    let minimumGrade = 10; // default
    if (practice?.CAREER_ID) {
      const { data: career } = await supabase
        .from('t_career')
        .select('MINIMUM_GRADE')
        .eq('CAREER_ID', practice.CAREER_ID)
        .single();
      minimumGrade = career?.MINIMUM_GRADE ?? 10;
    }

    const isFailed = finalGrade < minimumGrade;

    const updateFields: Record<string, any> = {
      GRADE: finalGrade,
      EVALUATION_STATUS: 'completed',
    };

    // Auto-marcar como REPROBADO si no alcanza la nota mínima
    // Solo si la práctica está en INSCRITO o ya REPROBADO (nunca si CULMINADO o RETIRADO)
    const currentStatus = practice?.PRACTICES_STATUS;
    if (isFailed && (currentStatus === PRACTICES_STATUS.INSCRITO || currentStatus === PRACTICES_STATUS.REPROBADO)) {
      updateFields.PRACTICES_STATUS = PRACTICES_STATUS.REPROBADO;
    }

    await supabase
      .from('t_professional_practices')
      .update(updateFields)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);
  } else {
    await supabase
      .from('t_professional_practices')
      .update({ EVALUATION_STATUS: 'partial' })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);
  }
}

// ═══════════════════════════════════════════════════════════════
// COMMITTEE ASSIGNMENTS (Mejora 2: Pre-asignación formal del comité)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/committee-assignments/:practiceId
 * Retorna los miembros del comité pre-asignados para una práctica.
 */
export const getCommitteeAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { practiceId } = req.params;
    const supabase = dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_committee_assignment')
      .select('COMITE_MEMBER_INDEX, EVALUATOR_NAME, EVALUATOR_CI')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .order('COMITE_MEMBER_INDEX', { ascending: true });

    if (error) throw error;

    const assignments = (data || []).map((a: any) => ({
      memberIndex: a.COMITE_MEMBER_INDEX,
      evaluatorName: a.EVALUATOR_NAME,
      evaluatorCi: a.EVALUATOR_CI || undefined,
    }));

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('[Evaluation] Error getting committee assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asignaciones del comité'
    });
  }
};

/**
 * POST /api/committee-assignments
 * Crea o actualiza pre-asignaciones de miembros del comité.
 * Body: { practiceId, members: [{ memberIndex, evaluatorName, evaluatorCi }] }
 */
export const upsertCommitteeAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { practiceId, members } = req.body;
    const supabase = dbManager.getConnection();

    if (!practiceId || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren practiceId y members (array con al menos 1 miembro)'
      });
    }

    for (const m of members) {
      if (![1, 2, 3].includes(m.memberIndex)) {
        return res.status(400).json({
          success: false,
          message: 'memberIndex debe ser 1, 2 o 3'
        });
      }
      if (!m.evaluatorName || typeof m.evaluatorName !== 'string' || m.evaluatorName.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'evaluatorName es requerido (mínimo 3 caracteres)'
        });
      }
    }

    const now = new Date().toISOString();

    for (const m of members) {
      const { error: upsertError } = await supabase
        .from('t_committee_assignment')
        .upsert({
          PROFESSIONAL_PRACTICE_ID: practiceId,
          COMITE_MEMBER_INDEX: m.memberIndex,
          EVALUATOR_NAME: m.evaluatorName.trim(),
          EVALUATOR_CI: m.evaluatorCi?.trim() || null,
          REGISTERED_BY: userId,
          UPDATED_AT: now,
        }, {
          onConflict: 'PROFESSIONAL_PRACTICE_ID, COMITE_MEMBER_INDEX',
          ignoreDuplicates: false,
        });

      if (upsertError) throw upsertError;
    }

    // Auditoría
    try {
      await auditCreate(req, 't_committee_assignment', {
        PROFESSIONAL_PRACTICE_ID: practiceId,
        MEMBER_COUNT: members.length,
      }, ['PROFESSIONAL_PRACTICE_ID', 'MEMBER_COUNT']);
    } catch (auditError) {
      console.error('[Audit] Error auditing committee assignment:', auditError);
    }

    // Retornar los assignments actualizados
    const { data: updated } = await supabase
      .from('t_committee_assignment')
      .select('COMITE_MEMBER_INDEX, EVALUATOR_NAME, EVALUATOR_CI')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .order('COMITE_MEMBER_INDEX', { ascending: true });

    const result = (updated || []).map((a: any) => ({
      memberIndex: a.COMITE_MEMBER_INDEX,
      evaluatorName: a.EVALUATOR_NAME,
      evaluatorCi: a.EVALUATOR_CI || undefined,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Evaluation] Error upserting committee assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar asignación del comité'
    });
  }
};

/**
 * PUT /api/evaluations/system-config
 * Actualiza la configuración global del sistema de evaluación.
 * Valida que no existan evaluaciones registradas si se cambian valores que afectan puntajes.
 */
export const updateSystemConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { weights, score, committeeMinMembers, evaluationWindowDays } = req.body;
    const supabase = dbManager.getConnection();

    // 1. Detectar qué campos cambiaron respecto a la config actual
    const currentConfig = await getEvalConfig();

    const weightsChanged = weights && (
      weights.INSTITUCIONAL !== currentConfig.weights.INSTITUCIONAL ||
      weights.ACADEMICO !== currentConfig.weights.ACADEMICO ||
      weights.COMITE !== currentConfig.weights.COMITE
    );
    const scoreRangeChanged = score && (
      score.min !== undefined && score.min !== currentConfig.score.min ||
      score.max !== undefined && score.max !== currentConfig.score.max
    );
    const displayScaleChanged = score && score.displayScale !== undefined && score.displayScale !== currentConfig.score.displayScale;

    // Los cambios que afectan notas existentes requieren validación
    const affectsExistingScores = weightsChanged || scoreRangeChanged || displayScaleChanged;

    if (affectsExistingScores) {
      const { count, error: countError } = await supabase
        .from('t_evaluation')
        .select('*', { count: 'exact', head: true })
        .eq('STATUS', 1);

      if (countError) throw countError;

      if (count && count > 0) {
        const changedFields: string[] = [];
        if (weightsChanged) changedFields.push('ponderaciones');
        if (scoreRangeChanged) changedFields.push('rango de puntuación');
        if (displayScaleChanged) changedFields.push('escala de visualización');

        return res.status(409).json({
          success: false,
          message: `No se puede${changedFields.length > 1 ? 'n' : ''} modificar ${changedFields.join(' y ')} porque ya existen evaluaciones registradas. Creá un nuevo período académico si necesitas cambiar la configuración.`
        });
      }
    }

    // 2. Validar que los pesos sumen 1 (aproximadamente)
    if (weights) {
      const total = (weights.INSTITUCIONAL || 0) + (weights.ACADEMICO || 0) + (weights.COMITE || 0);
      if (Math.abs(total - 1) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Los pesos deben sumar 1 (actual: ${total.toFixed(2)})`
        });
      }
    }

    // 3. Armar el nuevo config mergeado
    const newConfig: Record<string, any> = {};

    if (weights) newConfig.weights = weights;
    if (score) {
      newConfig.score = {
        min: score.min ?? currentConfig.score.min,
        max: score.max ?? currentConfig.score.max,
        displayScale: score.displayScale ?? currentConfig.score.displayScale,
      };
    }
    if (committeeMinMembers !== undefined) newConfig.committeeMinMembers = committeeMinMembers;
    if (evaluationWindowDays !== undefined) newConfig.evaluationWindowDays = evaluationWindowDays;

    // Los campos no enviados se mantienen igual
    const mergedConfig = {
      ...currentConfig,
      ...newConfig,
      score: { ...currentConfig.score, ...(newConfig.score || {}) },
      weights: { ...currentConfig.weights, ...(newConfig.weights || {}) },
    };

    // 4. Persistir en DB
    const { error: updateError } = await supabase
      .from('t_config')
      .update({ EVALUATION_CONFIG: mergedConfig })
      .eq('CONFIG_ID', 1);

    if (updateError) throw updateError;

    // 5. Invalidar cache
    invalidateEvalConfigCache();

    res.json({
      success: true,
      message: 'Configuración de evaluación actualizada',
      data: mergedConfig
    });

  } catch (error) {
    console.error('[Evaluation] Error updating system config:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de evaluación'
    });
  }
};
