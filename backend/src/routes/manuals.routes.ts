import { Router } from 'express';
import {
  getManuals,
  getManualById,
  createManual,
  updateManual,
  deleteManual,
  getCategories
} from '../controllers/manuals.controller.js';

const router = Router();

router.get('/', getManuals);
router.get('/categories', getCategories);
router.get('/:id', getManualById);
router.post('/', createManual);
router.put('/:id', updateManual);
router.delete('/:id', deleteManual);

export default router;
