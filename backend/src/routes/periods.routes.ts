import { Router } from 'express';
import { 
  getPeriods, 
  getPeriodById, 
  createPeriod, 
  updatePeriod, 
  deletePeriod,
  getCurrentPeriod,
  bulkDeletePeriods,
  bulkRestorePeriods,
  togglePeriodStatus
} from '../controllers/periods.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Las rutas específicas DEBEN ir antes de /:id para evitar que Express
// interprete "current", "bulk-delete", "bulk-restore" como un ID
router.get('/', requirePermission('periods:view'), getPeriods);
router.get('/current', requirePermission('periods:view'), getCurrentPeriod);
router.post('/bulk-delete', requirePermission('periods:delete'), bulkDeletePeriods);
router.post('/bulk-restore', requirePermission('periods:edit'), bulkRestorePeriods);
router.get('/:id', requirePermission('periods:view'), getPeriodById);
router.post('/', requirePermission('periods:create'), createPeriod);
router.put('/:id', requirePermission('periods:edit'), updatePeriod);
router.patch('/:id/toggle-status', requirePermission('periods:edit'), togglePeriodStatus);
router.delete('/:id', requirePermission('periods:delete'), deletePeriod);

export default router;
