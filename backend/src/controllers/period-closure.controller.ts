/**
 * @file Controller for period closure with individual practice decisions.
 * @description Provides a preview endpoint (pending practices) and a close-with-decisions
 * endpoint that lets the admin decide what to do with each pending practice before closing.
 */

import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { PRACTICES_STATUS, PRACTICES_STATUS_LABELS } from '../constants/practice-status.constants.js';
import { PERIOD_STATUS } from '../constants/practice-status.constants.js';
import { auditCreate, auditStatusChange } from '../utils/audit-helpers.js';
import { backupService } from '../services/backup.service.js';
import { cacheManager } from '../lib/cache-manager.js';

interface AppError extends Error {
  code?: string;
  details?: string;
}

// --- Types ---

export interface PendingPractice {
  practiceId: number;
  studentName: string;
  studentCi: string;
  careerName: string;
  status: number;
  statusLabel: string;
  pendingIssue: string;
  hasEvaluations: boolean;
  evaluationCount: number;
}

export type ClosureDecision = 'extend' | 'enroll' | 'retiro_justificado' | 'abandono';

export interface PracticeDecision {
  practiceId: number;
  decision: ClosureDecision;
}

// --- Validation ---

const VALID_DECISIONS: ClosureDecision[] = ['extend', 'enroll', 'retiro_justificado', 'abandono'];

function validateDecisions(decisions: unknown): decisions is PracticeDecision[] {
  if (!Array.isArray(decisions)) return false;
  return decisions.every(
    (d) =>
      typeof d === 'object' &&
      d !== null &&
      'practiceId' in d &&
      'decision' in d &&
      typeof (d as PracticeDecision).practiceId === 'number' &&
      VALID_DECISIONS.includes((d as PracticeDecision).decision)
  );
}

// --- Helpers ---

function handleDbError(res: Response, error: unknown) {
  console.error('[PeriodClosure] Database Error:', error);
  const dbError = error as AppError;
  const statusCode = dbError.code === '404' ? 404 : dbError.code === '409' ? 409 : 500;
  const userMessage =
    dbError.code === '404'
      ? dbError.message || 'Registro no encontrado'
      : dbError.code === '409'
      ? dbError.message || 'Conflicto de estado'
      : 'Error en la base de datos';

  res.status(statusCode).json({
    message: userMessage,
    error: dbError.message || 'Unknown database error',
    code: dbError.code,
  });
}

// --- GET /api/periods/:id/pending-practices ---

/**
 * Returns practices in a period that need admin decisions before closing.
 * Practices qualify if they are PRE_INSCRITO or INSCRITO without complete evaluations.
 * This is a READ-ONLY endpoint — no mutations.
 */
