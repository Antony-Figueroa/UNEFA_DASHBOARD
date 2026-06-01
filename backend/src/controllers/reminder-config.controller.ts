import { Request, Response } from 'express';
import { reminderConfigService } from '../services/reminder-config.service.js';

export const reminderConfigController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const rules = await reminderConfigService.getAll();
      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('[ReminderConfig] Error fetching rules:', error);
      res.status(500).json({ success: false, message: 'Error al cargar reglas' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const rules = await reminderConfigService.create(req.body);
      res.status(201).json({ success: true, data: rules });
    } catch (error) {
      console.error('[ReminderConfig] Error creating rule:', error);
      res.status(500).json({ success: false, message: 'Error al crear regla' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const rules = await reminderConfigService.update(req.params.id, req.body);
      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('[ReminderConfig] Error updating rule:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar regla' });
    }
  },

  async toggle(req: Request, res: Response): Promise<void> {
    try {
      const rules = await reminderConfigService.toggle(req.params.id);
      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('[ReminderConfig] Error toggling rule:', error);
      res.status(500).json({ success: false, message: 'Error al cambiar estado' });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const rules = await reminderConfigService.remove(req.params.id);
      res.json({ success: true, data: rules });
    } catch (error) {
      console.error('[ReminderConfig] Error deleting rule:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar regla' });
    }
  },
};
