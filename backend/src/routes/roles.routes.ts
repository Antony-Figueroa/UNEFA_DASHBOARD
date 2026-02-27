import { Router } from 'express';
import {
  getRoles,
  getPermissions,
  getRoleById,
  updateRole,
  getRoleStats,
  createRole
} from '../controllers/roles.controller.js';

const router = Router();

router.get('/', getRoles);
router.get('/permissions', getPermissions);
router.get('/stats', getRoleStats);
router.get('/:id', getRoleById);
router.post('/', createRole);
router.put('/:id', updateRole);

export default router;
