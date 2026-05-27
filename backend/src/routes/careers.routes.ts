import { Router } from 'express';
import { 
  getCareers, 
  getCareersByInternshipType,
  getCareerById, 
  getCareerByCode,
  createCareer, 
  updateCareer, 
  deleteCareer,
  toggleCareerStatus,
  bulkDeleteCareers,
  bulkRestoreCareers 
} from '../controllers/careers.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requirePermission('careers:view'), getCareers);
router.get('/by-type/:typeId', requirePermission('careers:view'), getCareersByInternshipType);
router.get('/by-code/:code', requirePermission('careers:view'), getCareerByCode);
router.get('/:id', requirePermission('careers:view'), getCareerById);
router.post('/', requirePermission('careers:create'), createCareer);
router.put('/:id', requirePermission('careers:edit'), updateCareer);
router.patch('/:id/status', requirePermission('careers:edit'), toggleCareerStatus);
router.delete('/:id', requirePermission('careers:delete'), deleteCareer);
router.post('/bulk-delete', requirePermission('careers:delete'), bulkDeleteCareers);
router.post('/bulk-restore', requirePermission('careers:edit'), bulkRestoreCareers);

export default router;
