import { Router } from 'express';
import {
  getDefaults,
  updateDefaults,
  updateEnforceSequentialOrder,
} from '../controllers/grace-config.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/defaults', requirePermission('config:view'), getDefaults);
router.patch('/defaults', requirePermission('academic-config:edit'), updateDefaults);
router.put('/enforce-sequential', requirePermission('academic-config:edit'), updateEnforceSequentialOrder);

export default router;
