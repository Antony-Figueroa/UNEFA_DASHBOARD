import { Router } from 'express';
import { getUsers, createUser, updateUser, saveSecurityQuestions } from '../controllers/users.controller.js';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';

const router = Router();

// Solo el ADMIN (Maestro) puede gestionar usuarios
router.get('/', authenticateToken, authorizeRole([ROLES.ADMIN]), getUsers);
router.post('/', authenticateToken, authorizeRole([ROLES.ADMIN]), createUser);
router.put('/:id', authenticateToken, authorizeRole([ROLES.ADMIN]), updateUser);

// Cualquier usuario autenticado puede guardar sus propias preguntas de seguridad
router.post('/security-questions', authenticateToken, saveSecurityQuestions);

export default router;
