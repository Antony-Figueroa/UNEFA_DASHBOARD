/**
 * Knowledge Base Routes — /api/knowledge-base
 *
 * CRUD + búsqueda semántica para la base de conocimiento del chat Groq.
 * Endpoints protegidos por autenticación JWT.
 */

import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
} from '../controllers/knowledge-base.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD
router.get('/', listEntries);
router.get('/:id', getEntry);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

// Búsqueda semántica
router.post('/search', searchEntries);

export default router;
