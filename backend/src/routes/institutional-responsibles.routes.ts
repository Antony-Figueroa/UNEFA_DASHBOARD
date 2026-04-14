import { Router } from 'express';
import { 
  getInstitutionalResponsibles, 
  getInstitutionalResponsibleByCi,
  checkIdAvailability,
  createInstitutionalResponsible, 
  updateInstitutionalResponsible, 
  deleteInstitutionalResponsible, 
  toggleInstitutionalResponsibleStatus 
} from '../controllers/institutional-responsibles.controller.js';

const router = Router();

router.get('/', getInstitutionalResponsibles);
router.get('/by-ci/:ci', getInstitutionalResponsibleByCi);
router.get('/check-availability', checkIdAvailability);
router.post('/', createInstitutionalResponsible);
router.put('/:id', updateInstitutionalResponsible);
router.delete('/:id', deleteInstitutionalResponsible);
router.patch('/:id/status', toggleInstitutionalResponsibleStatus);

export default router;
