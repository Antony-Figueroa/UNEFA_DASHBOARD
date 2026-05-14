import { Router } from 'express';
import { 
  getTrackings, 
  createTracking, 
  updateTracking, 
  deleteTracking,
  getTrackingStats,
  getTrackingById
} from '../controllers/tracking.controller.js';

const router = Router();

router.get('/', getTrackings);
router.get('/stats', getTrackingStats);
router.get('/:id', getTrackingById);
router.post('/', createTracking);
router.put('/:id', updateTracking);
router.delete('/:id', deleteTracking);

export default router;
