import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sanitizeText } from '../utils/text-utils.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';
import { periodNotificationService } from '../services/period-notification.service.js';
import { cacheManager } from '../lib/cache-manager.js';
import { PERIOD_STATUS, PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { isFeatureEnabled, getTypeDatesByPeriod } from '../services/period-type-dates.service.js';
import { backupService } from '../services/backup.service.js';

const TABLE_NAME = 't_internships_period';

const PERIOD_COLUMNS_TO_AUDIT = [
  'DESCRIPTION', 'START_DATE', 'END_DATE', 'PERIOD_STATUS', 'STATUS', 'T_INTERNSHIPS_CODE', 'ENROLLMENT_GRACE_DAYS', 'EVALUATION_GRACE_DAYS'
];

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as AppError;
  
  let userMessage = 'Error en la base de datos';
  let statusCode = 500;
  
  if (dbError.code === '400') {
    // Validation errors - return the specific message
    statusCode = 400;
    userMessage = dbError.message || 'Error de validación';
    return res.status(statusCode).json({ message: userMessage });
  } else if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '404') {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  } else if (dbError.code === '403') {
    userMessage = dbError.message || 'Acción no permitida';
    return res.status(403).json({ message: userMessage });
  }

  res.status(statusCode).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

interface Period {
  PERIOD_ID: number;
  DESCRIPTION: string;
  START_DATE: string;
  END_DATE: string;
  PERIOD_STATUS: string;
  STATUS: number;
  CREATION_DATE: string;
  T_INTERNSHIPS_CODE: string;
  ENROLLMENT_GRACE_DAYS: number;
  EVALUATION_GRACE_DAYS: number;
}

