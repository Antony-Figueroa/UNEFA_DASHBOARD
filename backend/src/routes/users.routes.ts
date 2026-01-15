import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  saveSecurityQuestions,
  getUserCredentials 
} from '../controllers/users.controller.js';
import { authenticateToken, authorizeRole, requireMaster2FA, ROLES } from '../middlewares/auth.middleware.js';

const router = Router();

// Solo el ADMIN (Maestro o Regular) puede gestionar usuarios
router.get('/', authenticateToken, authorizeRole([ROLES.MASTER_ADMIN, ROLES.ADMIN]), getUsers);
router.post('/', authenticateToken, authorizeRole([ROLES.MASTER_ADMIN, ROLES.ADMIN]), createUser);
router.put('/:id', authenticateToken, authorizeRole([ROLES.MASTER_ADMIN, ROLES.ADMIN]), updateUser);

// Los Administradores (Maestro o Regular) pueden ver credenciales (Requiere verificación adicional de identidad)
router.post('/:userId/credentials', authenticateToken, requireMaster2FA, getUserCredentials);

// Cualquier usuario autenticado puede guardar sus propias preguntas de seguridad
router.post('/security-questions', authenticateToken, saveSecurityQuestions);

export default router;
