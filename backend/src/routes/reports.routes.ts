import { Router } from 'express';
import {
  getReportsStats,
  getStudentsByCareer,
  getEnrollmentsByPeriod,
  getRecentReports,
  generateReport,
  getTutorsAcademicReport
} from '../controllers/reports.controller.js';

const router = Router();

router.get('/stats', getReportsStats);
router.get('/students-by-career', getStudentsByCareer);
router.get('/enrollments-by-period', getEnrollmentsByPeriod);
router.get('/recent', getRecentReports);
router.get('/tutores-academicos', getTutorsAcademicReport);
router.post('/generate', generateReport);

export default router;
