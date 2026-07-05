import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';
import {
  getTutorDashboard,
  getTutorStudents,
  getTutorTracking,
  updateStudentGrade,
  getTutorReports,
  getTutorProfile,
  getTutorPractice,
  getTutorActivityLogs,
  createTutorVisit,
  getTutorVisitsByPractice,
  createTutorActivityLog,
  getTutorActivityLogsByPractice
} from '../controllers/tutor-dashboard.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([ROLES.TUTOR]));

router.get('/dashboard', getTutorDashboard);
router.get('/students', getTutorStudents);
router.get('/tracking', getTutorTracking);
router.get('/practice/:practiceId', getTutorPractice);
router.put('/grades/:enrollmentId', updateStudentGrade);
router.get('/reports', getTutorReports);
router.get('/profile', getTutorProfile);
router.get('/activity-logs', getTutorActivityLogs);

// Visitas — solo sobre estudiantes asignados al tutor
router.post('/visits', createTutorVisit);
router.get('/visits/practice/:practiceId', getTutorVisitsByPractice);

// Activity logs — solo sobre estudiantes asignados al tutor
router.post('/activity-logs', createTutorActivityLog);
router.get('/activity-logs/practice/:practiceId', getTutorActivityLogsByPractice);

export default router;