export const getPeriods = async (req: Request, res: Response) => {
  try {
    const forReports = req.query.forReports === 'true';

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Obtener todos los periodos (activos)
      let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .order('START_DATE', { ascending: false });

      // Si forReports=true: solo CULMINADO (3) + EN_CURSO (2) + el PENDIENTE (1) más cercano
      if (forReports) {
        // Obtener períodos CULMINADO y EN_CURSO
        const { data: activePeriods, error: activeError } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .in('PERIOD_STATUS', [PERIOD_STATUS.CULMINADO, PERIOD_STATUS.EN_CURSO])
          .order('START_DATE', { ascending: false });

        if (activeError) throw activeError;

        // Obtener el período PENDIENTE más cercano (próximo a iniciar)
        const { data: pendingPeriods, error: pendingError } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('PERIOD_STATUS', PERIOD_STATUS.PENDIENTE)
          .gte('START_DATE', new Date().toISOString().split('T')[0])
          .order('START_DATE', { ascending: true })
          .limit(1);

        if (pendingError) throw pendingError;

        // Combinar resultados
        const combined = [...(activePeriods || []), ...(pendingPeriods || [])];
        // Ordenar por START_DATE descendente como getPeriods normal
        combined.sort((a, b) => new Date(b.START_DATE).getTime() - new Date(a.START_DATE).getTime());

        const periods = combined;

        // 2. Obtener IDs de periodos en uso en t_professional_practices
        const { data: usedPeriods, error: usedError } = await supabase
          .from('t_professional_practices')
          .select('PERIOD_ID');

        if (usedError) throw usedError;

        const usedPeriodIds = new Set(usedPeriods.map(p => p.PERIOD_ID));

        // 3. Enriquecer
        return (periods as Period[]).map(p => {
          const startDate = new Date(p.START_DATE);
          const endDate = new Date(p.END_DATE);
          const enrollmentDays = p.ENROLLMENT_GRACE_DAYS ?? 21;
          const evaluationDays = p.EVALUATION_GRACE_DAYS ?? 10;

          const graceEndDate = new Date(startDate);
          graceEndDate.setDate(graceEndDate.getDate() + enrollmentDays);

          const evaluationGraceEndDate = new Date(endDate);
          evaluationGraceEndDate.setDate(evaluationGraceEndDate.getDate() + evaluationDays);

          return {
            ...p,
            graceEndDate: graceEndDate.toISOString(),
            evaluationGraceEndDate: evaluationGraceEndDate.toISOString(),
            isInUse: usedPeriodIds.has(p.PERIOD_ID),
          };
        });
      }

      // Normal flow (no forReports)
      const { data: periods, error: periodsError } = await query;

      if (periodsError) throw periodsError;

      // 2. Obtener IDs de periodos en uso en t_professional_practices
      const { data: usedPeriods, error: usedError } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID');

      if (usedError) throw usedError;

      const usedPeriodIds = new Set(usedPeriods.map(p => p.PERIOD_ID));

      // 3. Marcar periodos como en uso y calcular fechas de holgura
      const enrichedPeriods = (periods as Period[]).map(p => {
        const startDate = new Date(p.START_DATE);
        const endDate = new Date(p.END_DATE);
        const enrollmentDays = p.ENROLLMENT_GRACE_DAYS ?? 21;
        const evaluationDays = p.EVALUATION_GRACE_DAYS ?? 10;

        const graceEndDate = new Date(startDate);
        graceEndDate.setDate(graceEndDate.getDate() + enrollmentDays);

        const evaluationGraceEndDate = new Date(endDate);
        evaluationGraceEndDate.setDate(evaluationGraceEndDate.getDate() + evaluationDays);

        return {
          ...p,
          graceEndDate: graceEndDate.toISOString(),
          evaluationGraceEndDate: evaluationGraceEndDate.toISOString(),
          isInUse: usedPeriodIds.has(p.PERIOD_ID),
        };
      });

      return enrichedPeriods;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getNextPendingPeriod = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_STATUS', PERIOD_STATUS.PENDIENTE)
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const p = data as Period;
      const startDate = new Date(p.START_DATE);
      const endDate = new Date(p.END_DATE);
      const enrollmentDays = p.ENROLLMENT_GRACE_DAYS ?? 21;
      const evaluationDays = p.EVALUATION_GRACE_DAYS ?? 10;

      const graceEndDate = new Date(startDate);
      graceEndDate.setDate(graceEndDate.getDate() + enrollmentDays);

      const evaluationGraceEndDate = new Date(endDate);
      evaluationGraceEndDate.setDate(evaluationGraceEndDate.getDate() + evaluationDays);

      return {
        ...p,
        graceEndDate: graceEndDate.toISOString(),
        evaluationGraceEndDate: evaluationGraceEndDate.toISOString(),
      };
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getPeriodById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_ID', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // PostgREST error code for no rows found
          const notFoundError = new Error(`No se encontró el período con PERIOD_ID: ${id}`) as AppError;
          notFoundError.code = '404';
          throw notFoundError;
        }
        throw error;
      }
      return data as Period;
    });

    // Include typeDates when feature flag is on (task 2.3)
    if (isFeatureEnabled()) {
      const typeDates = await getTypeDatesByPeriod(parseInt(id, 10));
      res.json({ ...data, typeDates });
    } else {
      res.json(data);
    }
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { description, startDate, endDate, periodStatus, status, code, enrollmentGraceDays, evaluationGraceDays } = req.body;
    const now = new Date().toISOString();
    
    const formatToDate = (val: string | number) => {
      if (typeof val === 'number') {
        const date = new Date(val * 1000);
        return date.toISOString().split('T')[0];
      }
      return val;
    };

    // Read global defaults for grace days (non-blocking fallback)
    let defaultEnrollmentDays = 21;
    let defaultEvaluationDays = 10;
    try {
      const { data: defaults } = await dbManager.getConnection()
        .from('t_academic_config')
        .select('DEFAULT_ENROLLMENT_GRACE_DAYS, DEFAULT_EVALUATION_GRACE_DAYS')
        .eq('CONFIG_ID', 1)
        .single();
      if (defaults) {
        defaultEnrollmentDays = defaults.DEFAULT_ENROLLMENT_GRACE_DAYS;
        defaultEvaluationDays = defaults.DEFAULT_EVALUATION_GRACE_DAYS;
      }
    } catch (e) {
      console.warn('[PeriodsController] Could not read grace defaults, using hardcoded:', e);
    }

    const dbData = {
      DESCRIPTION: sanitizeText(description) ?? '',
      START_DATE: formatToDate(startDate),
      END_DATE: formatToDate(endDate),
      PERIOD_STATUS: String(periodStatus || PERIOD_STATUS.PENDIENTE),
      STATUS: status === false ? 0 : 1,
      CREATION_DATE: now,
      T_INTERNSHIPS_CODE: code || `P${Date.now().toString().slice(-7)}`,
      ENROLLMENT_GRACE_DAYS: enrollmentGraceDays ?? defaultEnrollmentDays,
      EVALUATION_GRACE_DAYS: evaluationGraceDays ?? defaultEvaluationDays,
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select();

      if (error) throw error;
      return (data as unknown) as Period[];
    });

    await auditCreate(req, 't_internships_period', dbData, PERIOD_COLUMNS_TO_AUDIT);

    // Notificar a todos los usuarios sobre el nuevo período
    console.log('[PeriodsController] Enviando notificación de período creado...');
    try {
      const notifResult = await periodNotificationService.notifyPeriodCreated({
        description: data[0].DESCRIPTION,
        startDate: data[0].START_DATE,
        endDate: data[0].END_DATE,
        periodStatus: data[0].PERIOD_STATUS,
      });
      console.log('[PeriodsController] Resultado notificación:', notifResult);
    } catch (notifError) {
      console.error('[PeriodsController] Error en notificación:', notifError);
    }

    res.status(201).json(data[0]);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updatePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { description, startDate, endDate, periodStatus, status, code, enrollmentGraceDays, evaluationGraceDays } = req.body;
    
    const formatToDate = (val: string | number) => {
      if (typeof val === 'number') {
        const date = new Date(val * 1000);
        return date.toISOString().split('T')[0];
      }
      return val;
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_ID', id)
        .single();

      if (!oldData) {
        const notFoundError = new Error(`No se encontró el período con PERIOD_ID: ${id}`) as AppError;
        notFoundError.code = '404';
        throw notFoundError;
      }

      // Verificar si el período está en uso
      const { data: usageData } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID')
        .eq('PERIOD_ID', id)
        .limit(1);

      const isInUse = usageData && usageData.length > 0;

      // Si está en uso y se está cambiando SOLO periodStatus (activar=2 o culminar=3), permitir
      // No validar campos forbidden porque el cambio de estado es válido
      if (isInUse) {
        const newPeriodStatus = req.body.periodStatus;
        const currentStatus = oldData.STATUS;
        
        // Solo permitir si: viene periodStatus Y el status enviado es igual al actual (no se está cambiando status)
        const isOnlyChangingPeriodStatus = newPeriodStatus !== undefined && 
          (req.body.status === undefined || req.body.status === currentStatus || req.body.status === (currentStatus === 1 ? true : false));
        
        if (isOnlyChangingPeriodStatus) {
          // periodStatus 2 = activar, 3 = culminar - ambos son válidos
          // Permitir cambio de periodStatus sin validar otros campos
        } else {
          // Para otros casos (cambio de status/borrado o cambio de description/startDate/code)
          // validar que no hayan cambiado campos forbidden
          const forbiddenFields = ['description', 'startDate', 'code'];
          
          const normalizeForCompare = (field: string, newVal: unknown, oldVal: unknown): boolean => {
            if (newVal === undefined || newVal === null) return false;
            
            let normalizedNew = String(newVal);
            let normalizedOld = String(oldVal);
            
            if (field === 'startDate' || field === 'endDate') {
              if (!isNaN(Number(newVal)) && Number(newVal) > 1e9) {
                if (oldVal && typeof oldVal === 'string' && oldVal.includes('-')) {
                  const oldDate = new Date(oldVal);
                  if (!isNaN(oldDate.getTime())) {
                    normalizedOld = String(Math.floor(oldDate.getTime() / 1000));
                  }
                }
              }
            }
            
            return normalizedNew !== normalizedOld;
          };
          
          const hasForbiddenChange = forbiddenFields.some(field => {
            const value = req.body[field];
            if (value === undefined || value === null) return false;
            
            const columnMap: Record<string, string> = {
              description: 'DESCRIPTION',
              startDate: 'START_DATE',
              code: 'T_INTERNSHIPS_CODE'
            };
            const column = columnMap[field];
            const oldValue = oldData[column];
            
            return normalizeForCompare(field, value, oldValue);
          });

          if (hasForbiddenChange) {
            const usageError = new Error('No se puede modificar este campo porque el período tiene registros asociados') as AppError;
            usageError.code = '403';
            throw usageError;
          }
        }
      }

      const updatePayload: Record<string, unknown> = {};
      if (description !== undefined) updatePayload.DESCRIPTION = sanitizeText(description) ?? '';
      if (startDate !== undefined) updatePayload.START_DATE = formatToDate(startDate);
      if (endDate !== undefined) updatePayload.END_DATE = formatToDate(endDate);
      if (periodStatus !== undefined) {
        // VALIDACIÓN CRONOLÓGICA: Solo se puede activar el período pendiente MÁS ANTIGUO
        // Solo validar si REALMENTE está cambiando a "En Curso" (no si ya lo está)
        const isChangingToActive = String(periodStatus) === '2' && String(oldData.PERIOD_STATUS) !== '2';
        if (isChangingToActive) { // Intentando activar a "En Curso"
          const currentPeriodId = parseInt(id, 10);

          // Obtener todos los períodos pendientes (PERIOD_STATUS = 1) ordenados por fecha
          const { data: pendingPeriods, error: pendingError } = await supabase
            .from(TABLE_NAME)
            .select('PERIOD_ID, DESCRIPTION, START_DATE, END_DATE, PERIOD_STATUS')
            .eq('STATUS', 1)
            .eq('PERIOD_STATUS', PERIOD_STATUS.PENDIENTE)
            .order('START_DATE', { ascending: true });

          if (pendingError) throw pendingError;

          if (pendingPeriods && pendingPeriods.length > 0) {
            const oldestPending = pendingPeriods[0];

            if (oldestPending.PERIOD_ID !== currentPeriodId) {
              const errorMsg = `No se puede activar el período "${oldData?.DESCRIPTION}" porque primero debes activar el período "${oldestPending.DESCRIPTION}" (inicio: ${new Date(oldestPending.START_DATE).toLocaleDateString('es-VE')}).`;
              const validationError = new Error(errorMsg) as AppError;
              validationError.code = '400';
              throw validationError;
            }
          }
        }
        updatePayload.PERIOD_STATUS = String(periodStatus);
      }
      if (status !== undefined) updatePayload.STATUS = status === false ? 0 : 1;
      if (code !== undefined) updatePayload.T_INTERNSHIPS_CODE = code;
      if (enrollmentGraceDays !== undefined) updatePayload.ENROLLMENT_GRACE_DAYS = Number(enrollmentGraceDays);
      if (evaluationGraceDays !== undefined) updatePayload.EVALUATION_GRACE_DAYS = Number(evaluationGraceDays);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq('PERIOD_ID', id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        const notFoundError = new Error(`No se encontró el período con PERIOD_ID: ${id}`) as AppError;
        notFoundError.code = '404';
        throw notFoundError;
      }

      if (oldData) {
        await auditUpdate(req, 't_internships_period', oldData as Record<string, any>, updatePayload, PERIOD_COLUMNS_TO_AUDIT);
        
        // Detectar cambio de estado del período
        const oldStatus = oldData.PERIOD_STATUS;
        const newStatus = updatePayload.PERIOD_STATUS ? String(updatePayload.PERIOD_STATUS) : oldStatus;
        
        // Notificar si el período cambió a "En Curso"
        // Las notificaciones NO deben fallar el request principal
        if (oldStatus !== PERIOD_STATUS.EN_CURSO && newStatus === PERIOD_STATUS.EN_CURSO) {
          try {
            await periodNotificationService.notifyPeriodStarted({
              description: data[0].DESCRIPTION,
              startDate: data[0].START_DATE,
              endDate: data[0].END_DATE,
            });
          } catch (notifError) {
            console.error('[PeriodsController] Error en notificación (no crítico):', notifError);
          }

          // Notificar apertura del período de evaluación
          try {
            await periodNotificationService.notifyEvaluationOpened(data[0].PERIOD_ID);
          } catch (notifError) {
            console.error('[PeriodsController] Error en notificación de evaluación (no crítico):', notifError);
          }
        }
        
        // Notificar si el período cambió a "Finalizado"
        if (oldStatus !== PERIOD_STATUS.CULMINADO && newStatus === PERIOD_STATUS.CULMINADO) {
          try {
            await periodNotificationService.notifyPeriodEnded({
              description: data[0].DESCRIPTION,
              endDate: data[0].END_DATE,
              manuallyEnded: true,
            });
          } catch (notifError) {
            console.error('[PeriodsController] Error en notificación (no crítico):', notifError);
          }

          // ── Batch: culminar todos los estudiantes INSCRITOS de este período ──
          try {
            const { data: culminados, error: culminateError } = await supabase
              .from('t_professional_practices')
              .update({ PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO })
              .eq('PERIOD_ID', parseInt(id))
              .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
              .eq('STATUS', 1)
              .select('PROFESSIONAL_PRACTICE_ID');

            if (culminateError) {
              console.error('[PeriodsController] Error culminando inscripciones:', culminateError);
            } else if (culminados && culminados.length > 0) {
              console.log(`[PeriodsController] ${culminados.length} inscripción(es) culminada(s) para período ${id}`);
            }

            // Invalidar caché de inscripciones
            cacheManager.deleteByPrefix('enrollments:');
          } catch (batchErr) {
            console.error('[PeriodsController] Error en batch culminación:', batchErr);
          }
        }
        
        // Notificación de edición general
        const hasMeaningfulChanges = updatePayload.DESCRIPTION || updatePayload.START_DATE || updatePayload.END_DATE;
        if (hasMeaningfulChanges && oldStatus !== PERIOD_STATUS.EN_CURSO && newStatus !== PERIOD_STATUS.CULMINADO) {
          try {
            await periodNotificationService.notifyPeriodUpdated({
              description: data[0].DESCRIPTION,
              startDate: updatePayload.START_DATE ? String(updatePayload.START_DATE) : oldData.START_DATE,
              endDate: updatePayload.END_DATE ? String(updatePayload.END_DATE) : oldData.END_DATE,
              oldDescription: oldData.DESCRIPTION,
              changes: Object.keys(updatePayload).filter(k => k !== 'PERIOD_STATUS' && k !== 'STATUS'),
            });
          } catch (notifError) {
            console.error('[PeriodsController] Error en notificación (no crítico):', notifError);
          }
        }
      }

      // Incluir isInUse en la respuesta (misma lógica que getPeriods)
      const { data: usageCheck } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID')
        .eq('PERIOD_ID', id)
        .limit(1);

      const result = data[0]
        ? { ...data[0], isInUse: usageCheck && usageCheck.length > 0 }
        : data[0];
      return [result] as Period[];
    });
    res.json(data[0]);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * POST /api/periodos/bulk-delete
 * Desactiva (STATUS=0) múltiples periodos en una sola operación.
 */
