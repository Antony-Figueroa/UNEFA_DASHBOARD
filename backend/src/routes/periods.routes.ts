import { Router } from 'express';
import { 
  getPeriods, 
  getPeriodById, 
  createPeriod, 
  updatePeriod, 
  deletePeriod 
} from '../controllers/periods.controller';

const router = Router();

router.get('/', getPeriods);
router.get('/:id', getPeriodById);
router.post('/', createPeriod);
router.put('/:id', updatePeriod);
router.delete('/:id', deletePeriod);

export default router;
