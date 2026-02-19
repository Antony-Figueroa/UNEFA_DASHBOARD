import { Router } from 'express';
import { 
  createBackup, 
  getBackups, 
  downloadBackup, 
  deleteBackup 
} from '../controllers/backup.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de backups
router.post('/', createBackup);           // Crear backup
router.get('/', getBackups);              // Listar backups
router.get('/:id/download', downloadBackup); // Descargar backup
router.delete('/:id', deleteBackup);      // Eliminar backup

export default router;
