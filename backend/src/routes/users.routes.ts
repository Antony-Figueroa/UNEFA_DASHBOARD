import { Router } from 'express';
import { 
  getUsers, 
  checkUserCi,
  createUser, 
  updateUser, 
  deleteUser,
  resetUserPassword,
  saveSecurityQuestions,
  getUserById,
  getUserLoginHistory
} from '../controllers/users.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/check-ci/:ci', authenticateToken, requirePermission('users:create'), checkUserCi);
router.get('/', authenticateToken, requirePermission('users:view'), getUsers);
router.post('/', authenticateToken, requirePermission('users:create'), createUser);
router.put('/:id', authenticateToken, requirePermission('users:edit'), updateUser);
router.get('/:id', authenticateToken, requirePermission('users:view'), getUserById);
router.get('/:id/login-history', authenticateToken, requirePermission('users:view'), getUserLoginHistory);
router.delete('/:id', authenticateToken, requirePermission('users:delete'), deleteUser);
router.post('/:id/reset-password', authenticateToken, requirePermission('users:edit'), resetUserPassword);

router.post('/security-questions', authenticateToken, saveSecurityQuestions);

export default router;
