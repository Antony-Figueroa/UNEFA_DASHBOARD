import { Response } from 'express';
import * as dashboardConfigService from '../services/dashboard-config.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getLayout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      res.status(400).json({ success: false, message: 'ID de rol inválido' });
      return;
    }

    const layout = await dashboardConfigService.getLayoutByRole(roleId);
    res.json({ success: true, data: layout });
  } catch (error: any) {
    console.error('[DashboardConfigController] Error getting layout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la configuración del dashboard',
      error: error.message,
    });
  }
};

export const getAllLayouts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const layouts = await dashboardConfigService.getAllLayouts();
    res.json({ success: true, data: layouts });
  } catch (error: any) {
    console.error('[DashboardConfigController] Error getting all layouts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las configuraciones de dashboard',
      error: error.message,
    });
  }
};

export const saveLayout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      res.status(400).json({ success: false, message: 'ID de rol inválido' });
      return;
    }

    const { widgets } = req.body;
    if (!Array.isArray(widgets)) {
      res.status(400).json({ success: false, message: 'El campo "widgets" debe ser un array' });
      return;
    }

    const userId = req.user?.userId?.toString() || '0';
    const layout = await dashboardConfigService.saveLayout(roleId, widgets, userId);

    res.json({
      success: true,
      message: 'Layout del dashboard guardado exitosamente',
      data: layout,
    });
  } catch (error: any) {
    console.error('[DashboardConfigController] Error saving layout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la configuración del dashboard',
      error: error.message,
    });
  }
};

export const resetLayout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      res.status(400).json({ success: false, message: 'ID de rol inválido' });
      return;
    }

    const layout = await dashboardConfigService.resetLayout(roleId);

    res.json({
      success: true,
      message: 'Layout restablecido a valores por defecto',
      data: layout,
    });
  } catch (error: any) {
    console.error('[DashboardConfigController] Error resetting layout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la configuración',
      error: error.message,
    });
  }
};
