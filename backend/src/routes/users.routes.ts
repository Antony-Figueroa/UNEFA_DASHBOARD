import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  saveSecurityQuestions
} from '../controllers/users.controller.js';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, authorizeRole([ROLES.ADMIN]), getUsers);
router.post('/', authenticateToken, authorizeRole([ROLES.ADMIN]), createUser);
router.put('/:id', authenticateToken, authorizeRole([ROLES.ADMIN]), updateUser);
router.delete('/:id', authenticateToken, authorizeRole([ROLES.ADMIN]), deleteUser);

router.post('/security-questions', authenticateToken, saveSecurityQuestions);

export default router;
