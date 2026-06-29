import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as enrollmentsController from '../controllers/enrollments.controller.js';
import {
  validateCreateEnrollmentPeriodWithTypeDates,
  validateUpdateEnrollmentPeriod,
} from '../middlewares/period-validator.middleware.js';

const router = Router();

router.get('/practices', requirePermission('enrollments:view'), enrollmentsController.getPracticesForEvaluation);
router.get('/', requirePermission('enrollments:view'), enrollmentsController.getEnrollments);
router.post('/', requirePermission('enrollments:create'), validateCreateEnrollmentPeriodWithTypeDates, enrollmentsController.createEnrollment);
router.put('/:id', requirePermission('enrollments:edit'), validateUpdateEnrollmentPeriod, enrollmentsController.updateEnrollment);
router.get('/:id/changes', requirePermission('enrollments:view'), enrollmentsController.getEnrollmentChanges);
router.patch('/:id/withdraw', requirePermission('enrollments:edit'), enrollmentsController.withdrawPractice);
router.patch('/:id/reclassify-withdrawal', requirePermission('enrollments:edit'), enrollmentsController.reclassifyWithdrawal);
router.delete('/:id', requirePermission('enrollments:delete'), enrollmentsController.deleteEnrollment);

export default router;
