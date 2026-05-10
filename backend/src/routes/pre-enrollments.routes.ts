import { Router } from 'express';
import * as preEnrollmentsController from '../controllers/pre-enrollments.controller.js';

const router = Router();

router.get('/', preEnrollmentsController.getPreEnrollments);
router.get('/types-by-student', preEnrollmentsController.getTypesByStudent);
router.post('/', preEnrollmentsController.createPreEnrollment);
router.put('/:id', preEnrollmentsController.updatePreEnrollment);
router.delete('/:id', preEnrollmentsController.deletePreEnrollment);

export default router;
