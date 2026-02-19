import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getVisitsByPractice,
  getAllVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitStats
} from '../controllers/visits.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/practice/:practiceId', getVisitsByPractice);
router.get('/stats', getVisitStats);
router.get('/', getAllVisits);
router.get('/:id', getVisitById);
router.post('/', createVisit);
router.put('/:id', updateVisit);
router.delete('/:id', deleteVisit);

export default router;
