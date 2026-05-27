import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getRoles,
  getPermissions,
  getRoleById,
  updateRole,
  getRoleStats,
  createRole
} from '../controllers/roles.controller.js';

const router = Router();

router.get('/', requirePermission('roles:manage'), getRoles);
router.get('/permissions', requirePermission('roles:manage'), getPermissions);
router.get('/stats', requirePermission('roles:manage'), getRoleStats);
router.get('/:id', requirePermission('roles:manage'), getRoleById);
router.post('/', requirePermission('roles:manage'), createRole);
router.put('/:id', requirePermission('roles:manage'), updateRole);

export default router;
