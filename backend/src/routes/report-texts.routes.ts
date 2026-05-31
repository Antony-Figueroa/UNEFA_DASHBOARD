import { Router } from 'express';
import {
  getAllTexts,
  getTextByTypeAndSection,
  updateText,
  createText,
} from '../controllers/report-texts.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requirePermission('reports:view'), getAllTexts);
router.get('/:reportType/:section', requirePermission('reports:view'), getTextByTypeAndSection);
router.put('/:reportType/:section', requirePermission('reports:edit'), updateText);
router.post('/', requirePermission('reports:edit'), createText);

export default router;
