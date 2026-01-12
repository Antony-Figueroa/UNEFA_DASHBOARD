import { Router } from 'express';
import { 
  getInstitutionalResponsibles, 
  createInstitutionalResponsible, 
  updateInstitutionalResponsible, 
  deleteInstitutionalResponsible, 
  toggleInstitutionalResponsibleStatus 
} from '../controllers/institutional-responsibles.controller';

const router = Router();

router.get('/', getInstitutionalResponsibles);
router.post('/', createInstitutionalResponsible);
router.patch('/:id', updateInstitutionalResponsible);
router.delete('/:id', deleteInstitutionalResponsible);
router.patch('/:id/status', toggleInstitutionalResponsibleStatus);

export default router;
