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
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('institutions:view'), getInstitutions);
router.get('/stats', authenticateToken, requirePermission('institutions:view'), getInstitutionStats);
router.get('/:id', authenticateToken, requirePermission('institutions:view'), getInstitutionById);
router.post('/', authenticateToken, requirePermission('institutions:create'), createInstitution);
router.put('/:id', authenticateToken, requirePermission('institutions:edit'), updateInstitution);
router.patch('/:id/status', authenticateToken, requirePermission('institutions:edit'), toggleInstitutionStatus);
router.delete('/:id', authenticateToken, requirePermission('institutions:delete'), deleteInstitution);

export default router;
