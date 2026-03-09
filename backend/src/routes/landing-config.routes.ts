import { Router } from 'express';
import * as landingConfigController from '../controllers/landing-config.controller.js';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', landingConfigController.getLandingConfig);

router.put('/', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateLandingConfig);

router.put('/hero', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateHeroConfig);

router.put('/mission-vision', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateMissionVisionConfig);

router.put('/careers', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateCareersConfig);

router.put('/faqs', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateFAQsConfig);

router.put('/process-steps', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateProcessStepsConfig);

router.put('/graduate-stats', authenticateToken, authorizeRole([ROLES.ADMIN]), landingConfigController.updateGraduateStatsConfig);

export default router;