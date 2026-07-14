/**
 * @file unefa-banner.routes.ts
 * @description Rutas para el banner scrapeado del portal UNEFA
 */

import { Router } from 'express';
import * as unefaBannerController from '../controllers/unefa-banner.controller.js';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/', unefaBannerController.getBannerInfo);
router.get('/image', unefaBannerController.getBannerImage);
router.get('/carousel', unefaBannerController.getCarousel);

// Ruta protegida (solo admin) para forzar actualización
router.post('/refresh', authenticateToken, authorizeRole([ROLES.ADMIN]), unefaBannerController.refreshBanner);

export default router;
