/**
 * Knowledge Base Controller — Endpoints REST para t_knowledge_base
 *
 * CRUD + búsqueda semántica.
 * Escritura: solo admin (role 0, 1).
 * Lectura: cualquier rol autenticado (filtrado por roles del user).
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as kbService from '../services/knowledge-base.service.js';

// ============================================
// Validation Schemas
// ============================================

const createSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(500),
  category: z.enum(['regulation', 'curriculum', 'process', 'faq', 'general']),
  content: z.string().min(1, 'Contenido requerido'),
  metadata: z.record(z.unknown()).optional().default({}),
  roles: z.array(z.number()).nullable().optional().default(null),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  category: z.enum(['regulation', 'curriculum', 'process', 'faq', 'general']).optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
  roles: z.array(z.number()).nullable().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1, 'Query requerida'),
  category: z.enum(['regulation', 'curriculum', 'process', 'faq', 'general']).optional(),
  limit: z.number().int().min(1).max(50).optional().default(5),
});

const listSchema = z.object({
  category: z.enum(['regulation', 'curriculum', 'process', 'faq', 'general']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

// ============================================
// Helpers
// ============================================

function isAdmin(role: number): boolean {
  return role === 0 || role === 1;
}

// ============================================
// Controllers
// ============================================

/**
 * GET /api/knowledge-base — Listar entries
 */
export const listEntries = async (req: AuthRequest, res: Response) => {
  try {
    const params = listSchema.parse(req.query);
    const userRole = req.user?.role;
    const userRoles = userRole !== undefined ? [userRole] : undefined;

    const result = await kbService.list({
      category: params.category,
      search: params.search,
      roles: userRoles,
      page: params.page,
      limit: params.limit,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos', errors: error.flatten().fieldErrors });
    }
    console.error('[KB Controller] listEntries error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/knowledge-base/:id — Obtener entry por ID
 */
export const getEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await kbService.getById(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry no encontrado' });
    }

    res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error('[KB Controller] getEntry error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/knowledge-base — Crear entry (solo admin)
 */
export const createEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden crear entries' });
    }

    const params = createSchema.parse(req.body);
    const entry = await kbService.create(params as import('../services/knowledge-base.service.js').CreateKBEntry);

    res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.flatten().fieldErrors });
    }
    console.error('[KB Controller] createEntry error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/knowledge-base/:id — Actualizar entry (solo admin)
 */
export const updateEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden actualizar entries' });
    }

    const { id } = req.params;
    const params = updateSchema.parse(req.body);
    const entry = await kbService.update(id, params);

    res.json({ success: true, data: entry });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.flatten().fieldErrors });
    }
    console.error('[KB Controller] updateEntry error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/knowledge-base/:id — Soft delete (solo admin)
 */
export const deleteEntry = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden eliminar entries' });
    }

    const { id } = req.params;
    await kbService.softDelete(id);

    res.json({ success: true, message: 'Entry eliminado correctamente' });
  } catch (error: any) {
    console.error('[KB Controller] deleteEntry error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/knowledge-base/search — Búsqueda semántica
 */
export const searchEntries = async (req: AuthRequest, res: Response) => {
  try {
    const params = searchSchema.parse(req.body);
    const userRole = req.user?.role;
    const userRoles = userRole !== undefined ? [userRole] : undefined;

    const results = await kbService.searchSemantic({
      query: params.query,
      userRoles,
      category: params.category,
      limit: params.limit,
    });

    res.json({ success: true, data: { items: results } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos', errors: error.flatten().fieldErrors });
    }
    console.error('[KB Controller] searchEntries error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
