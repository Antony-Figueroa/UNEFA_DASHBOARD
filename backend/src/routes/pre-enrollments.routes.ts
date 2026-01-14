import { Router } from 'express';
import * as preEnrollmentsController from '../controllers/pre-enrollments.controller.js';

const router = Router();

router.get('/', preEnrollmentsController.getPreEnrollments);
router.post('/', preEnrollmentsController.createPreEnrollment);
router.put('/:id', preEnrollmentsController.updatePreEnrollment);
router.delete('/:id', preEnrollmentsController.deletePreEnrollment);

export default router;
