import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getPendingWithdrawals,
  extendWithdrawal,
  reprobarWithdrawal,
  batchWithdrawalAction
} from '../controllers/justified-withdrawal.controller.js';

const router = Router();

router.get('/pending', requirePermission('enrollments:view'), getPendingWithdrawals);
router.post('/:id/extend', requirePermission('enrollments:edit'), extendWithdrawal);
router.post('/:id/reprobar', requirePermission('enrollments:edit'), reprobarWithdrawal);
router.post('/batch', requirePermission('enrollments:edit'), batchWithdrawalAction);

export default router;
