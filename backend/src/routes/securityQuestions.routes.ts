import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getPresetQuestions,
  getUserQuestions,
  saveUserQuestions,
  verifySecurityAnswer,
  checkUserHasQuestions
} from '../controllers/securityQuestions.controller.js';

const router = Router();

router.get('/preset', getPresetQuestions);

router.get('/my', authenticateToken, getUserQuestions);

router.post('/save', authenticateToken, saveUserQuestions);

router.post('/verify', verifySecurityAnswer);

router.get('/check/:userId', checkUserHasQuestions);

export default router;
