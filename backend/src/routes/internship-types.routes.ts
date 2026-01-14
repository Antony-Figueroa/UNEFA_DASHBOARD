import { Router } from 'express';
import { 
  getAllInternshipTypes, 
  getInternshipTypesByCareer 
} from '../controllers/internship-types.controller.js';

const router = Router();

router.get('/', getAllInternshipTypes);
router.get('/career/:careerId', getInternshipTypesByCareer);

export default router;
