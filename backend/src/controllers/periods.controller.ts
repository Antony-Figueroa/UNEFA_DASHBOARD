import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';
import { periodNotificationService } from '../services/period-notification.service.js';

const TABLE_NAME = 't_internships_period';

const PERIOD_COLUMNS_TO_AUDIT = [
  'DESCRIPTION', 'START_DATE', 'END_DATE', 'PERIOD_STATUS', 'STATUS', 'T_INTERNSHIPS_CODE'
];

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as AppError;
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '404') {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(500).json({ 
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
}

export const getPeriods = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Obtener todos los periodos
      const { data: periods, error: periodsError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('START_DATE', { ascending: false });

      if (periodsError) throw periodsError;

      // 2. Obtener IDs de periodos en uso en t_professional_practices
      const { data: usedPeriods, error: usedError } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID');

      if (usedError) throw usedError;

      const usedPeriodIds = new Set(usedPeriods.map(p => p.PERIOD_ID));

      // 3. Marcar periodos como en uso
      const enrichedPeriods = (periods as Period[]).map(p => ({
        ...p,
        isInUse: usedPeriodIds.has(p.PERIOD_ID)
      }));

      return enrichedPeriods;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getCurrentPeriod = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PERIOD_STATUS', '1')
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Period;
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
          const notFoundError = new Error(`No se encontró el périodo con PERIOD_ID: ${id}`) as AppError;
          notFoundError.code = '404';
          throw notFoundError;
        }
        throw error;
      }
      return data as Period;
    });
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { description, startDate, endDate, periodStatus, status, code } = req.body;
    const now = new Date().toISOString();
    
    const formatToDate = (val: string | number) => {
      if (typeof val === 'number') {
        const date = new Date(val * 1000);
        return date.toISOString().split('T')[0];
      }
      return val;
    };

    const dbData = {
      DESCRIPTION: description,
      START_DATE: formatToDate(startDate),
      END_DATE: formatToDate(endDate),
      PERIOD_STATUS: String(periodStatus || '1'),
      STATUS: status === false ? 0 : 1,
      CREATION_DATE: now,
      T_INTERNSHIPS_CODE: code || `P${Date.now().toString().slice(-7)}`
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
    const { description, startDate, endDate, periodStatus, status, code } = req.body;
    
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

      // Si está en uso, solo permitir modificar ciertos campos
      if (isInUse) {
        const restrictedFields = ['description', 'startDate', 'code'];
        const tryingToModifyRestricted = restrictedFields.some(field => {
          const value = req.body[field];
          return value !== undefined && value !== null;
        });

        if (tryingToModifyRestricted) {
          const usageError = new Error('No se puede modificar este campo porque el período tiene registros asociados') as AppError;
          usageError.code = '403';
          throw usageError;
        }
      }

      const updatePayload: Record<string, unknown> = {};
      if (description !== undefined) updatePayload.DESCRIPTION = description;
      if (startDate !== undefined) updatePayload.START_DATE = formatToDate(startDate);
      if (endDate !== undefined) updatePayload.END_DATE = formatToDate(endDate);
      if (periodStatus !== undefined) {
        // VALIDACIÓN CRONOLÓGICA: No permitir activar un período si hay uno anterior sin finalizar
        if (String(periodStatus) === '2') { // Intentando activar a "En Curso"
          // Obtener el período que se está intentando activar
          const currentStartDate = updatePayload.START_DATE || oldData?.START_DATE;
          const currentEndDate = updatePayload.END_DATE || oldData?.END_DATE;
          const currentPeriodId = id;
          
          if (currentStartDate && currentEndDate) {
            // Obtener todos los períodos activos (excluyendo el actual), ordenados por fecha
            const { data: allPeriods } = await supabase
              .from(TABLE_NAME)
              .select('PERIOD_ID, DESCRIPTION, START_DATE, END_DATE, PERIOD_STATUS')
              .eq('STATUS', 1)
              .neq('PERIOD_ID', currentPeriodId)
              .order('START_DATE', { ascending: true });

            if (allPeriods && allPeriods.length > 0) {
              // Buscar el período que debería estar ANTES del actual (termina inmediatamente antes o se superpone)
              // Un período bloquea si:
              // 1. No está finalizado (PERIOD_STATUS != 3)
              // 2. Su fecha de fin es >= a la fecha de inicio del período actual
              //    O su fecha de inicio es < a la fecha de inicio del período actual (empieza antes)
              const blockingPeriods = allPeriods.filter(p => {
                const isNotFinalized = p.PERIOD_STATUS !== '3';
                const pStartDate = new Date(p.START_DATE);
                const pEndDate = new Date(p.END_DATE);
                const currentStart = new Date(currentStartDate);
                
                // Bloquea si: no está finalizado Y (termina después de que empiece el actual O empieza antes que el actual)
                const shouldBlock = isNotFinalized && (
                  pEndDate >= currentStart || // Termina cuando o después de que empiece el actual
                  pStartDate < currentStart  // Empieza antes del actual (período anterior)
                );
                
                return shouldBlock;
              });
              
              if (blockingPeriods.length > 0) {
                // Ordenar por fecha de fin descendente para mostrar el más relevante
                blockingPeriods.sort((a, b) => new Date(b.END_DATE).getTime() - new Date(a.END_DATE).getTime());
                const blockingPeriod = blockingPeriods[0];
                const errorMsg = `No se puede activar el período "${oldData?.DESCRIPTION}" porque el período "${blockingPeriod.DESCRIPTION}" (termina el ${new Date(blockingPeriod.END_DATE).toLocaleDateString('es-VE')}) aún no ha sido culminado. Debes culminar primero el período anterior para poder activar este.`;
                console.warn(`[PeriodValidation] ${errorMsg}`);
                const validationError = new Error(errorMsg) as AppError;
                validationError.code = '400';
                throw validationError;
              }
            }
          }
        }
        updatePayload.PERIOD_STATUS = String(periodStatus);
      }
      if (status !== undefined) updatePayload.STATUS = status === false ? 0 : 1;
      if (code !== undefined) updatePayload.T_INTERNSHIPS_CODE = code;

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
        
        // Notificar si el período cambió a "En Curso" (PERIOD_STATUS = 2)
        if (oldStatus !== '2' && newStatus === '2') {
          await periodNotificationService.notifyPeriodStarted({
            description: data[0].DESCRIPTION,
            startDate: data[0].START_DATE,
            endDate: data[0].END_DATE,
          });
        }
        
        // Notificar si el período cambió a "Finalizado" (PERIOD_STATUS = 3)
        if (oldStatus !== '3' && newStatus === '3') {
          await periodNotificationService.notifyPeriodEnded({
            description: data[0].DESCRIPTION,
            endDate: data[0].END_DATE,
            manuallyEnded: true,
          });
        }
        
        // Notificar edición general si hubo cambios en fechas o descripción
        const hasMeaningfulChanges = updatePayload.DESCRIPTION || updatePayload.START_DATE || updatePayload.END_DATE;
        if (hasMeaningfulChanges && oldStatus !== '2' && newStatus !== '3') {
          await periodNotificationService.notifyPeriodUpdated({
            description: data[0].DESCRIPTION,
            startDate: updatePayload.START_DATE ? String(updatePayload.START_DATE) : oldData.START_DATE,
            endDate: updatePayload.END_DATE ? String(updatePayload.END_DATE) : oldData.END_DATE,
            oldDescription: oldData.DESCRIPTION,
            changes: Object.keys(updatePayload).filter(k => k !== 'PERIOD_STATUS' && k !== 'STATUS'),
          });
        }
      }

      return (data as unknown) as Period[];
    });
    res.json(data[0]);
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
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: message, message: 'no hay conexion a la bd' });
  }
};
