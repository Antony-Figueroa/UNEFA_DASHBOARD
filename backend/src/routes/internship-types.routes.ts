import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { 
  getAllInternshipTypes, 
  getInternshipTypesByCareer,
  createInternshipType,
  updateInternshipType,
  deleteInternshipType,
  toggleInternshipTypeStatus,
  bulkDeleteInternshipTypes,
  bulkRestoreInternshipTypes
} from '../controllers/internship-types.controller.js';

const router = Router();

router.get('/', requirePermission('internship-types:view'), getAllInternshipTypes);
router.get('/career/:careerId', requirePermission('internship-types:view'), getInternshipTypesByCareer);
router.post('/', requirePermission('internship-types:edit'), createInternshipType);
router.put('/:id', requirePermission('internship-types:edit'), updateInternshipType);
router.delete('/:id', requirePermission('internship-types:edit'), deleteInternshipType);
router.patch('/:id/toggle-status', requirePermission('internship-types:edit'), toggleInternshipTypeStatus);
router.post('/bulk-delete', requirePermission('internship-types:edit'), bulkDeleteInternshipTypes);
router.post('/bulk-restore', requirePermission('internship-types:edit'), bulkRestoreInternshipTypes);

export default router;
