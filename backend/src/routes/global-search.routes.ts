/**
 * @file global-search.routes.ts
 * @description Rutas para búsqueda global en el sistema
 * Busca en estudiantes, tutores, instituciones, carreras y más
 */

import { Router } from 'express';
import { globalSearch } from '../controllers/global-search.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * GET /api/search/global
 * 
 * Query params:
 * - q: Término de búsqueda
 * - types: Tipos a buscar (students,tutors,institutions,careers) - opcional, busca en todos si no se especifica
 * - limit: Límite de resultados por tipo (default: 5)
 * 
 * Respuesta:
 * {
 *   students: [{ id, name, ci, email, careerName }],
 *   tutors: [{ id, name, ci, email, department }],
 *   institutions: [{ id, name, rif, phone }],
 *   careers: [{ id, name, code }]
 * }
 */
router.get('/global', authenticateToken, globalSearch);

export default router;