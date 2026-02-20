import { Router } from 'express';
import { authenticateToken, authorizeRole, ROLES } from '../middlewares/auth.middleware.js';
import { getDocuments, getDocumentTypes, uploadDocument, deleteDocument } from '../controllers/documents.controller.js';
import multer from 'multer';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole([ROLES.ESTUDIANTE]));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

router.get('/', getDocuments);
router.get('/types', getDocumentTypes);
router.post('/', upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);

export default router;
