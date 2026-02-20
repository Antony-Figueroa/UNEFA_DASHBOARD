import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  saveSecurityQuestions
} from '../controllers/users.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('users:view'), getUsers);
router.post('/', authenticateToken, requirePermission('users:create'), createUser);
router.put('/:id', authenticateToken, requirePermission('users:edit'), updateUser);
router.delete('/:id', authenticateToken, requirePermission('users:delete'), deleteUser);

router.post('/security-questions', authenticateToken, saveSecurityQuestions);

export default router;
