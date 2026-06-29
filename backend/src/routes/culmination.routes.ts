import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getCulminationRecords,
  approveCulmination,
  generateCertificate,
  reverseCulmination
} from '../controllers/culmination.controller.js';

const router = Router();

router.get('/', requirePermission('practices:view'), getCulminationRecords);
router.post('/:practiceId/approve', requirePermission('culmination:approve'), approveCulmination);
router.post('/:practiceId/certificate', requirePermission('practices:view'), generateCertificate);
router.post('/:practiceId/reverse', requirePermission('culmination:approve'), reverseCulmination);

export default router;
