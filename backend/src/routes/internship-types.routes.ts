import { Router } from 'express';
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

router.get('/', getAllInternshipTypes);
router.get('/career/:careerId', getInternshipTypesByCareer);
router.post('/', createInternshipType);
router.put('/:id', updateInternshipType);
router.delete('/:id', deleteInternshipType);
router.patch('/:id/toggle-status', toggleInternshipTypeStatus);
router.post('/bulk-delete', bulkDeleteInternshipTypes);
router.post('/bulk-restore', bulkRestoreInternshipTypes);

export default router;
