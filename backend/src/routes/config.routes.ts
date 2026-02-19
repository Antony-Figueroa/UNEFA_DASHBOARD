import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getConfig,
  updateConfig,
  clearOldLogs,
  getSystemHealth,
  syncData
} from '../controllers/config.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getConfig);
router.put('/', updateConfig);
router.post('/clear-logs', clearOldLogs);
router.get('/health', getSystemHealth);
router.post('/sync', syncData);

export default router;
