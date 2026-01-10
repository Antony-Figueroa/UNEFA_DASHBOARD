import { Router } from 'express';
import { 
  getCareers, 
  getCareerById, 
  createCareer, 
  updateCareer, 
  deleteCareer,
  bulkDeleteCareers 
} from '../controllers/careers.controller';

const router = Router();

router.get('/', getCareers);
router.get('/:id', getCareerById);
router.post('/', createCareer);
router.put('/:id', updateCareer);
router.delete('/:id', deleteCareer);
router.post('/bulk-delete', bulkDeleteCareers);

export default router;
