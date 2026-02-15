import { Router } from 'express';
import { executeAIQuery } from '../controllers/ai.controller.js';
import { authenticateAI } from '../middlewares/ai-auth.middleware.js';
import { rateLimit } from '../middlewares/rate-limit.middleware.js';

const router = Router();

// Apply AI authentication to all routes in this router
router.use(authenticateAI);

// Rate limit: 60 requests per minute
router.post('/query', rateLimit(60, 60 * 1000), executeAIQuery);

export default router;
