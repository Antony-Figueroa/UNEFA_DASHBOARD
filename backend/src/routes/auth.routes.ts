import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/verify-master', authenticateToken, authController.verifyMaster);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.get('/security-questions/:userCi', authController.getSecurityQuestions);
router.get('/preset-questions', authController.getPresetQuestions);
router.post('/verify-questions', authController.verifySecurityQuestions);
router.post('/reset-password', authController.resetPassword);
router.post('/request-recovery', authController.requestPasswordReset);
router.post('/reset-with-token', authController.resetPasswordWithToken);
router.post('/logout', authController.logout);

export default router;
