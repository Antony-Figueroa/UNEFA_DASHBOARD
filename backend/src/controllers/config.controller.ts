import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import * as configService from '../services/config.service.js';
import { getAllPeriodValidationRules } from '../services/period-validation.service.js';

export const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await configService.getConfig();
    
    if (!config) {
      res.status(404).json({ message: 'Configuración no encontrada' });
      return;
    }

    const validationRules = config.PERIOD_VALIDATION_RULES
      ? (config.PERIOD_VALIDATION_RULES as Record<string, any>)
      : await getAllPeriodValidationRules();

    const categorizedConfig = [
      {
        category: 'Recuperación',
        items: [
          { id: 'recovery_email', key: 'RECOVERY_EMAIL', label: 'Recuperación por Email', value: config.RECOVERY_EMAIL === 1, type: 'boolean', description: 'Permitir recuperación de contraseña por correo electrónico' }
        ]
      },
      {
        category: 'Seguridad',
        items: [
          { id: 'blocking_days', key: 'BLOCKING_DAYS', label: 'Días de Bloqueo', value: config.BLOCKING_DAYS, type: 'number', description: 'Días que un usuario permanece bloqueado después de exceder intentos' },
          { id: 'attempts_key_block', key: 'ATTEMPTS_KEY_BLOCK', label: 'Intentos antes de Bloqueo', value: config.ATTEMPTS_KEY_BLOCK, type: 'number', description: 'Número de intentos fallidos antes de bloquear la cuenta' },
          { id: 'key_expiration', key: 'KEY_EXPIRATION', label: 'Expiración de Clave (días)', value: config.KEY_EXPIRATION, type: 'number', description: 'Días hasta que una clave expire y deba ser cambiada' },
          { id: 'expiration_days', key: 'EXPIRATION_DAYS', label: 'Días de Expiración de Sesión', value: config.EXPIRATION_DAYS, type: 'number', description: 'Días hasta que una sesión expire' }
        ]
      },
      {
        category: 'Contraseñas',
        items: [
          { id: 'password_min_length', key: 'USER_LENGTH', label: 'Longitud Mínima', value: config.USER_LENGTH, type: 'number', description: 'Número mínimo de caracteres para la contraseña' },
          { id: 'password_uppercase', key: 'USER_UPPERCASE', label: 'Requiere Mayúsculas', value: config.USER_UPPERCASE === 1, type: 'boolean', description: 'La contraseña debe contener al menos una mayúscula' },
          { id: 'password_lowercase', key: 'USER_LOWERCASE', label: 'Requiere Minúsculas', value: config.USER_LOWERCASE === 1, type: 'boolean', description: 'La contraseña debe contener al menos una minúscula' },
          { id: 'password_numbers', key: 'USER_NUMBERS', label: 'Requiere Números', value: config.USER_NUMBERS === 1, type: 'boolean', description: 'La contraseña debe contener al menos un número' },
          { id: 'password_special', key: 'USER_SPECIAL_CHARACTERS', label: 'Requiere Caracteres Especiales', value: config.USER_SPECIAL_CHARACTERS === 1, type: 'boolean', description: 'La contraseña debe contener al menos un carácter especial' },
          { id: 'password_min_uppercase', key: 'USER_NUM_UPPERCASE', label: 'Mín. Mayúsculas', value: config.USER_NUM_UPPERCASE, type: 'number', description: 'Cantidad mínima de mayúsculas requeridas' },
          { id: 'password_min_lowercase', key: 'USER_NUM_LOWERCASE', label: 'Mín. Minúsculas', value: config.USER_NUM_LOWERCASE, type: 'number', description: 'Cantidad mínima de minúsculas requeridas' },
          { id: 'password_min_numbers', key: 'USER_NUM_NUMBERS', label: 'Mín. Números', value: config.USER_NUM_NUMBERS, type: 'number', description: 'Cantidad mínima de números requeridos' },
          { id: 'password_min_special', key: 'USER_NUM_SPECIAL_CHARACTERS', label: 'Mín. Caracteres Especiales', value: config.USER_NUM_SPECIAL_CHARACTERS, type: 'number', description: 'Cantidad mínima de caracteres especiales requeridos' }
        ]
      },
      {
        category: 'Sesiones',
        items: [
          { id: 'session_timeout', key: 'KEY_LEGTH', label: 'Tiempo de Sesión (minutos)', value: config.KEY_LEGTH || 60, type: 'number', description: 'Tiempo en minutos antes de que la sesión expire por inactividad' }
        ]
      },
      {
        category: 'Logs',
        items: [
          { id: 'log_retention', key: 'EXPIRATION_DAYS', label: 'Retención de Logs (días)', value: 90, type: 'number', description: 'Días que se mantienen los registros de actividad' }
        ]
      },
      {
        category: 'Validación de Periodos',
        items: [
          { id: 'val_pre_enrollment_create_skip_status', key: 'PV_pre-enrollment_create_skipPeriodStatusCheck', label: 'Pre-inscripción (crear) — saltar periodo activo', value: validationRules['pre-enrollment']?.create?.skipPeriodStatusCheck ?? false, type: 'boolean', description: 'Permite crear pre-inscripciones aunque el periodo no esté activo' },
          { id: 'val_pre_enrollment_update_skip_status', key: 'PV_pre-enrollment_update_skipPeriodStatusCheck', label: 'Pre-inscripción (editar) — saltar periodo activo', value: validationRules['pre-enrollment']?.update?.skipPeriodStatusCheck ?? true, type: 'boolean', description: 'Permite editar pre-inscripciones aunque el periodo haya finalizado' },
          { id: 'val_enrollment_create_skip_status', key: 'PV_enrollment_create_skipPeriodStatusCheck', label: 'Inscripción (crear) — saltar periodo activo', value: validationRules.enrollment?.create?.skipPeriodStatusCheck ?? false, type: 'boolean', description: 'Permite crear inscripciones aunque el periodo no esté activo' },
          { id: 'val_enrollment_update_skip_status', key: 'PV_enrollment_update_skipPeriodStatusCheck', label: 'Inscripción (editar) — saltar periodo activo', value: validationRules.enrollment?.update?.skipPeriodStatusCheck ?? false, type: 'boolean', description: 'Permite editar inscripciones aunque el periodo haya finalizado' },
          { id: 'val_enrollment_create_use_grace', key: 'PV_enrollment_create_usePeriodGraceDays', label: 'Inscripción (crear) — usar días de gracia', value: validationRules.enrollment?.create?.usePeriodGraceDays ?? true, type: 'boolean', description: 'Usa ENROLLMENT_GRACE_DAYS como fecha tope en inscripciones' },
          { id: 'val_enrollment_update_use_grace', key: 'PV_enrollment_update_usePeriodGraceDays', label: 'Inscripción (editar) — usar días de gracia', value: validationRules.enrollment?.update?.usePeriodGraceDays ?? true, type: 'boolean', description: 'Usa ENROLLMENT_GRACE_DAYS como fecha tope al editar inscripciones' },
          { id: 'val_evaluation_create_skip_status', key: 'PV_evaluation_create_skipPeriodStatusCheck', label: 'Evaluación (crear) — saltar periodo activo', value: validationRules.evaluation?.create?.skipPeriodStatusCheck ?? false, type: 'boolean', description: 'Permite crear evaluaciones aunque el periodo no esté activo' },
          { id: 'val_evaluation_create_require_inscribed', key: 'PV_evaluation_create_requirePracticesStatusInscribed', label: 'Evaluación (crear) — requiere práctica inscrita', value: validationRules.evaluation?.create?.requirePracticesStatusInscribed ?? true, type: 'boolean', description: 'Exige que la práctica esté en estado INSCRITO para evaluar' },
          { id: 'val_evaluation_extend_days', key: 'PV_evaluation_extendEndDateDays', label: 'Evaluación — días extra después del cierre', value: validationRules.evaluation?.create?.extendEndDateDays ?? 10, type: 'number', description: 'Días adicionales después del END_DATE para permitir evaluaciones (0=estricto, -1=sin límite)' },
        ]
      }
    ];

    res.json({
      raw: config,
      categorized: categorizedConfig
    });

  } catch (error) {
    console.error('Get Config Error:', error);
    res.status(500).json({ message: 'Error al obtener configuración', error });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    const dbUpdates: Record<string, number> = {};
    let periodValidationUpdates: Record<string, any> | null = null;

    Object.entries(updates).forEach(([key, value]) => {
      // Las claves PV_ modifican el JSONB PERIOD_VALIDATION_RULES
      if (key.startsWith('PV_')) {
        if (!periodValidationUpdates) {
          periodValidationUpdates = {};
        }
        // formato: PV_{module}_{operation}_{field}
        // ej: PV_pre-enrollment_create_skipPeriodStatusCheck
        const parts = key.split('_');
        if (parts.length >= 4) {
          const field = parts.slice(3).join('_');
          const module = parts[1];
          const operation = parts[2] as 'create' | 'update';
          if (!periodValidationUpdates[module]) periodValidationUpdates[module] = {};
          if (!periodValidationUpdates[module][operation]) periodValidationUpdates[module][operation] = {};
          periodValidationUpdates[module][operation][field] = value;
        }
      } else if (typeof value === 'boolean') {
        dbUpdates[key.toUpperCase()] = value ? 1 : 0;
      } else if (typeof value === 'number') {
        dbUpdates[key.toUpperCase()] = value;
      }
    });

    // Si hay cambios en validación de periodos, mergear con lo existente
    if (periodValidationUpdates) {
      const supabase = dbManager.getConnection();
      const { data: currentConfig } = await supabase
        .from('t_config')
        .select('PERIOD_VALIDATION_RULES')
        .eq('CONFIG_ID', 1)
        .maybeSingle();

      const currentRules = currentConfig?.PERIOD_VALIDATION_RULES as Record<string, any> || {};
      
      // Merge profundo
      for (const [module, ops] of Object.entries(periodValidationUpdates)) {
        if (!currentRules[module]) currentRules[module] = {};
        for (const [op, fields] of Object.entries(ops as Record<string, any>)) {
          if (!currentRules[module][op]) currentRules[module][op] = {};
          Object.assign(currentRules[module][op], fields);
        }
      }

      (dbUpdates as any).PERIOD_VALIDATION_RULES = currentRules;
    }

    const updated = await configService.updateConfig(dbUpdates);

    if (!updated) {
      res.status(400).json({ message: 'Error al actualizar configuración' });
      return;
    }

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      config: updated
    });

  } catch (error) {
    console.error('Update Config Error:', error);
    res.status(500).json({ message: 'Error al actualizar configuración', error });
  }
};

