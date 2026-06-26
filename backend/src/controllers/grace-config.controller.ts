import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditUpdate } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_internships_period';
const CONFIG_TABLE = 't_academic_config';
const AUDIT_COLUMNS = ['ENROLLMENT_GRACE_DAYS', 'EVALUATION_GRACE_DAYS', 'LOCK_API_LOADED_FIELDS', 'ALLOW_MULTIPLE_VISITS_PER_DAY', 'MAX_VISITS_PER_DAY'];

// GET /api/academic-config/defaults
export const getDefaults = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await dbManager.getConnection()
      .from(CONFIG_TABLE)
      .select('DEFAULT_ENROLLMENT_GRACE_DAYS, DEFAULT_EVALUATION_GRACE_DAYS, LOCK_API_LOADED_FIELDS, allow_multiple_visits_per_day, max_visits_per_day, ALLOW_MULTIPLE_VISITS_PER_DAY, MAX_VISITS_PER_DAY')
      .eq('CONFIG_ID', 1)
      .single();

    if (error) throw error;

    res.json({
      defaultEnrollmentGraceDays: data.DEFAULT_ENROLLMENT_GRACE_DAYS,
      defaultEvaluationGraceDays: data.DEFAULT_EVALUATION_GRACE_DAYS,
      lockApiLoadedFields: data.LOCK_API_LOADED_FIELDS ?? true,
      allowMultipleVisitsPerDay: data.allow_multiple_visits_per_day !== undefined
        ? data.allow_multiple_visits_per_day
        : (data.ALLOW_MULTIPLE_VISITS_PER_DAY ?? true),
      maxVisitsPerDay: data.max_visits_per_day !== undefined
        ? data.max_visits_per_day
        : (data.MAX_VISITS_PER_DAY ?? null),
    });
  } catch (error) {
    res.json({
      defaultEnrollmentGraceDays: 21,
      defaultEvaluationGraceDays: 10,
      lockApiLoadedFields: true,
      allowMultipleVisitsPerDay: true,
      maxVisitsPerDay: null,
    });
  }
};

// PATCH /api/academic-config/defaults
export const updateDefaults = async (req: AuthRequest, res: Response) => {
  try {
    const { defaultEnrollmentGraceDays, defaultEvaluationGraceDays, lockApiLoadedFields, allowMultipleVisitsPerDay, maxVisitsPerDay } = req.body;

    if (defaultEnrollmentGraceDays !== undefined) {
      const val = Number(defaultEnrollmentGraceDays);
      if (!Number.isInteger(val) || val < 0 || val > 365) {
        return res.status(400).json({
          success: false,
          message: 'defaultEnrollmentGraceDays debe ser un entero entre 0 y 365',
          code: 'INVALID_GRACE_DAYS',
        });
      }
    }
    if (defaultEvaluationGraceDays !== undefined) {
      const val = Number(defaultEvaluationGraceDays);
      if (!Number.isInteger(val) || val < 0 || val > 365) {
        return res.status(400).json({
          success: false,
          message: 'defaultEvaluationGraceDays debe ser un entero entre 0 y 365',
          code: 'INVALID_GRACE_DAYS',
        });
      }
    }

    const { data: oldData } = await dbManager.getConnection()
      .from(CONFIG_TABLE)
      .select('*')
      .eq('CONFIG_ID', 1)
      .single();

    const updateData: Record<string, unknown> = {
      UPDATED_AT: new Date().toISOString(),
      UPDATED_BY: req.user?.userId,
    };
    if (defaultEnrollmentGraceDays !== undefined) {
      updateData.DEFAULT_ENROLLMENT_GRACE_DAYS = Number(defaultEnrollmentGraceDays);
    }
    if (defaultEvaluationGraceDays !== undefined) {
      updateData.DEFAULT_EVALUATION_GRACE_DAYS = Number(defaultEvaluationGraceDays);
    }
    if (lockApiLoadedFields !== undefined) {
      updateData.LOCK_API_LOADED_FIELDS = Boolean(lockApiLoadedFields);
    }
    if (allowMultipleVisitsPerDay !== undefined) {
      const val = Boolean(allowMultipleVisitsPerDay);
      // Sincronizar ambas columnas (lowercase nuevas + uppercase legacy)
      updateData.allow_multiple_visits_per_day = val;
      updateData.ALLOW_MULTIPLE_VISITS_PER_DAY = val;
    }
    if (maxVisitsPerDay !== undefined) {
      if (maxVisitsPerDay !== null && maxVisitsPerDay !== '' && maxVisitsPerDay !== undefined) {
        const val = Number(maxVisitsPerDay);
        if (!Number.isInteger(val) || val < 0 || val > 365) {
          return res.status(400).json({
            success: false,
            message: 'maxVisitsPerDay debe ser un entero entre 0 y 365, o null para sin límite',
            code: 'INVALID_MAX_VISITS',
          });
        }
        updateData.max_visits_per_day = val;
        updateData.MAX_VISITS_PER_DAY = val;
      } else {
        updateData.max_visits_per_day = null;
        updateData.MAX_VISITS_PER_DAY = null;
      }
    }

    const { error } = await dbManager.getConnection()
      .from(CONFIG_TABLE)
      .update(updateData)
      .eq('CONFIG_ID', 1);

    if (error) throw error;

    await auditUpdate(req, CONFIG_TABLE, oldData, updateData, AUDIT_COLUMNS);

    res.json({
      success: true,
      message: 'Defaults actualizados exitosamente',
    });
  } catch (error) {
    console.error('[GraceConfig] Error updating defaults:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar defaults',
      code: 'UPDATE_ERROR',
    });
  }
};

