import { Router } from 'express';
import { 
  getInstitutions, 
  getInstitutionById, 
  createInstitution, 
  updateInstitution, 
  deleteInstitution,
  toggleInstitutionStatus,
  getInstitutionStats
} from '../controllers/institutions.controller.js';

const router = Router();

router.get('/', getInstitutions);
router.get('/stats', getInstitutionStats);
router.get('/:id', getInstitutionById);
router.post('/', createInstitution);
router.put('/:id', updateInstitution);
router.patch('/:id/status', toggleInstitutionStatus);
router.delete('/:id', deleteInstitution);

export default router;
