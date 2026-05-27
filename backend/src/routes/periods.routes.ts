import { Router } from 'express';
import { 
  getPeriods, 
  getPeriodById, 
  createPeriod, 
  updatePeriod, 
  deletePeriod,
  getCurrentPeriod
} from '../controllers/periods.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requirePermission('periods:view'), getPeriods);
router.get('/current', requirePermission('periods:view'), getCurrentPeriod);
router.get('/:id', requirePermission('periods:view'), getPeriodById);
router.post('/', requirePermission('periods:create'), createPeriod);
router.put('/:id', requirePermission('periods:edit'), updatePeriod);
router.delete('/:id', requirePermission('periods:delete'), deletePeriod);

export default router;