// PATCH /api/periodos/:id/grace-config
export const updatePeriodGraceConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { enrollmentGraceDays, evaluationGraceDays } = req.body;

    if (enrollmentGraceDays === undefined && evaluationGraceDays === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos enrollmentGraceDays o evaluationGraceDays',
        code: 'MISSING_FIELDS',
      });
    }

    if (enrollmentGraceDays !== undefined) {
      const val = Number(enrollmentGraceDays);
      if (!Number.isInteger(val) || val < 0 || val > 365) {
        return res.status(400).json({
          success: false,
          message: 'enrollmentGraceDays debe ser un entero entre 0 y 365',
          code: 'INVALID_GRACE_DAYS',
        });
      }
    }
    if (evaluationGraceDays !== undefined) {
      const val = Number(evaluationGraceDays);
      if (!Number.isInteger(val) || val < 0 || val > 365) {
        return res.status(400).json({
          success: false,
          message: 'evaluationGraceDays debe ser un entero entre 0 y 365',
          code: 'INVALID_GRACE_DAYS',
        });
      }
    }

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: oldPeriod } = await supabase
        .from(TABLE_NAME)
        .select('PERIOD_ID, ENROLLMENT_GRACE_DAYS, EVALUATION_GRACE_DAYS')
        .eq('PERIOD_ID', id)
        .single();

      if (!oldPeriod) {
        const err = new Error(`Período con ID ${id} no encontrado`) as any;
        err.code = '404';
        throw err;
      }

      const updateData: Record<string, unknown> = {};
      if (enrollmentGraceDays !== undefined) {
        updateData.ENROLLMENT_GRACE_DAYS = Number(enrollmentGraceDays);
      }
      if (evaluationGraceDays !== undefined) {
        updateData.EVALUATION_GRACE_DAYS = Number(evaluationGraceDays);
      }

      const { data: updated, error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('PERIOD_ID', id)
        .select()
        .single();

      if (error) throw error;

      await auditUpdate(req, TABLE_NAME, oldPeriod, updateData, AUDIT_COLUMNS);

      return updated;
    });

    res.json(data);
  } catch (error: any) {
    if (error.code === '404') {
      return res.status(404).json({ success: false, message: error.message, code: 'NOT_FOUND' });
    }
    console.error('[GraceConfig] Error updating period grace config:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar configuración de holgura' });
  }
};
