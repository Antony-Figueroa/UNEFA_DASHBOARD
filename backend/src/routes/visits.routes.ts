import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { validateCreateVisitPeriod, validateUpdateVisitPeriod } from '../middlewares/period-validator.middleware.js';
import {
  getVisitsByPractice,
  getAllVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
  restoreVisit,
  getVisitStats,
  getVisitsCountByTutor
} from '../controllers/visits.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(requirePermission('tracking:*'));

router.get('/practice/:practiceId', getVisitsByPractice);
router.get('/stats', getVisitStats);
router.get('/count-by-tutor', getVisitsCountByTutor);
router.get('/', getAllVisits);
router.get('/:id', getVisitById);
router.post('/', validateCreateVisitPeriod, createVisit);
router.put('/:id', validateUpdateVisitPeriod, updateVisit);
router.delete('/:id', deleteVisit);
router.patch('/:id/restore', restoreVisit);

export default router;
