import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as activityLogsController from '../controllers/activity-logs.controller.js';

const router = Router();

router.get('/', requirePermission('activity-logs:view'), activityLogsController.getActivityLogs);
router.get('/stats', requirePermission('activity-logs:view'), activityLogsController.getActivityStats);
router.get('/:id', requirePermission('activity-logs:view'), activityLogsController.getActivityLogById);
router.post('/', requirePermission('activity-logs:create'), activityLogsController.createActivityLog);
router.put('/:id', requirePermission('activity-logs:view'), activityLogsController.updateActivityLog);
router.delete('/:id', requirePermission('activity-logs:view'), activityLogsController.deleteActivityLog);
router.post('/:id/approve', requirePermission('culmination:approve'), activityLogsController.approveActivityLog);

export default router;
