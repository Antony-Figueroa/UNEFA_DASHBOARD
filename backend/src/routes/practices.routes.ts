import { Router } from 'express';
import { 
  getPracticesWithEvaluations,
  getEvaluationStats,
  getCulminationStats
} from '../controllers/practices-evaluations.controller.js';

const router = Router();

router.get('/evaluations', getPracticesWithEvaluations);
router.get('/evaluations/stats', getEvaluationStats);
router.get('/culmination/stats', getCulminationStats);

export default router;