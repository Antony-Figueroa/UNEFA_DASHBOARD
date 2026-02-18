import { Router } from 'express';
import {
  getConfig,
  updateConfig,
  clearOldLogs,
  getSystemHealth
} from '../controllers/config.controller.js';

const router = Router();

router.get('/', getConfig);
router.put('/', updateConfig);
router.post('/clear-logs', clearOldLogs);
router.get('/health', getSystemHealth);

export default router;
