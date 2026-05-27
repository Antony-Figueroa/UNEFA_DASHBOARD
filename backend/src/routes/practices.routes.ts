import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { 
  getPracticesWithEvaluations,
  getEvaluationStats,
  getCulminationStats,
  getStudentDetail
} from '../controllers/practices-evaluations.controller.js';

const router = Router();

// Debug: ver todas las rutas registradas
console.log('[PRACTICES ROUTES] Registered routes:', router.stack.map(r => r.route?.path));

// Rutas estáticas PRIMERO (orden correcto en Express)
router.get('/evaluations', requirePermission('practices:view'), getPracticesWithEvaluations);
router.get('/evaluations/stats', requirePermission('practices:view'), getEvaluationStats);
router.get('/culmination/stats', requirePermission('practices:view'), getCulminationStats);
// Ruta con parámetro DESPUÉS de las estáticas
router.get('/detail/:id', requirePermission('practices:view'), getStudentDetail);

export default router;