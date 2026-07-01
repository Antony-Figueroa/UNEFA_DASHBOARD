import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { validateCreateEvaluationPeriod, validateUpdateEvaluationPeriod } from '../middlewares/period-validator.middleware.js';
import {
  getCriteria,
  updateCriteria,
  updateCriteriaBatch,
  getEvaluations,
  getEvaluationById,
  getBatchPracticeStatus,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getPracticeEvaluationStatus,
  getPracticeTutorInfo,
  markPracticeAsFailed,
  freezeEvaluations,
  unfreezeEvaluation,
  unfreezePracticeEvaluations,
  grantExtension,
  revokeExtension
} from '../controllers/evaluation.controller.js';

const router = Router();

router.get('/criteria', requirePermission('evaluations:view'), getCriteria);
router.put('/criteria', requirePermission('evaluations:edit'), updateCriteriaBatch);
router.put('/criteria/:id', requirePermission('evaluations:edit'), updateCriteria);
router.get('/practice/:practiceId/status', requirePermission('evaluations:view'), getPracticeEvaluationStatus);
router.get('/practice/:practiceId/tutor-info', requirePermission('evaluations:view'), getPracticeTutorInfo);
router.get('/batch-status', requirePermission('evaluations:view'), getBatchPracticeStatus);
router.get('/', requirePermission('evaluations:view'), getEvaluations);
router.get('/:id', requirePermission('evaluations:view'), getEvaluationById);
router.post('/', requirePermission('evaluations:create'), validateCreateEvaluationPeriod, createEvaluation);
router.put('/:id', requirePermission('evaluations:edit'), validateUpdateEvaluationPeriod, updateEvaluation);
router.delete('/:id', requirePermission('evaluations:delete'), deleteEvaluation);
router.post('/unfreeze-practice', requirePermission('evaluations:unfreeze'), unfreezePracticeEvaluations);
router.post('/freeze', requirePermission('evaluations:freeze'), freezeEvaluations);
router.post('/:id/unfreeze', requirePermission('evaluations:unfreeze'), unfreezeEvaluation);
router.post('/:practiceId/mark-failed', requirePermission('evaluations:edit'), markPracticeAsFailed);
router.post('/:practiceId/grant-extension', requirePermission('evaluations:freeze'), grantExtension);
router.post('/:practiceId/revoke-extension', requirePermission('evaluations:freeze'), revokeExtension);

export default router;
