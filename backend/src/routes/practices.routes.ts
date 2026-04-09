import { Router } from 'express';
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
router.get('/evaluations', getPracticesWithEvaluations);
router.get('/evaluations/stats', getEvaluationStats);
router.get('/culmination/stats', getCulminationStats);
// Ruta con parámetro DESPUÉS de las estáticas
router.get('/detail/:id', getStudentDetail);

export default router;