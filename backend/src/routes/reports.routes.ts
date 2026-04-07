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

const router = Router();

router.get('/stats', getReportsStats);
router.get('/students-by-career', getStudentsByCareer);
router.get('/enrollments-by-period', getEnrollmentsByPeriod);
router.get('/recent', getRecentReports);
router.get('/tutores-academicos', getTutorsAcademicReport);
router.get('/resumen-pasantias', getResumenPasantiasReport);
router.get('/culminated-students', getCulminatedStudentsReport);
router.post('/generate', generateReport);

export default router;
