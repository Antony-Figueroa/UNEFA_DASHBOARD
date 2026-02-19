import { Router } from 'express';
import * as activityLogsController from '../controllers/activity-logs.controller.js';

const router = Router();

router.get('/', activityLogsController.getActivityLogs);
router.get('/stats', activityLogsController.getActivityStats);
router.get('/:id', activityLogsController.getActivityLogById);
router.post('/', activityLogsController.createActivityLog);
router.put('/:id', activityLogsController.updateActivityLog);
router.delete('/:id', activityLogsController.deleteActivityLog);
router.post('/:id/approve', activityLogsController.approveActivityLog);

export default router;
