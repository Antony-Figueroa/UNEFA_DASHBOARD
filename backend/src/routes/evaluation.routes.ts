import { Router } from 'express';
import {
  getCriteria,
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getPracticeEvaluationStatus
} from '../controllers/evaluation.controller.js';

const router = Router();

router.get('/criteria', getCriteria);
router.get('/practice/:practiceId/status', getPracticeEvaluationStatus);
router.get('/', getEvaluations);
router.get('/:id', getEvaluationById);
router.post('/', createEvaluation);
router.put('/:id', updateEvaluation);
router.delete('/:id', deleteEvaluation);

export default router;
