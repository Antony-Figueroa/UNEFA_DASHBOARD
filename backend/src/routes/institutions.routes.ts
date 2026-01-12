import { Router } from 'express';
import { 
  getInstitutions, 
  createInstitution, 
  updateInstitution, 
  deleteInstitution, 
  toggleInstitutionStatus 
} from '../controllers/institutions.controller';

const router = Router();

router.get('/', getInstitutions);
router.post('/', createInstitution);
router.patch('/:id', updateInstitution);
router.delete('/:id', deleteInstitution);
router.patch('/:id/status', toggleInstitutionStatus);

export default router;
