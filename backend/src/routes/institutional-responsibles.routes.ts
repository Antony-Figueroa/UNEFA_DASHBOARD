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
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('institutions:view'), getInstitutionalResponsibles);
router.get('/by-ci/:ci', requirePermission('institutions:view'), getInstitutionalResponsibleByCi);
router.get('/check-availability', requirePermission('institutions:view'), checkIdAvailability);
router.post('/', requirePermission('institutions:create'), createInstitutionalResponsible);
router.put('/:id', requirePermission('institutions:edit'), updateInstitutionalResponsible);
router.delete('/:id', requirePermission('institutions:delete'), deleteInstitutionalResponsible);
router.patch('/:id/status', requirePermission('institutions:edit'), toggleInstitutionalResponsibleStatus);

export default router;