export const getPendingPractices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    // Validate period exists and is EN_CURSO
    const { data: period, error: periodError } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, PERIOD_STATUS')
      .eq('PERIOD_ID', id)
      .single();

    if (periodError || !period) {
      return res.status(404).json({ message: `No se encontró el período con PERIOD_ID: ${id}` });
    }

    if (period.PERIOD_STATUS !== PERIOD_STATUS.EN_CURSO) {
      return res.status(409).json({ message: 'Solo se pueden revisar prácticas pendientes de períodos en curso' });
    }

    // Fetch all active practices in this period
    const { data: practices, error: practicesError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS, student_person_id, CAREER_ID')
      .eq('PERIOD_ID', id)
      .eq('STATUS', 1);

    if (practicesError) throw practicesError;

    if (!practices || practices.length === 0) {
      return res.json({ pendingPractices: [], totalPractices: 0 });
    }

    // Filter to only PRE_INSCRITO and INSCRITO
    const pendingPracticesRaw = practices.filter(
      (p: any) => p.PRACTICES_STATUS === PRACTICES_STATUS.PRE_INSCRITO || p.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO
    );

    if (pendingPracticesRaw.length === 0) {
      return res.json({ pendingPractices: [], totalPractices: practices.length });
    }

    // Enrich with student names, CIs, career names, and evaluation counts
    const pendingPractices: PendingPractice[] = [];

    for (const p of pendingPracticesRaw) {
      // Fetch student name and CI
      let studentName = 'Desconocido';
      let studentCi = '';
      try {
        const { data: person } = await supabase
          .from('t_person')
          .select('FIRST_NAME, MIDDLE_NAME, LAST_NAME, SECOND_LAST_NAME, ID_CARD')
          .eq('PERSON_ID', p.student_person_id)
          .single();
        if (person) {
          const parts = [person.FIRST_NAME, person.MIDDLE_NAME, person.LAST_NAME, person.SECOND_LAST_NAME].filter(Boolean);
          studentName = parts.join(' ');
          studentCi = person.ID_CARD || '';
        }
      } catch {
        // Person not found — keep defaults
      }

      // Fetch career name
      let careerName = '';
      try {
        const { data: career } = await supabase
          .from('t_career')
          .select('DESCRIPTION')
          .eq('CAREER_ID', p.CAREER_ID)
          .single();
        if (career) careerName = career.DESCRIPTION;
      } catch {
        // Career not found
      }

      // Count evaluations
      let evaluationCount = 0;
      if (p.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO) {
        try {
          const { count } = await supabase
            .from('t_evaluation')
            .select('*', { count: 'exact', head: true })
            .eq('PROFESSIONAL_PRACTICE_ID', p.PROFESSIONAL_PRACTICE_ID);
          evaluationCount = count || 0;
        } catch {
          // Evaluation count failed — treat as 0
        }
      }

      // Determine pending issue
      let pendingIssue = '';
      if (p.PRACTICES_STATUS === PRACTICES_STATUS.PRE_INSCRITO) {
        pendingIssue = 'Pre-inscrito — nunca fue inscrito';
      } else if (p.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO && evaluationCount === 0) {
        pendingIssue = 'Inscrito sin evaluaciones completas';
      } else {
        // INSCRITO but has some evaluations — still flag if not complete
        // (The admin sees it and can decide)
        pendingIssue = 'Inscrito — evaluaciones incompletas';
      }

      pendingPractices.push({
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentName,
        studentCi,
        careerName,
        status: p.PRACTICES_STATUS,
        statusLabel: PRACTICES_STATUS_LABELS[p.PRACTICES_STATUS] || 'Desconocido',
        pendingIssue,
        hasEvaluations: evaluationCount > 0,
        evaluationCount,
      });
    }

    res.json({
      pendingPractices,
      totalPractices: practices.length,
    });
  } catch (error) {
    handleDbError(res, error);
  }
};

// --- POST /api/periods/:id/close (with decisions) ---

/**
 * Closes a period after applying admin decisions to pending practices.
 *
 * If `decisions` is provided in the body, each decision is applied before closing:
 * - `extend`: adds grace days to the period (uses the period's own EVALUATION_GRACE_DAYS)
 * - `enroll`: converts PRE_INSCRITO → INSCRITO
 * - `retiro_justificado`: sets PRACTICES_STATUS = 5
 * - `abandono`: sets PRACTICES_STATUS = 4 (REPROBADO)
 *
 * If `decisions` is NOT provided, behaves identically to the original closePeriod.
 */
