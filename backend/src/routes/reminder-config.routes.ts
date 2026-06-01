import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { reminderConfigController } from '../controllers/reminder-config.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', reminderConfigController.getAll);
router.post('/', reminderConfigController.create);
router.put('/:id', reminderConfigController.update);
router.patch('/:id/toggle', reminderConfigController.toggle);
router.delete('/:id', reminderConfigController.remove);

export default router;
