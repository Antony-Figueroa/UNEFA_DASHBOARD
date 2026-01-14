import { Router } from 'express';
import { 
  getStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  toggleStudentStatus
} from '../controllers/students.controller.js';

const router = Router();

router.get('/', getStudents);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.patch('/:id/status', toggleStudentStatus);

export default router;
