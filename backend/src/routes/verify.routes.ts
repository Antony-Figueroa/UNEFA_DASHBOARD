import { Router } from 'express';
import { createVerification, getVerification } from '../controllers/verify.controller.js';
import { authenticateToken, restrictAsistente } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, restrictAsistente, createVerification);
router.get('/:hash', getVerification);

export default router;
