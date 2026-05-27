import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import {
  getConfig,
  updateConfig,
  clearOldLogs,
  getSystemHealth,
  syncData
} from '../controllers/config.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('config:view'), getConfig);
router.put('/', requirePermission('config:edit'), updateConfig);
router.post('/clear-logs', requirePermission('config:edit'), clearOldLogs);
router.get('/health', requirePermission('config:view'), getSystemHealth);
router.post('/sync', requirePermission('config:edit'), syncData);

export default router;
