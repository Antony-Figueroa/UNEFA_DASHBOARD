import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import * as configService from '../services/config.service.js';

export const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await configService.getConfig();
    
    if (!config) {
      res.status(404).json({ message: 'Configuración no encontrada' });
      return;
    }

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

    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        dbUpdates[key.toUpperCase()] = value ? 1 : 0;
      } else if (typeof value === 'number') {
        dbUpdates[key.toUpperCase()] = value;
      }
    });

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
