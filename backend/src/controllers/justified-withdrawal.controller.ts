/**
 * @file Controlador para gestión de Retiro Justificado (Phase 4).
 * @description Admin endpoints para extender o reprobar prácticas con
 * PRACTICES_STATUS = RETIRO_JUSTIFICADO. Incluye bulk operations y auditoría.
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { auditCreate, auditStatusChange } from '../utils/audit-helpers.js';
import { getPersonFullName, getPersonField } from '../utils/person-utils.js';

const TABLE_NAME = 't_professional_practices';

/**
 * GET /api/justified-withdrawal/pending
 * Retorna todas las prácticas con PRACTICES_STATUS = RETIRO_JUSTIFICADO (5)
 * que no han sido resueltas aún (sin extend ni reprobar).
 */
export const getPendingWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data: practices, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        START_DATE,
        END_DATE,
        REGISTRATION_DATE,
        PRACTICES_STATUS,
        STUDENTS_ID,
        CAREER_ID,
        INTERNSHIP_TYPE_ID,
        OBSERVATION,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_internship_type ( NAME ),
        t_internships_period ( DESCRIPTION )
      `)
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.RETIRO_JUSTIFICADO)
      .eq('STATUS', 1)
      .order('REGISTRATION_DATE', { ascending: false });

    if (error) throw error;

    const pendingList = (practices || []).map((p: any) => ({
      practiceId: p.PROFESSIONAL_PRACTICE_ID,
      studentName: getPersonFullName(p.t_persons),
      studentCi: getPersonField(p.t_persons, 'ci') || '',
      practiceType: p.t_internship_type?.NAME || '',
      period: p.t_internships_period?.DESCRIPTION || '',
      retiroDate: p.REGISTRATION_DATE || '',
      originalEndDate: p.END_DATE || '',
      startDate: p.START_DATE || '',
      observation: p.OBSERVATION || ''
    }));

    res.json({ success: true, data: pendingList });
  } catch (error) {
    console.error('[JustifiedWithdrawal] Error fetching pending:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener retiros justificados pendientes'
    });
  }
};

/**
 * POST /api/justified-withdrawal/:id/extend
 * Extiende el retiro justificado: cambia PRACTICES_STATUS de vuelta a INSCRITO
 * y actualiza la END_DATE para el nuevo semestre.
 */
export const extendWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = parseInt(id, 10);
    if (isNaN(practiceId)) {
      return res.status(400).json({ success: false, message: 'ID de práctica inválido' });
    }

    const { newEndDate, reason } = req.body;
    if (!newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar una nueva fecha de finalización (newEndDate)'
      });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de al menos 10 caracteres'
      });
    }

    const supabase = dbManager.getConnection();

    // Verificar que la práctica existe y está en RETIRO_JUSTIFICADO
    const { data: practice, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS, END_DATE')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (fetchError || !practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    if (practice.PRACTICES_STATUS !== PRACTICES_STATUS.RETIRO_JUSTIFICADO) {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede extender una práctica con estado Retiro Justificado'
      });
    }

    const oldEndDate = practice.END_DATE;

    // Actualizar: restaurar a INSCRITO y extender fecha
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({
        PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO,
        END_DATE: newEndDate,
        OBSERVATION: `Extendido: ${reason.trim()}`
      })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    if (updateError) throw updateError;

    // Auditoría
    await auditCreate(req, TABLE_NAME, {
      ACTION: 'EXTEND_WITHDRAWAL',
      PROFESSIONAL_PRACTICE_ID: practiceId,
      OLD_END_DATE: oldEndDate || '',
      NEW_END_DATE: newEndDate,
      REASON: reason.trim()
    }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'OLD_END_DATE', 'NEW_END_DATE', 'REASON'], practiceId);

    res.json({
      success: true,
      message: 'Retiro justificado extendido exitosamente. El estudiante vuelve a estado Inscrito.'
    });
  } catch (error) {
    console.error('[JustifiedWithdrawal] Error extending:', error);
    res.status(500).json({
      success: false,
      message: 'Error al extender retiro justificado'
    });
  }
};

/**
 * POST /api/justified-withdrawal/:id/reprobar
 * Marca la práctica como REPROBADO con observación de abandono.
 * La práctica permanece como registro histórico.
 */
export const reprobarWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = parseInt(id, 10);
    if (isNaN(practiceId)) {
      return res.status(400).json({ success: false, message: 'ID de práctica inválido' });
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de al menos 10 caracteres'
      });
    }

    const supabase = dbManager.getConnection();

    // Verificar que la práctica existe y está en RETIRO_JUSTIFICADO
    const { data: practice, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (fetchError || !practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    if (practice.PRACTICES_STATUS !== PRACTICES_STATUS.RETIRO_JUSTIFICADO) {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede reprobar una práctica con estado Retiro Justificado'
      });
    }

    const observation = `Reprobado por abandono (retiro justificado). Motivo: ${reason.trim()}`;

    // Actualizar: set REPROBADO con observación
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({
        PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO,
        OBSERVATION: observation
      })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    if (updateError) throw updateError;

    // Auditoría
    await auditStatusChange(
      req, TABLE_NAME, practiceId,
      PRACTICES_STATUS.RETIRO_JUSTIFICADO, PRACTICES_STATUS.REPROBADO
    );

    await auditCreate(req, TABLE_NAME, {
      ACTION: 'REPROBAR_WITHDRAWAL',
      PROFESSIONAL_PRACTICE_ID: practiceId,
      REASON: reason.trim()
    }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'REASON'], practiceId);

    res.json({
      success: true,
      message: 'Práctica marcada como Reprobado por abandono. El registro histórico se conserva.'
    });
  } catch (error) {
    console.error('[JustifiedWithdrawal] Error reprobando:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reprobar retiro justificado'
    });
  }
};

/**
 * POST /api/justified-withdrawal/batch
 * Acción en lote: recibe array de IDs + acción ('extend' | 'reprobar').
 * Procesa cada práctica individualmente acumulando éxitos y errores.
 */
export const batchWithdrawalAction = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, action, newEndDate, reason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de prácticas'
      });
    }

    if (!action || !['extend', 'reprobar'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'La acción debe ser "extend" o "reprobar"'
      });
    }

    if (action === 'extend' && !newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Para extender, debe proporcionar newEndDate'
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de al menos 10 caracteres'
      });
    }

    const supabase = dbManager.getConnection();
    const details: Array<{ practiceId: number; success: boolean; error?: string }> = [];

    for (const pid of ids) {
      const practiceId = Number(pid);
      if (isNaN(practiceId)) {
        details.push({ practiceId, success: false, error: 'ID inválido' });
        continue;
      }

      try {
        // Verificar que existe y está en RETIRO_JUSTIFICADO
        const { data: practice, error: fetchError } = await supabase
          .from(TABLE_NAME)
          .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS, END_DATE')
          .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
          .single();

        if (fetchError || !practice) {
          details.push({ practiceId, success: false, error: 'Práctica no encontrada' });
          continue;
        }

        if (practice.PRACTICES_STATUS !== PRACTICES_STATUS.RETIRO_JUSTIFICADO) {
          details.push({ practiceId, success: false, error: 'La práctica no está en estado Retiro Justificado' });
          continue;
        }

        if (action === 'extend') {
          const oldEndDate = practice.END_DATE;

          const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update({
              PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO,
              END_DATE: newEndDate,
              OBSERVATION: `Extendido (batch): ${reason.trim()}`
            })
            .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

          if (updateError) throw updateError;

          await auditCreate(req, TABLE_NAME, {
            ACTION: 'BATCH_EXTEND_WITHDRAWAL',
            PROFESSIONAL_PRACTICE_ID: practiceId,
            OLD_END_DATE: oldEndDate || '',
            NEW_END_DATE: newEndDate,
            REASON: reason.trim()
          }, ['ACTION', 'PROFESSIONAL_PRACTICE_ID', 'OLD_END_DATE', 'NEW_END_DATE', 'REASON'], practiceId);

          details.push({ practiceId, success: true });
        } else {
          // reprobar
          const observation = `Reprobado por abandono (retiro justificado). Motivo: ${reason.trim()}`;

          const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update({
              PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO,
              OBSERVATION: observation
            })
            .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

          if (updateError) throw updateError;

          await auditStatusChange(
            req, TABLE_NAME, practiceId,
            PRACTICES_STATUS.RETIRO_JUSTIFICADO, PRACTICES_STATUS.REPROBADO
          ).catch(() => {});

          details.push({ practiceId, success: true });
        }
      } catch (itemError) {
        details.push({
          practiceId,
          success: false,
          error: itemError instanceof Error ? itemError.message : 'Error desconocido'
        });
      }
    }

    const successes = details.filter(d => d.success).length;
    const failures = details.filter(d => !d.success).length;

    res.json({
      success: failures === 0,
      data: {
        total: ids.length,
        successes,
        failures,
        details
      },
      message: `Procesados ${ids.length} prácticas: ${successes} exitosas, ${failures} fallos`
    });
  } catch (error) {
    console.error('[JustifiedWithdrawal] Error in batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar acción en lote'
    });
  }
};
