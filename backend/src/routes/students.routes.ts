import { Router } from 'express';
import { 
  getStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  toggleStudentStatus,
  checkIdAvailability,
  getStudentStats
} from '../controllers/students.controller.js';

const router = Router();

router.get('/', getStudents);
router.get('/stats', getStudentStats);
router.get('/check-availability', checkIdAvailability);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.patch('/:id/status', toggleStudentStatus);
router.delete('/:id', deleteStudent);

export default router;