export const closePeriodWithDecisions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decisions } = req.body;
    const userId = String(req.user?.userId || '');
    const supabase = dbManager.getConnection();

    // Validate period
    const { data: period } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, DESCRIPTION, PERIOD_STATUS, EVALUATION_GRACE_DAYS, START_DATE, END_DATE')
      .eq('PERIOD_ID', id)
      .single();

    if (!period) {
      return res.status(404).json({ message: `No se encontró el período con PERIOD_ID: ${id}` });
    }

    if (period.PERIOD_STATUS !== PERIOD_STATUS.EN_CURSO) {
      return res.status(409).json({ message: 'Solo se puede cerrar un período en curso' });
    }

    // Validate decisions if provided
    if (decisions !== undefined && !validateDecisions(decisions)) {
      return res.status(400).json({
        message: 'Formato de decisiones inválido. Cada decisión debe tener practiceId (number) y decision (extend|enroll|retiro_justificado|abandono).',
      });
    }

    // Backup pre-cierre (non-blocking)
    let backupId: string | null = null;
    const warnings: string[] = [];
    try {
      const backupName = `Backup pre-cierre ${period.DESCRIPTION || `período ${id}`}`;
      const backup = await backupService.createBackup(userId, backupName, `Cierre con decisiones del período ${id}`, 'json');
      backupId = backup.id;
    } catch (backupError) {
      const msg = backupError instanceof Error ? backupError.message : 'Error desconocido';
      console.error('[PeriodClosure] Error en backup pre-cierre:', msg);
      warnings.push(`Backup pre-cierre falló: ${msg}`);
    }

    const result = await dbManager.withRetry(async (supabase) => {
      // Apply decisions if provided
      let decisionsApplied = 0;
      const extendedPracticeIds: number[] = [];
      const enrolledPracticeIds: number[] = [];
      const retiredPracticeIds: number[] = [];
      const abandonedPracticeIds: number[] = [];

      if (decisions && Array.isArray(decisions) && decisions.length > 0) {
        for (const { practiceId, decision } of decisions) {
          try {
            switch (decision) {
              case 'extend': {
                // Extend the period's evaluation grace days
                // Read current grace days
                const { data: periodData } = await supabase
                  .from('t_internships_period')
                  .select('EVALUATION_GRACE_DAYS')
                  .eq('PERIOD_ID', id)
                  .single();

                const currentGraceDays = periodData?.EVALUATION_GRACE_DAYS ?? 10;
                const additionalDays = 7; // Standard extension block

                const { error } = await supabase
                  .from('t_internships_period')
                  .update({ EVALUATION_GRACE_DAYS: currentGraceDays + additionalDays })
                  .eq('PERIOD_ID', id);

                if (error) throw error;
                extendedPracticeIds.push(practiceId);
                break;
              }

              case 'enroll': {
                // Convert PRE_INSCRITO → INSCRITO
                const { error } = await supabase
                  .from('t_professional_practices')
                  .update({ PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO })
                  .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
                  .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO);

                if (error) throw error;
                enrolledPracticeIds.push(practiceId);
                break;
              }

              case 'retiro_justificado': {
                const { error } = await supabase
                  .from('t_professional_practices')
                  .update({ PRACTICES_STATUS: PRACTICES_STATUS.RETIRO_JUSTIFICADO })
                  .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

                if (error) throw error;
                retiredPracticeIds.push(practiceId);
                break;
              }

              case 'abandono': {
                const { error } = await supabase
                  .from('t_professional_practices')
                  .update({ PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO })
                  .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

                if (error) throw error;
                abandonedPracticeIds.push(practiceId);
                break;
              }
            }
            decisionsApplied++;
          } catch (decisionError) {
            console.error(`[PeriodClosure] Error applying decision for practice ${practiceId}:`, decisionError);
            warnings.push(`Error aplicando decisión para práctica ${practiceId}: ${decisionError instanceof Error ? decisionError.message : 'Error desconocido'}`);
          }
        }
      }

      // Get all practice IDs for freeze operations
      const { data: practices } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
        .eq('PERIOD_ID', id);

      const practiceIds = (practices || []).map((p: any) => p.PROFESSIONAL_PRACTICE_ID);
      const totalPractices = practiceIds.length;

      // Freeze evaluations
      const { data: frozenData, error: freezeError } = await supabase
        .from('t_evaluation')
        .update({ FROZEN_AT: new Date().toISOString() })
        .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
        .is('FROZEN_AT', null)
        .select('EVALUATION_ID');

      if (freezeError) throw freezeError;
      const frozenEvaluations = frozenData?.length || 0;

      // Audit freeze
      if (frozenEvaluations > 0) {
        try {
          for (const practiceId of practiceIds) {
            await auditCreate(req, 't_evaluation', {
              PROFESSIONAL_PRACTICE_ID: practiceId,
              ACTION: 'FREEZE',
              FROZEN_AT: new Date().toISOString(),
            }, ['PROFESSIONAL_PRACTICE_ID', 'ACTION', 'FROZEN_AT']);
          }
        } catch (auditError) {
          console.error('[Audit] Error auditing batch freeze:', auditError);
        }
      }

      // Close period
      const { error: closeError } = await supabase
        .from('t_internships_period')
        .update({ PERIOD_STATUS: PERIOD_STATUS.CULMINADO })
        .eq('PERIOD_ID', id);

      if (closeError) throw closeError;

      // Audit period close
      try {
        await auditStatusChange(req, 't_internships_period', String(id), Number(PERIOD_STATUS.EN_CURSO), Number(PERIOD_STATUS.CULMINADO));
      } catch (auditError) {
        console.error('[Audit] Error auditing period close:', auditError);
      }

      // Invalidate caches
      cacheManager.deleteByPrefix('enrollments:');

      return {
        totalPractices,
        frozenEvaluations,
        decisionsApplied,
        extendedPracticeIds,
        enrolledPracticeIds,
        retiredPracticeIds,
        abandonedPracticeIds,
      };
    });

    res.json({
      success: true,
      message: 'Período cerrado exitosamente',
      data: {
        periodId: Number(id as string),
        totalPractices: result.totalPractices,
        frozenEvaluations: result.frozenEvaluations,
        decisionsApplied: result.decisionsApplied,
        backupId,
        warnings,
        summary: {
          extended: result.extendedPracticeIds.length,
          enrolled: result.enrolledPracticeIds.length,
          retired: result.retiredPracticeIds.length,
          abandoned: result.abandonedPracticeIds.length,
        },
      },
    });
  } catch (error) {
    handleDbError(res, error);
  }
};
