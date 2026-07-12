import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { validateCreateEvaluationPeriod, validateUpdateEvaluationPeriod } from '../middlewares/period-validator.middleware.js';
import {
  getCriteria,
  createCriteria,
  deleteCriteria,
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
  reverseFailedPractice,
  freezeEvaluations,
  unfreezeEvaluation,
  unfreezePracticeEvaluations,
  grantExtension,
  revokeExtension,
  bulkGrantExtension,
  getPendingPracticesReport,
  exportEvaluationsExcel,
  getAuditHistory,
  closeActasPreview,
  closeActas,
} from '../controllers/evaluation.controller.js';

const router = Router();

router.get('/criteria', requirePermission('evaluations:view'), getCriteria);
router.post('/criteria', requirePermission('evaluations:edit'), createCriteria);
router.put('/criteria', requirePermission('evaluations:edit'), updateCriteriaBatch);
router.put('/criteria/:id', requirePermission('evaluations:edit'), updateCriteria);
router.delete('/criteria/:id', requirePermission('evaluations:edit'), deleteCriteria);
router.get('/practice/:practiceId/status', requirePermission('evaluations:view'), getPracticeEvaluationStatus);
router.get('/practice/:practiceId/tutor-info', requirePermission('evaluations:view'), getPracticeTutorInfo);
router.get('/batch-status', requirePermission('evaluations:view'), getBatchPracticeStatus);
router.get('/pending-report/:periodId', requirePermission('evaluations:view'), getPendingPracticesReport);
router.get('/export/:periodId', requirePermission('evaluations:view'), exportEvaluationsExcel);
router.get('/', requirePermission('evaluations:view'), getEvaluations);
router.get('/:id', requirePermission('evaluations:view'), getEvaluationById);
router.post('/', requirePermission('evaluations:create'), validateCreateEvaluationPeriod, createEvaluation);
router.put('/:id', requirePermission('evaluations:edit'), validateUpdateEvaluationPeriod, updateEvaluation);
router.delete('/:id', requirePermission('evaluations:delete'), deleteEvaluation);
router.post('/unfreeze-practice', requirePermission('evaluations:unfreeze'), unfreezePracticeEvaluations);
router.post('/freeze', requirePermission('evaluations:freeze'), freezeEvaluations);
router.post('/close-actas/preview', requirePermission('evaluations:freeze'), closeActasPreview);
router.post('/close-actas', requirePermission('evaluations:freeze'), closeActas);
router.post('/bulk-grant-extension', requirePermission('evaluations:freeze'), bulkGrantExtension);
router.post('/:id/unfreeze', requirePermission('evaluations:unfreeze'), unfreezeEvaluation);
router.post('/:practiceId/mark-failed', requirePermission('evaluations:edit'), markPracticeAsFailed);
router.post('/:practiceId/reverse-failed', requirePermission('evaluations:edit'), reverseFailedPractice);
router.post('/:practiceId/grant-extension', requirePermission('evaluations:freeze'), grantExtension);
router.post('/:practiceId/revoke-extension', requirePermission('evaluations:freeze'), revokeExtension);
router.get('/audit/:practiceId', requirePermission('evaluations:view'), getAuditHistory);

export default router;
