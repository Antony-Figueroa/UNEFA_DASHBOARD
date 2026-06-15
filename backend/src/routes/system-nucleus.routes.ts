import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getNuclei,
  getNucleusById,
  createNucleus,
  updateNucleus,
  deleteNucleus,
  toggleNucleusStatus,
  getNucleusCareers,
  setNucleusCareers
} from '../controllers/system-nucleus.controller.js';

const router = Router();

router.get('/', requirePermission('system-nucleus:view'), getNuclei);
router.get('/:id', requirePermission('system-nucleus:view'), getNucleusById);
router.post('/', requirePermission('system-nucleus:edit'), createNucleus);
router.put('/:id', requirePermission('system-nucleus:edit'), updateNucleus);
router.delete('/:id', requirePermission('system-nucleus:delete'), deleteNucleus);
router.patch('/:id/toggle-status', requirePermission('system-nucleus:edit'), toggleNucleusStatus);
router.get('/:id/careers', requirePermission('system-nucleus:view'), getNucleusCareers);
router.put('/:id/careers', requirePermission('system-nucleus:edit'), setNucleusCareers);

export default router;
