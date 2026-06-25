import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { validateCreateEvaluationPeriod, validateUpdateEvaluationPeriod } from '../middlewares/period-validator.middleware.js';
import {
  getCriteria,
  getEvaluations,
  getEvaluationById,
  getBatchPracticeStatus,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getPracticeEvaluationStatus,
  getPracticeTutorInfo
} from '../controllers/evaluation.controller.js';

const router = Router();

router.get('/criteria', requirePermission('evaluations:view'), getCriteria);
router.get('/practice/:practiceId/status', requirePermission('evaluations:view'), getPracticeEvaluationStatus);
router.get('/practice/:practiceId/tutor-info', requirePermission('evaluations:view'), getPracticeTutorInfo);
router.get('/batch-status', requirePermission('evaluations:view'), getBatchPracticeStatus);
router.get('/', requirePermission('evaluations:view'), getEvaluations);
router.get('/:id', requirePermission('evaluations:view'), getEvaluationById);
router.post('/', requirePermission('evaluations:create'), validateCreateEvaluationPeriod, createEvaluation);
router.put('/:id', requirePermission('evaluations:edit'), validateUpdateEvaluationPeriod, updateEvaluation);
router.delete('/:id', requirePermission('evaluations:delete'), deleteEvaluation);

export default router;
