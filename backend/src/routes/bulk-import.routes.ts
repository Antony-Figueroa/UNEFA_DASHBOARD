import { Router } from 'express';
import multer from 'multer';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { getTemplate, previewImport, executeImport } from '../controllers/bulk-import.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

router.get('/template/:type', requirePermission('config:view'), getTemplate);
router.post('/preview', requirePermission('config:view'), upload.single('file'), previewImport);
router.post('/execute', requirePermission('config:view'), executeImport);

export default router;
