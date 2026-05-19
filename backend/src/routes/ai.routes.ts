import { Router } from 'express';
import {
  executeAIQuery,
  chatWithAI,
  chatWithAINoStream, // Nuevo endpoint sin streaming
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getAIConfig, // Endpoint de métricas
  clearAICache, // Endpoint para limpiar caché
} from '../controllers/ai.controller.js';
import { authenticateAI } from '../middlewares/ai-auth.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rate-limit.middleware.js';

const router = Router();

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

export default router;
