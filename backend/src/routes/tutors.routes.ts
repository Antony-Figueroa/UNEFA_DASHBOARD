import { Router } from 'express';
import { 
  getTutors, 
  createTutor, 
  updateTutor, 
  deleteTutor, 
  toggleTutorStatus,
  getTutorByCi
} from '../controllers/tutors.controller.js';

const router = Router();

router.get('/', getTutors);
router.get('/by-ci/:ci', getTutorByCi);
router.post('/', createTutor);
router.patch('/:id', updateTutor);
router.delete('/:id', deleteTutor);
router.patch('/:id/status', toggleTutorStatus);

export default router;
