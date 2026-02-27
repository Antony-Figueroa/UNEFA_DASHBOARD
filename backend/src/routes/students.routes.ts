import { Router } from 'express';
import { 
  getStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  toggleStudentStatus,
  checkIdAvailability,
  getStudentStats,
  getStudentByCi
} from '../controllers/students.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('students:view'), getStudents);
router.get('/stats', authenticateToken, requirePermission('students:view'), getStudentStats);
router.get('/check-availability', authenticateToken, checkIdAvailability);
router.get('/by-ci/:ci', authenticateToken, getStudentByCi);
router.get('/:id', authenticateToken, requirePermission('students:view'), getStudentById);
router.post('/', authenticateToken, requirePermission('students:create'), createStudent);
router.put('/:id', authenticateToken, requirePermission('students:edit'), updateStudent);
router.patch('/:id/status', authenticateToken, requirePermission('students:edit'), toggleStudentStatus);
router.delete('/:id', authenticateToken, requirePermission('students:delete'), deleteStudent);

export default router;