export const clearOldLogs = async (req: Request, res: Response) => {
  try {
    const { days = 90 } = req.body;

    const result = await configService.clearOldLogs(days);

    const userId = (req as any).user?.id;
    await dbManager.getConnection()
      .from('t_auth_log')
      .insert({
        USER_ID: userId,
        ACTION: 'LOGS_CLEARED',
        DETAILS: `Se eliminaron ${result.deleted} registros con más de ${days} días`,
        CREATED_AT: new Date().toISOString()
      });

    res.json({
      success: true,
      message: `Se eliminaron ${result.deleted} registros antiguos`,
      deleted: result.deleted
    });

  } catch (error) {
    console.error('Clear Logs Error:', error);
    res.status(500).json({ message: 'Error al limpiar logs', error });
  }
};

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const health = await configService.getSystemHealth();

    res.json({
      status: health.database ? 'healthy' : 'unhealthy',
      checks: {
        database: {
          status: health.database ? 'ok' : 'error',
          message: health.database ? 'Conexión exitosa' : 'Error de conexión'
        },
        logs: {
          status: 'ok',
          count: health.logsCount,
          oldestRecord: health.oldestLog
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('System Health Error:', error);
    res.status(500).json({ message: 'Error al verificar sistema', error });
  }
};

export const syncData = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    
    const tables = [
      't_students',
      't_tutors', 
      't_institution',
      't_enrollment',
      't_career',
      't_internships_period',
      't_tracking',
      't_list'
    ];
    
    const results: Record<string, { count: number; status: string }> = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results[table] = { count: 0, status: 'error' };
        } else {
          results[table] = { count: count || 0, status: 'ok' };
        }
      } catch {
        results[table] = { count: 0, status: 'error' };
      }
    }
    
    const userId = (req as any).user?.id;
    await dbManager.getConnection()
      .from('t_auth_log')
      .insert({
        USER_ID: userId,
        ACTION: 'DATA_SYNC',
        DETAILS: 'Sincronización de datos completada',
        CREATED_AT: new Date().toISOString()
      });

    res.json({
      success: true,
      message: 'Sincronización completada exitosamente',
      tables: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync Data Error:', error);
    res.status(500).json({ message: 'Error al sincronizar datos', error });
  }
};
