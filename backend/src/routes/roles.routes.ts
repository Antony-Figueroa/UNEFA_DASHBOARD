import { Router } from 'express';
import {
  getRoles,
  getPermissions,
  getRoleById,
  updateRole,
  getRoleStats
} from '../controllers/roles.controller.js';

const router = Router();

router.get('/', getRoles);
router.get('/permissions', getPermissions);
router.get('/stats', getRoleStats);
router.get('/:id', getRoleById);
router.put('/:id', updateRole);

export default router;
