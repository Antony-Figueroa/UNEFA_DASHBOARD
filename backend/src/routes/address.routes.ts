import { Router } from 'express';
import {
  getPersonAddresses,
  getInstitutionAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
  getAddressCoincidence,
  getAddressStats,
  getInstitutionSuggestions,
} from '../controllers/address.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/person/:personId', authenticateToken, getPersonAddresses);
router.get('/institution/:institutionId', authenticateToken, getInstitutionAddresses);
router.post('/', authenticateToken, requirePermission('institutions:edit'), createAddress);
router.put('/:id', authenticateToken, requirePermission('institutions:edit'), updateAddress);
router.delete('/:id', authenticateToken, requirePermission('institutions:edit'), deleteAddress);
router.patch('/:id/primary', authenticateToken, requirePermission('institutions:edit'), setPrimaryAddress);
router.get('/coincidence', authenticateToken, getAddressCoincidence);
router.get('/stats', authenticateToken, requirePermission('dashboard:view'), getAddressStats);
router.get('/suggestions', authenticateToken, getInstitutionSuggestions);

export default router;
