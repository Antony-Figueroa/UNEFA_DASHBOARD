import { Router } from 'express';
import multer from 'multer';
import {
  executeAIQuery,
  chatWithAI,
  chatWithAINoStream, // Nuevo endpoint sin streaming
  getSessions,
  getSession, // Nueva función para obtener una sesión
  createSession,
  updateSession,
  deleteSession,
  getAIConfig, // Endpoint de métricas
  clearAICache, // Endpoint para limpiar caché
  analyzeFileUpload, // Endpoint para analizar archivos
  getChatConfig, // Get config from DB
  saveChatConfig, // Save config to DB
} from '../controllers/ai.controller.js';
import { authenticateAI } from '../middlewares/ai-auth.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rate-limit.middleware.js';

const router = Router();

// Configuración de multer para uploads de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// ============================================
// ENDPOINT PRINCIPAL CON STREAMING (SSE)
// ============================================
router.post('/chat', authenticateToken, rateLimit(30, 60 * 1000), chatWithAI);

// ============================================
// ENDPOINT ALTERNATIVO SIN STREAMING (más compatible)
// ============================================
router.post('/chat-no-stream', authenticateToken, rateLimit(30, 60 * 1000), chatWithAINoStream);

// ============================================
// SESIONES DE CHAT
// ============================================
router.get('/sessions', authenticateToken, getSessions);
router.get('/sessions/:id', authenticateToken, getSession);
router.post('/sessions', authenticateToken, createSession);
router.put('/sessions/:id', authenticateToken, updateSession);
router.delete('/sessions/:id', authenticateToken, deleteSession);

// ============================================
// ENDPOINT DE CONSULTA (AI Query)
// ============================================
router.post('/query', authenticateAI, rateLimit(60, 60 * 1000), executeAIQuery);

// ============================================
// ENDPOINTS DE MÉTRICAS Y CONFIGURACIÓN
// ============================================
router.get('/config', authenticateToken, getAIConfig);
router.post('/cache/clear', authenticateToken, clearAICache);

// ============================================
// ENDPOINT DE ANÁLISIS DE ARCHIVOS (Vision)
// ============================================
router.post('/analyze', authenticateToken, rateLimit(10, 60 * 1000), upload.single('file'), analyzeFileUpload);

// ============================================
// ENDPOINTS DE CONFIGURACIÓN DEL CHAT (DB)
// ============================================
router.get('/chat-config', authenticateToken, getChatConfig);
router.post('/chat-config', authenticateToken, saveChatConfig);

export default router;
