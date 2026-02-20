import { Request, Response } from 'express';
import { backupService } from '../services/backup.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import bcrypt from 'bcryptjs';
import { dbManager } from '../lib/db-manager.js';

export const createBackup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, format } = req.body;
    const userId = String(req.user?.userId || '');

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const backupFormat = format === 'json' ? 'json' : 'sql';
    const backup = await backupService.createBackup(userId, name, description, backupFormat);
    
    res.status(201).json({
      message: 'Backup creado exitosamente',
      backup
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      message: 'Error al crear el backup', 
      error: error.message 
    });
  }
};

export const getBackups = async (req: Request, res: Response) => {
  try {
    const backups = await backupService.getBackups();
    res.json({ backups });
  } catch (error: any) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ 
      message: 'Error al obtener los backups', 
      error: error.message 
    });
  }
};

export const downloadBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backup = await backupService.getBackupById(id);

    if (!backup) {
      return res.status(404).json({ message: 'Backup no encontrado' });
    }

    const isSQL = backup.format === 'sql' || backup.fileName.endsWith('.sql');
    
    if (isSQL) {
      res.setHeader('Content-Type', 'application/sql');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${backup.fileName}"`);
    
    if (isSQL && backup.data?.fullSql) {
      res.send(backup.data.fullSql);
    } else if (isSQL && backup.data?.sql) {
      res.send(backup.data.sql);
    } else {
      res.send(backup.data);
    }
  } catch (error: any) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ 
      message: 'Error al descargar el backup', 
      error: error.message 
    });
  }
};

export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await backupService.deleteBackup(id);
    
    res.json({ message: 'Backup eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ 
      message: 'Error al eliminar el backup', 
      error: error.message 
    });
  }
};

export const verifyRestorePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Contraseña requerida' });
    }

    const supabaseClient = dbManager.getConnection();
    const { data: userKeys, error } = await supabaseClient
      .from('t_user_key')
      .select('KEY')
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .order('USER_KEY_ID', { ascending: false })
      .limit(1)
      .single();

    if (error || !userKeys) {
      return res.status(401).json({ valid: false, message: 'Error al verificar credenciales' });
    }

    const isValid = await bcrypt.compare(password, userKeys.KEY);

    res.json({ valid: isValid, message: isValid ? 'Contraseña verificada' : 'Contraseña incorrecta' });
  } catch (error: any) {
    console.error('Error verifying password:', error);
    res.status(500).json({ valid: false, message: 'Error al verificar contraseña' });
  }
};

export const restoreBackup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { confirmed } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!confirmed) {
      return res.status(400).json({ 
        message: 'Debe confirmar la restauración',
        requiresConfirmation: true 
      });
    }

    const backup = await backupService.getBackupById(id);
    if (!backup) {
      return res.status(404).json({ message: 'Backup no encontrado' });
    }

    if (backup.format !== 'sql' && !backup.fileName.endsWith('.sql')) {
      return res.status(400).json({ message: 'Solo se pueden restaurar backups en formato SQL' });
    }

    const sqlContent = backup.data?.fullSql || backup.data?.sql;
    if (!sqlContent) {
      return res.status(400).json({ message: 'El backup no contiene contenido SQL válido' });
    }

    // Log de la acción antes de restaurar
    console.log(`[BACKUP RESTORE] Usuario ${userId} iniciando restauración del backup ${id} (${backup.name})`);

    // Crear backup automático antes de restaurar
    const autoBackupName = `auto-backup-pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await backupService.createBackup(String(userId), autoBackupName, 'Backup automático antes de restaurar');

    // Ejecutar restauración
    const supabaseClient = dbManager.getConnection();
    
    // Dividir el SQL en statements individuales y ejecutar
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executedStatements = 0;
    let errors = 0;

    for (const statement of statements) {
      if (statement.toUpperCase().includes('SET SESSION_REPLICATION_ROLE')) {
        continue; // Skip replication role commands
      }

      try {
        const { error } = await supabaseClient.rpc('execute_sql', { sql: statement + ';' });
        if (error) {
          errors++;
          console.warn(`[BACKUP RESTORE] Error en statement: ${error.message}`);
        } else {
          executedStatements++;
        }
      } catch (err) {
        errors++;
      }
    }

    console.log(`[BACKUP RESTORE] Completado. Statements ejecutados: ${executedStatements}, Errores: ${errors}`);

    res.json({
      message: 'Restauración completada',
      details: {
        backupName: backup.name,
        executedStatements,
        errors,
        autoBackupCreated: autoBackupName
      }
    });

  } catch (error: any) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ 
      message: 'Error al restaurar el backup', 
      error: error.message 
    });
  }
};
