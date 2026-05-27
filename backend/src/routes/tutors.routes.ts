import { Router } from 'express';
import { 
  getTutors, 
  createTutor, 
  updateTutor, 
  deleteTutor, 
  toggleTutorStatus,
  getTutorByCi
} from '../controllers/tutors.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requirePermission('tutors:view'), getTutors);
router.get('/by-ci/:ci', requirePermission('tutors:view'), getTutorByCi);
router.post('/', requirePermission('tutors:create'), createTutor);
router.put('/:id', requirePermission('tutors:edit'), updateTutor);
router.delete('/:id', requirePermission('tutors:delete'), deleteTutor);
router.patch('/:id/status', requirePermission('tutors:edit'), toggleTutorStatus);

export default router;
