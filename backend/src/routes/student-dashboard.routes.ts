import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';
import {
  getStudentDashboard,
  getStudentProfile,
  getRequestTypes,
  getStudentRequests,
  getStudentTracking,
  createStudentRequest
} from '../controllers/student-dashboard.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([ROLES.ESTUDIANTE]));

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.get('/request-types', getRequestTypes);
router.get('/tracking', getStudentTracking);
router.get('/requests', getStudentRequests);
router.post('/requests', createStudentRequest);

export default router;
