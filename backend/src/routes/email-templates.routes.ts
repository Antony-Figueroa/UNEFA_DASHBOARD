import { Router, Request, Response } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { emailTemplatesService, CreateEmailTemplate, UpdateEmailTemplate } from '../services/email-templates.service.js';

const router = Router();

// Todas las rutas requieren autenticación + permiso de notificaciones
router.use(authenticateToken);
router.use(requirePermission('notifications:send'));

// ---------------------------------------------------------------------------
// GET /api/email-templates
// ---------------------------------------------------------------------------
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await emailTemplatesService.getAll();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('[EmailTemplates] Error listing:', error);
    res.status(500).json({ success: false, error: 'Error al obtener plantillas' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/email-templates/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const template = await emailTemplatesService.getById(id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('[EmailTemplates] Error getting template:', error);
    res.status(500).json({ success: false, error: 'Error al obtener plantilla' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/email-templates
// ---------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateEmailTemplate = req.body;

    if (!input.name || input.name.trim().length < 3) {
      res.status(400).json({ success: false, error: 'El nombre debe tener al menos 3 caracteres' });
      return;
    }
    if (!input.subject || input.subject.trim().length < 3) {
      res.status(400).json({ success: false, error: 'El asunto debe tener al menos 3 caracteres' });
      return;
    }
    if (!input.body_html || input.body_html.trim().length < 10) {
      res.status(400).json({ success: false, error: 'El cuerpo debe tener al menos 10 caracteres' });
      return;
    }

    const template = await emailTemplatesService.create({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category || 'general',
      subject: input.subject.trim(),
      body_html: input.body_html.trim(),
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('[EmailTemplates] Error creating template:', error);
    res.status(500).json({ success: false, error: 'Error al crear plantilla' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/email-templates/:id
// ---------------------------------------------------------------------------
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const updates: UpdateEmailTemplate = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.description !== undefined) updates.description = req.body.description?.trim() || null;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.subject !== undefined) updates.subject = req.body.subject.trim();
    if (req.body.body_html !== undefined) updates.body_html = req.body.body_html.trim();

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
      return;
    }

    const template = await emailTemplatesService.update(id, updates);
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('[EmailTemplates] Error updating template:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar plantilla' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/email-templates/:id
// ---------------------------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    await emailTemplatesService.remove(id);
    res.json({ success: true, message: 'Plantilla eliminada' });
  } catch (error) {
    console.error('[EmailTemplates] Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar plantilla' });
  }
});

export default router;
