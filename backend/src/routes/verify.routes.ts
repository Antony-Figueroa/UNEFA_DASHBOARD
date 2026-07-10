import { Router } from 'express';
import { createVerification, getVerification } from '../controllers/verify.controller.js';

const router = Router();

router.post('/', createVerification);
router.get('/:hash', getVerification);

export default router;
