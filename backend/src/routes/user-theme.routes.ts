import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { getUserTheme, updateUserTheme } from '../controllers/user-theme.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserTheme);
router.put('/', updateUserTheme);

export default router;
