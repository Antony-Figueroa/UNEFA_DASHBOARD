import { Router } from 'express';
import { 
  getCareers, 
  getCareersByInternshipType,
  getCareerById, 
  createCareer, 
  updateCareer, 
  deleteCareer,
  toggleCareerStatus,
  bulkDeleteCareers,
  bulkRestoreCareers 
} from '../controllers/careers.controller.js';

const router = Router();

router.get('/', getCareers);
router.get('/by-type/:typeId', getCareersByInternshipType);
router.get('/:id', getCareerById);
router.post('/', createCareer);
router.put('/:id', updateCareer);
router.patch('/:id/status', toggleCareerStatus);
router.delete('/:id', deleteCareer);
router.post('/bulk-delete', bulkDeleteCareers);
router.post('/bulk-restore', bulkRestoreCareers);

export default router;
