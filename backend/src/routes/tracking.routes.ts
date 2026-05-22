import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { 
  getTrackings, 
  createTracking, 
  updateTracking, 
  deleteTracking,
  restoreTracking,
  getTrackingStats,
  getTrackingById
} from '../controllers/tracking.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTrackings);
router.get('/stats', getTrackingStats);
router.get('/:id', getTrackingById);
router.post('/', createTracking);
router.put('/:id', updateTracking);
router.delete('/:id', deleteTracking);
router.patch('/:id/restore', restoreTracking);

export default router;
