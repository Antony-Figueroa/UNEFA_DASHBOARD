import { Router } from 'express';
import { 
  createBackup, 
  getBackups, 
  downloadBackup, 
  deleteBackup,
  restoreBackup,
  verifyRestorePassword
} from '../controllers/backup.controller.js';
import { authenticateToken, authorizeRole, ROLES, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', requirePermission('backups:create'), createBackup);
router.get('/', getBackups);
router.get('/:id/download', downloadBackup);
router.delete('/:id', requirePermission('backups:delete'), deleteBackup);

router.post('/:id/verify-password', authorizeRole([ROLES.ADMIN]), verifyRestorePassword);
router.post('/:id/restore', requirePermission('backups:restore'), restoreBackup);

export default router;
