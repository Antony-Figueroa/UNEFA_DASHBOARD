import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import {
  getProyeccionByPeriod,
  upsertProyeccion,
  batchUpsertProyeccion,
  getProyeccionStructure
} from '../controllers/proyeccion.controller.js';

const router = Router();

router.get('/', requirePermission('proyeccion:view'), getProyeccionByPeriod);
router.get('/structure', requirePermission('proyeccion:view'), getProyeccionStructure);
router.post('/', requirePermission('proyeccion:edit'), upsertProyeccion);
router.put('/batch', requirePermission('proyeccion:edit'), batchUpsertProyeccion);

export default router;
