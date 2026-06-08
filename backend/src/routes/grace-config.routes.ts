import { Router } from 'express';
import {
  getDefaults,
  updateDefaults,
} from '../controllers/grace-config.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/defaults', requirePermission('config:view'), getDefaults);
router.patch('/defaults', requirePermission('academic-config:edit'), updateDefaults);

export default router;
