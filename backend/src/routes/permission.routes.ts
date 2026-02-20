import { Router } from 'express';
import { 
  getAllPermissions, 
  getRolePermissions, 
  updateRolePermissions,
  checkPermission,
  getMyPermissions
} from '../controllers/permission.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/my', getMyPermissions);
router.get('/check/:permission', checkPermission);
router.get('/', requirePermission('users:view'), getAllPermissions);
router.get('/role/:roleId', requirePermission('users:view'), getRolePermissions);
router.put('/role/:roleId', requirePermission('users:edit'), updateRolePermissions);

export default router;
