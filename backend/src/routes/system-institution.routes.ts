import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import {
  getInstitution,
  updateInstitution
} from '../controllers/system-institution.controller.js';

const router = Router();

// ponytail: branding data (logo, name) — any authenticated user can read
router.get('/', authenticateToken, getInstitution);
router.put('/', requirePermission('system-institution:edit'), updateInstitution);

export default router;
