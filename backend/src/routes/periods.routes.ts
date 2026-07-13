import { Router } from 'express';
import { 
  getPeriods, 
  getPeriodById, 
  createPeriod, 
  updatePeriod, 
  deletePeriod,
  getNextPendingPeriod,
  bulkDeletePeriods,
  bulkRestorePeriods,
  togglePeriodStatus,
  closePeriod
} from '../controllers/periods.controller.js';
import { getPendingPractices, closePeriodWithDecisions } from '../controllers/period-closure.controller.js';
import { getTimeoutPreview, executeTimeoutCheck } from '../controllers/pre-enrollment-timeout.controller.js';
import { updatePeriodGraceConfig } from '../controllers/grace-config.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Las rutas específicas DEBEN ir antes de /:id para evitar que Express
// interprete "current", "bulk-delete", "bulk-restore" como un ID
router.get('/', requirePermission('periods:view'), getPeriods);
router.get('/next-pending', requirePermission('periods:view'), getNextPendingPeriod);
router.post('/bulk-delete', requirePermission('periods:delete'), bulkDeletePeriods);
router.post('/bulk-restore', requirePermission('periods:edit'), bulkRestorePeriods);
router.get('/timeout-preview', requirePermission('periods:view'), getTimeoutPreview);
router.post('/check-timeouts', requirePermission('periods:edit'), executeTimeoutCheck);
router.patch('/:id/grace-config', requirePermission('academic-config:edit'), updatePeriodGraceConfig);
router.get('/:id', requirePermission('periods:view'), getPeriodById);
router.get('/:id/pending-practices', requirePermission('periods:view'), getPendingPractices);
router.post('/', requirePermission('periods:create'), createPeriod);
router.put('/:id', requirePermission('periods:edit'), updatePeriod);
router.post('/:id/close', requirePermission('periods:close'), closePeriodWithDecisions);
router.patch('/:id/toggle-status', requirePermission('periods:edit'), togglePeriodStatus);
router.delete('/:id', requirePermission('periods:delete'), deletePeriod);

export default router;
