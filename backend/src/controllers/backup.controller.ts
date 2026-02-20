import { Request, Response } from 'express';
import { backupService } from '../services/backup.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

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
    
    if (isSQL && backup.data?.sql) {
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
