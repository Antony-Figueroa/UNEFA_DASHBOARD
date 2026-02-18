import { Router } from 'express';
import {
  executeAIQuery,
  chatWithAI,
  getSessions,
  createSession,
  updateSession,
  deleteSession
} from '../controllers/ai.controller.js';
import { authenticateAI } from '../middlewares/ai-auth.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/chat', authenticateToken, rateLimit(30, 60 * 1000), chatWithAI);

router.get('/sessions', authenticateToken, getSessions);
router.post('/sessions', authenticateToken, createSession);
router.put('/sessions/:id', authenticateToken, updateSession);
router.delete('/sessions/:id', authenticateToken, deleteSession);

router.post('/query', authenticateAI, rateLimit(60, 60 * 1000), executeAIQuery);

export default router;
