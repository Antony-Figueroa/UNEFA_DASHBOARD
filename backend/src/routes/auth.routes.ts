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
router.post('/refresh', rateLimit(5, 60 * 1000), authenticateToken, authController.refreshSession);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/security-questions/:userCi', rateLimit(10, 60 * 1000), authController.getSecurityQuestions);
router.get('/recovery-questions/:userCi', rateLimit(10, 60 * 1000), authController.getUserSecurityQuestions);
router.get('/preset-questions', rateLimit(20, 60 * 1000), authController.getPresetQuestions);
router.post('/verify-questions', rateLimit(5, 60 * 1000), authController.verifySecurityQuestions);
router.post('/verify-answers-reset', rateLimit(5, 15 * 60 * 1000), authController.verifySecurityAnswersAndReset);
router.post('/reset-password', rateLimit(5, 60 * 1000), authController.resetPassword);
router.post('/request-recovery', rateLimit(3, 60 * 1000), authController.requestPasswordReset);
router.post('/reset-with-token', rateLimit(5, 60 * 1000), authController.resetPasswordWithToken);
router.get('/password-policy', rateLimit(10, 60 * 1000), authController.getPasswordPolicy);
router.post('/logout', authenticateToken, authController.logout);

router.post('/avatar', authenticateToken, authController.uploadAvatar);
router.delete('/avatar', authenticateToken, authController.deleteAvatar);
router.get('/sessions', authenticateToken, authController.getActiveSessions);
router.delete('/sessions/:id', authenticateToken, authController.terminateSession);
router.post('/deactivate', authenticateToken, authController.deactivateAccount);
router.get('/notification-preferences', authenticateToken, authController.getNotificationPrefs);
router.put('/notification-preferences', authenticateToken, authController.saveNotificationPrefs);
router.put('/locale', authenticateToken, authController.updateLocale);

export default router;
