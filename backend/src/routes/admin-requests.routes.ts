import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES, restrictAsistente, requirePermission } from '../middlewares/auth.middleware.js';
import {
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  getRequestTypes
} from '../controllers/admin-requests.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([ROLES.ADMIN, ROLES.ASISTENTE]));

router.get('/types', requirePermission('requests:view'), getRequestTypes);
router.get('/', requirePermission('requests:view'), getAllRequests);
router.get('/:id', requirePermission('requests:view'), getRequestById);
router.put('/:id', requirePermission('requests:approve'), restrictAsistente, updateRequestStatus);

export default router;
