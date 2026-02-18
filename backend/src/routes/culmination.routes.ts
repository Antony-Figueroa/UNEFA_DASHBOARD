import { Router } from 'express';
import {
  getCulminationRecords,
  approveCulmination,
  generateCertificate
} from '../controllers/culmination.controller.js';

const router = Router();

router.get('/', getCulminationRecords);
router.post('/:enrollmentId/approve', approveCulmination);
router.post('/:enrollmentId/certificate', generateCertificate);

export default router;
