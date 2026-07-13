/**
 * @file Controller for pre-enrollment timeout management.
 * @description D-03: Auto-cancel PRE_INSCRITO practices older than X days.
 */

import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { checkPreEnrollmentTimeouts, previewTimeoutPractices } from '../utils/pre-enrollment-timeout.js';
import { auditCreate } from '../utils/audit-helpers.js';

/**
 * GET /api/periods/timeout-preview
 * Preview which PRE_INSCRITO practices would be auto-cancelled (read-only).
 */
export const getTimeoutPreview = async (req: AuthRequest, res: Response) => {
  try {
    const timeoutDays = Number(req.query.timeoutDays) || 30;
    const supabase = dbManager.getConnection();
    const result = await previewTimeoutPractices(supabase, timeoutDays);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[PeriodTimeout] Error in timeout preview:', error);
    res.status(500).json({ message: 'Error al obtener vista previa de timeouts' });
  }
};

/**
 * POST /api/periods/check-timeouts
 * Execute timeout check: cancel stale PRE_INSCRITO practices.
 */
export const executeTimeoutCheck = async (req: AuthRequest, res: Response) => {
  try {
    const timeoutDays = Number(req.body?.timeoutDays) || 30;
    const supabase = dbManager.getConnection();
    const result = await checkPreEnrollmentTimeouts(supabase, timeoutDays);

    // Audit each cancellation
    if (result.cancelled > 0) {
      for (const practice of result.practices) {
        try {
          await auditCreate(req, 't_professional_practices', {
            PROFESSIONAL_PRACTICE_ID: practice.practiceId,
            ACTION: 'TIMEOUT_CANCEL',
            PREVIOUS_STATUS: 1, // PRE_INSCRITO
            NEW_STATUS: 0, // RETIRADO
            TIMEOUT_DAYS: timeoutDays,
            CANCELLED_AT: new Date().toISOString(),
          }, ['PROFESSIONAL_PRACTICE_ID', 'ACTION', 'NEW_STATUS']);
        } catch (auditError) {
          console.error('[PeriodTimeout] Error auditing timeout cancel:', auditError);
        }
      }
    }

    res.json({
      success: true,
      message: result.cancelled > 0
        ? `${result.cancelled} pre-inscripción(es) auto-cancelada(s) por timeout`
        : 'No hay pre-inscripciones pendientes por timeout',
      data: result,
    });
  } catch (error) {
    console.error('[PeriodTimeout] Error executing timeout check:', error);
    res.status(500).json({ message: 'Error al ejecutar verificación de timeout' });
  }
};
