import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/login', rateLimit(10, 60 * 1000), authController.login);
router.get('/login-history', authenticateToken, authController.getLoginHistory);
router.get('/all-logs', authenticateToken, authorizeRole([ROLES.ADMIN]), authController.getAllAuthLogs);
router.post('/verify-master', authenticateToken, authController.verifyMaster);
router.get('/me', authenticateToken, authController.getMe);
router.post('/refresh', authenticateToken, authController.refreshSession);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/security-questions/:userCi', authController.getSecurityQuestions);
router.get('/recovery-questions/:userCi', authController.getUserSecurityQuestions);
router.get('/preset-questions', authController.getPresetQuestions);
router.post('/verify-questions', authController.verifySecurityQuestions);
router.post('/verify-answers-reset', authController.verifySecurityAnswersAndReset);
router.post('/reset-password', authController.resetPassword);
router.post('/request-recovery', authController.requestPasswordReset);
router.post('/reset-with-token', authController.resetPasswordWithToken);
router.post('/logout', authController.logout);

export default router;
