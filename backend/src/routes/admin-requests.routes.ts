import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES, restrictAsistente } from '../middlewares/auth.middleware.js';
import {
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  getRequestTypes
} from '../controllers/admin-requests.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([ROLES.ADMIN, ROLES.ASISTENTE]));

router.get('/types', getRequestTypes);
router.get('/', getAllRequests);
router.get('/:id', getRequestById);
router.put('/:id', restrictAsistente, updateRequestStatus);

export default router;
