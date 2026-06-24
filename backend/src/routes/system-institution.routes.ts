import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import {
  getInstitution,
  updateInstitution
} from '../controllers/system-institution.controller.js';

const router = Router();

// ponytail: branding data (logo, name) — any authenticated user can read, no auth needed for GET
router.get('/', getInstitution);
router.put('/', authenticateToken, requirePermission('system-institution:edit'), updateInstitution);

export default router;