export const bulkDeletePeriods = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un arreglo de IDs de períodos.' });
    }

    await dbManager.withRetry(async (supabase) => {
      // Validar que ningún período tenga registros asociados
      const { data: usageData, error: usageError } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID')
        .in('PERIOD_ID', ids);

      if (usageError) throw usageError;

      if (usageData && usageData.length > 0) {
        const inUseIds = [...new Set(usageData.map(p => p.PERIOD_ID))];
        const forbiddenError = new Error(
          `No se pueden eliminar períodos que tienen registros asociados. IDs bloqueados: ${inUseIds.join(', ')}`
        ) as AppError;
        forbiddenError.code = '403';
        throw forbiddenError;
      }

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .in('PERIOD_ID', ids);

      if (error) throw error;

      // Notificar eliminación de cada período
      for (const id of ids) {
        try {
          await periodNotificationService.notifyPeriodDeleted({ description: `ID: ${id}` });
        } catch (notifError) {
          console.error(`[PeriodsController] Error notificando eliminación de período ${id}:`, notifError);
        }
      }
    });

    res.json({ success: true, message: `${ids.length} período(s) desactivado(s) exitosamente.`, affectedCount: ids.length });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * POST /api/periodos/bulk-restore
 * Restaura (STATUS=1) múltiples periodos en una sola operación.
 */
