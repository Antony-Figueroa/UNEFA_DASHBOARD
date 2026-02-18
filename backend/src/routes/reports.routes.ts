import { Router } from 'express';
import {
  getReportsStats,
  getStudentsByCareer,
  getEnrollmentsByPeriod,
  getRecentReports,
  generateReport
} from '../controllers/reports.controller.js';

const router = Router();

router.get('/stats', getReportsStats);
router.get('/students-by-career', getStudentsByCareer);
router.get('/enrollments-by-period', getEnrollmentsByPeriod);
router.get('/recent', getRecentReports);
router.post('/generate', generateReport);

export default router;
