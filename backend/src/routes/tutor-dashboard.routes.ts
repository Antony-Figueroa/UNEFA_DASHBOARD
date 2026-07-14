import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';
import {
  getTutorDashboard,
  getTutorStudents,
  updateStudentGrade,
  getTutorProfile,
  getTutorPractice,
  createTutorVisit,
  getTutorVisitsByPractice
} from '../controllers/tutor-dashboard.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([ROLES.TUTOR]));

router.get('/dashboard', getTutorDashboard);
router.get('/students', getTutorStudents);
router.get('/practice/:practiceId', getTutorPractice);
router.put('/grades/:enrollmentId', updateStudentGrade);
router.get('/profile', getTutorProfile);

// Visitas — solo sobre estudiantes asignados al tutor
router.post('/visits', createTutorVisit);
router.get('/visits/practice/:practiceId', getTutorVisitsByPractice);

export default router;
