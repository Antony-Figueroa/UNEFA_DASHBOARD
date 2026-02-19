import { Router } from 'express';
import * as enrollmentsController from '../controllers/enrollments.controller.js';

const router = Router();

router.get('/practices', enrollmentsController.getPracticesForEvaluation);
router.get('/', enrollmentsController.getEnrollments);
router.post('/', enrollmentsController.createEnrollment);
router.put('/:id', enrollmentsController.updateEnrollment);
router.delete('/:id', enrollmentsController.deleteEnrollment);

export default router;
