import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getInstitution,
  updateInstitution
} from '../controllers/system-institution.controller.js';

const router = Router();

router.get('/', requirePermission('system-institution:view'), getInstitution);
router.put('/', requirePermission('system-institution:edit'), updateInstitution);

export default router;
