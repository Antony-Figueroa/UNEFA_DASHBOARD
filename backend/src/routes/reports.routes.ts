import { Router } from 'express';
import {
  getReportsStats,
  getStudentsByCareer,
  getEnrollmentsByPeriod,
  getRecentReports,
  generateReport,
  getTutorsAcademicReport,
  getCulminatedStudentsReport,
  getResumenPasantiasReport
} from '../controllers/reports.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/stats', requirePermission('reports:view'), getReportsStats);
router.get('/students-by-career', requirePermission('reports:view'), getStudentsByCareer);
router.get('/enrollments-by-period', requirePermission('reports:view'), getEnrollmentsByPeriod);
router.get('/recent', requirePermission('reports:view'), getRecentReports);
router.get('/tutores-academicos', requirePermission('reports:view'), getTutorsAcademicReport);
router.get('/resumen-pasantias', requirePermission('reports:view'), getResumenPasantiasReport);
router.get('/culminated-students', requirePermission('reports:view'), getCulminatedStudentsReport);
router.post('/generate', requirePermission('reports:export'), generateReport);

export default router;
