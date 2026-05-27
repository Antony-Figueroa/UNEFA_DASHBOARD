import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as enrollmentsController from '../controllers/enrollments.controller.js';

const router = Router();

router.get('/practices', requirePermission('enrollments:view'), enrollmentsController.getPracticesForEvaluation);
router.get('/', requirePermission('enrollments:view'), enrollmentsController.getEnrollments);
router.post('/', requirePermission('enrollments:create'), enrollmentsController.createEnrollment);
router.put('/:id', requirePermission('enrollments:edit'), enrollmentsController.updateEnrollment);
router.delete('/:id', requirePermission('enrollments:delete'), enrollmentsController.deleteEnrollment);

export default router;
