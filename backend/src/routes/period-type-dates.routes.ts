import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getAllByPeriod,
  getById,
  upsertTypeDate,
  updateTypeDate,
  deleteTypeDate,
} from '../controllers/period-type-dates.controller.js';

const router = Router();

router.get('/', requirePermission('periods:view'), getAllByPeriod);
router.get('/:id', requirePermission('periods:view'), getById);
router.post('/', requirePermission('periods:edit'), upsertTypeDate);
router.put('/:id', requirePermission('periods:edit'), updateTypeDate);
router.delete('/:id', requirePermission('periods:edit'), deleteTypeDate);

export default router;
