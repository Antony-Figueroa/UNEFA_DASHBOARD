import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';
import * as dashboardConfigController from '../controllers/dashboard-config.controller.js';

const router = Router();

// Publico autenticado: obtener layout del rol actual
router.get('/layout/:roleId', authenticateToken, dashboardConfigController.getLayout);

// Admin: obtener todos los layouts
router.get('/layouts', authenticateToken, authorizeRole([ROLES.ADMIN]), dashboardConfigController.getAllLayouts);

// Admin: guardar layout de un rol
router.put('/layout/:roleId', authenticateToken, authorizeRole([ROLES.ADMIN]), dashboardConfigController.saveLayout);

// Admin: resetear layout a valores por defecto
router.post('/layout/:roleId/reset', authenticateToken, authorizeRole([ROLES.ADMIN]), dashboardConfigController.resetLayout);

export default router;
