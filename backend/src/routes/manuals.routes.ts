import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getManuals,
  getManualById,
  createManual,
  updateManual,
  deleteManual,
  getCategories
} from '../controllers/manuals.controller.js';

const router = Router();

router.get('/', requirePermission('manuals:view'), getManuals);
router.get('/categories', requirePermission('manuals:view'), getCategories);
router.get('/:id', requirePermission('manuals:view'), getManualById);
router.post('/', requirePermission('manuals:edit'), createManual);
router.put('/:id', requirePermission('manuals:edit'), updateManual);
router.delete('/:id', requirePermission('manuals:edit'), deleteManual);

export default router;
