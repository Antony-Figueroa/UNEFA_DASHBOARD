import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import {
  getPersons,
  getPersonById,
  searchPersons,
  getPersonByCi,
  createPerson,
  updatePerson,
  togglePersonStatus,
  checkCiAvailability,
  checkEmailAvailability,
} from '../controllers/persons.controller.js';

const router = Router();

router.get('/search', authenticateToken, searchPersons);
router.get('/check-ci', authenticateToken, checkCiAvailability);
router.get('/check-email', authenticateToken, checkEmailAvailability);
router.get('/by-ci/:ci', authenticateToken, getPersonByCi);
router.get('/', authenticateToken, requirePermission('persons:view'), getPersons);
router.get('/:id', authenticateToken, requirePermission('persons:view'), getPersonById);
router.post('/', authenticateToken, requirePermission('persons:create'), createPerson);
router.put('/:id', authenticateToken, requirePermission('persons:edit'), updatePerson);
router.patch('/:id/status', authenticateToken, requirePermission('persons:edit'), togglePersonStatus);

export default router;
