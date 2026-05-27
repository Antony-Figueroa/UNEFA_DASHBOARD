import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/stats', requirePermission('dashboard:view'), getDashboardStats);

export default router;
