import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as preEnrollmentsController from '../controllers/pre-enrollments.controller.js';

const router = Router();

router.get('/', requirePermission('enrollments:view'), preEnrollmentsController.getPreEnrollments);
router.get('/types-by-student', requirePermission('enrollments:view'), preEnrollmentsController.getTypesByStudent);
router.post('/', requirePermission('enrollments:create'), preEnrollmentsController.createPreEnrollment);
router.put('/:id', requirePermission('enrollments:edit'), preEnrollmentsController.updatePreEnrollment);
router.delete('/:id', requirePermission('enrollments:delete'), preEnrollmentsController.deletePreEnrollment);

export default router;
