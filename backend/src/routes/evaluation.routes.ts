import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getCriteria,
  getEvaluations,
  getEvaluationById,
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
router.get('/', requirePermission('evaluations:view'), getEvaluations);
router.get('/:id', requirePermission('evaluations:view'), getEvaluationById);
router.post('/', requirePermission('evaluations:create'), createEvaluation);
router.put('/:id', requirePermission('evaluations:edit'), updateEvaluation);
router.delete('/:id', requirePermission('evaluations:delete'), deleteEvaluation);

export default router;
