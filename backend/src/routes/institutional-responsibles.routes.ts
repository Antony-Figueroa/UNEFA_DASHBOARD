import { Router } from 'express';
import { 
  getInstitutionalResponsibles, 
  getInstitutionalResponsibleByCi,
  createInstitutionalResponsible, 
  updateInstitutionalResponsible, 
  deleteInstitutionalResponsible, 
  toggleInstitutionalResponsibleStatus 
} from '../controllers/institutional-responsibles.controller.js';

const router = Router();

router.get('/', getInstitutionalResponsibles);
router.get('/by-ci/:ci', getInstitutionalResponsibleByCi);
router.post('/', createInstitutionalResponsible);
router.patch('/:id', updateInstitutionalResponsible);
router.delete('/:id', deleteInstitutionalResponsible);
router.patch('/:id/status', toggleInstitutionalResponsibleStatus);

export default router;