export const bulkRestorePeriods = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un arreglo de IDs de períodos.' });
    }

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 1 })
        .in('PERIOD_ID', ids);

      if (error) throw error;
    });

    res.json({ success: true, message: `${ids.length} período(s) restaurado(s) exitosamente.`, affectedCount: ids.length });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * PATCH /api/periodos/:id/toggle-status
 * Cambia el estado (STATUS) de un período entre activo (1) e inactivo (0).
 */
export const togglePeriodStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({ message: 'El campo "status" es requerido.' });
    }

    const newStatus = status === true || status === 1 ? 1 : 0;

    await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('PERIOD_ID, STATUS, DESCRIPTION')
        .eq('PERIOD_ID', id)
        .single();

      if (!oldData) {
        const notFoundError = new Error(`No se encontró el período con PERIOD_ID: ${id}`) as AppError;
        notFoundError.code = '404';
        throw notFoundError;
      }

      // Validar que no tenga registros asociados si se está desactivando
      if (newStatus === 0) {
        const { data: usageData } = await supabase
          .from('t_professional_practices')
          .select('PERIOD_ID')
          .eq('PERIOD_ID', id)
          .limit(1);

        if (usageData && usageData.length > 0) {
          const usageError = new Error('No se puede desactivar el período porque tiene registros asociados') as AppError;
          usageError.code = '403';
          throw usageError;
        }
      }

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: newStatus })
        .eq('PERIOD_ID', id);

      if (error) throw error;

      await auditStatusChange(req, 't_internships_period', id, oldData.STATUS, newStatus);

      if (newStatus === 0) {
        await periodNotificationService.notifyPeriodDeleted({ description: oldData.DESCRIPTION });
      }
    });

    res.json({ success: true, message: `Estado del período actualizado exitosamente.` });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const deletePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('PERIOD_ID, STATUS, DESCRIPTION')
        .eq('PERIOD_ID', id)
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('PERIOD_ID', id);

      if (error) throw error;

      if (oldData) {
        await auditStatusChange(req, 't_internships_period', id, oldData.STATUS, 0);
        
        // Notificar eliminación del período
        await periodNotificationService.notifyPeriodDeleted({
          description: oldData.DESCRIPTION,
        });
      }
    });
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * POST /api/periods/:id/close
 * Cierra un período académico: backup pre-cierre, freeze de evaluaciones, detección
 * de prácticas colgadas, cambio de estado a CULMINADO.
 */
