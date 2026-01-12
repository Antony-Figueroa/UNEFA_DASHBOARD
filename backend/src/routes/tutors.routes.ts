import { Router } from 'express';
import { 
  getTutors, 
  createTutor, 
  updateTutor, 
  deleteTutor, 
  toggleTutorStatus 
} from '../controllers/tutors.controller';

const router = Router();

router.get('/', getTutors);
router.post('/', createTutor);
router.patch('/:id', updateTutor);
router.delete('/:id', deleteTutor);
router.patch('/:id/status', toggleTutorStatus);

export default router;
