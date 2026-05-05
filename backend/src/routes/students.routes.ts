import { Router } from 'express';
import multer from 'multer';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleStudentStatus,
  checkIdAvailability,
  getStudentStats,
  getStudentByCi,
  changeStudentRegistration,
  importStudents,
  exportStudents,
  searchStudentForEnrollment
} from '../controllers/students.controller.js';
import { validateImport, executeImport, getTemplate } from '../controllers/students-import.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Configuración de multer para uploads de Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

router.get('/', authenticateToken, requirePermission('students:view'), getStudents);
router.get('/stats', authenticateToken, requirePermission('students:view'), getStudentStats);
router.get('/check-availability', authenticateToken, checkIdAvailability);
router.get('/by-ci/:ci', authenticateToken, getStudentByCi);
router.get('/search', authenticateToken, searchStudentForEnrollment);
router.get('/export', authenticateToken, requirePermission('students:view'), exportStudents);
router.get('/import/template', authenticateToken, requirePermission('students:create'), getTemplate);
router.get('/:id', authenticateToken, requirePermission('students:view'), getStudentById);
router.post('/', authenticateToken, requirePermission('students:create'), createStudent);
router.post('/import', authenticateToken, requirePermission('students:create'), importStudents);
router.post('/import/validate', authenticateToken, requirePermission('students:create'), upload.single('file'), validateImport);
router.post('/import/execute', authenticateToken, requirePermission('students:create'), upload.single('file'), executeImport);
router.put('/:id', authenticateToken, requirePermission('students:edit'), updateStudent);
router.patch('/:id/status', authenticateToken, requirePermission('students:edit'), toggleStudentStatus);
router.patch('/:id/change-registration', authenticateToken, requirePermission('students:edit'), changeStudentRegistration);
router.delete('/:id', authenticateToken, requirePermission('students:delete'), deleteStudent);

export default router;