export const closePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = String(req.user?.userId || '');
    const supabase = dbManager.getConnection();

    // 1. Validar período
    const { data: period } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID, DESCRIPTION, PERIOD_STATUS')
      .eq('PERIOD_ID', id)
      .single();

    if (!period) {
      return res.status(404).json({ message: `No se encontró el período con PERIOD_ID: ${id}` });
    }

    if (period.PERIOD_STATUS !== PERIOD_STATUS.EN_CURSO) {
      return res.status(409).json({ message: 'Solo se puede cerrar un período en curso' });
    }

    // 2. Backup pre-cierre (no bloqueante)
    let backupId: string | null = null;
    const warnings: string[] = [];
    try {
      const backupName = `Backup pre-cierre ${period.DESCRIPTION || `período ${id}`}`;
      const backup = await backupService.createBackup(userId, backupName, `Cierre automático del período ${id}`, 'json');
      backupId = backup.id;
    } catch (backupError) {
      const msg = backupError instanceof Error ? backupError.message : 'Error desconocido';
      console.error('[Period] Error en backup pre-cierre:', msg);
      warnings.push(`Backup pre-cierre falló: ${msg}`);
    }

    // 3-6. Operaciones dentro de withRetry
    const result = await dbManager.withRetry(async (supabase) => {
      // Obtener IDs de prácticas del período
      const { data: practices } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
        .eq('PERIOD_ID', id);

      const practiceIds = (practices || []).map(p => p.PROFESSIONAL_PRACTICE_ID);
      const totalPractices = practiceIds.length;

      // Freeze evaluaciones
      const { data: frozenData, error: freezeError } = await supabase
        .from('t_evaluation')
        .update({ FROZEN_AT: new Date().toISOString() })
        .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
        .is('FROZEN_AT', null)
        .select('EVALUATION_ID');

      if (freezeError) throw freezeError;

      const frozenEvaluations = frozenData?.length || 0;

      // Auditoría freeze
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

      // Detectar prácticas colgadas (INSCRITO sin evaluaciones completas)
      const { data: practicesWithoutEval } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('PERIOD_ID', id)
        .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO);

      const practiceIdsWithoutEval: number[] = [];
      for (const p of practicesWithoutEval || []) {
        const { count } = await supabase
          .from('t_evaluation')
          .select('*', { count: 'exact', head: true })
          .eq('PROFESSIONAL_PRACTICE_ID', p.PROFESSIONAL_PRACTICE_ID);

        if (!count || count === 0) {
          practiceIdsWithoutEval.push(p.PROFESSIONAL_PRACTICE_ID);
        }
      }

      if (practiceIdsWithoutEval.length > 0) {
        warnings.push(`${practiceIdsWithoutEval.length} práctica(s) en estado INSCRITO sin evaluaciones completas`);
      }

      // Cerrar período
      const { error: closeError } = await supabase
        .from('t_internships_period')
        .update({ PERIOD_STATUS: PERIOD_STATUS.CULMINADO })
        .eq('PERIOD_ID', id);

      if (closeError) throw closeError;

      // Auditoría
      try {
        await auditStatusChange(req, 't_internships_period', id, Number(PERIOD_STATUS.EN_CURSO), Number(PERIOD_STATUS.CULMINADO));
      } catch (auditError) {
        console.error('[Audit] Error auditing period close:', auditError);
      }

      return { totalPractices, frozenEvaluations, practiceIdsWithoutEval: practiceIdsWithoutEval.length };
    });

    res.json({
      success: true,
      message: 'Período cerrado exitosamente',
      data: {
        periodId: Number(id),
        totalPractices: result.totalPractices,
        frozenEvaluations: result.frozenEvaluations,
        backupId,
        warnings,
      }
    });

  } catch (error) {
    handleDbError(res, error);
  }
};
