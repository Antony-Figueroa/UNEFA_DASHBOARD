import { Router } from 'express';
import { 
  getInstitutions, 
  getInstitutionById, 
  getInstitutionByRif,
  createInstitution, 
  updateInstitution, 
  deleteInstitution,
  toggleInstitutionStatus,
  getInstitutionStats,
  getInstitutionCareers,
  updateInstitutionCareers
} from '../controllers/institutions.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, requirePermission('institutions:view'), getInstitutions);
router.get('/stats', authenticateToken, requirePermission('institutions:view'), getInstitutionStats);
router.get('/by-rif/:rif', getInstitutionByRif);
router.get('/:id', authenticateToken, requirePermission('institutions:view'), getInstitutionById);
router.get('/:id/careers', authenticateToken, requirePermission('institutions:view'), getInstitutionCareers);
router.post('/', authenticateToken, requirePermission('institutions:create'), createInstitution);
router.put('/:id', authenticateToken, requirePermission('institutions:edit'), updateInstitution);
router.patch('/:id/status', authenticateToken, requirePermission('institutions:edit'), toggleInstitutionStatus);
router.put('/:id/careers', authenticateToken, requirePermission('institutions:edit'), updateInstitutionCareers);
router.delete('/:id', authenticateToken, requirePermission('institutions:delete'), deleteInstitution);

export default router;
