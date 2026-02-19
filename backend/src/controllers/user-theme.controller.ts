import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as userThemeService from '../services/user-theme.service.js';

export const getUserTheme = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const theme = await userThemeService.getUserTheme(userId);
    
    return res.json({
      success: true,
      data: theme || { brandColor: 'blue' }
    });
  } catch (error) {
    console.error('[UserThemeController] Error getting user theme:', error);
    return res.status(500).json({ error: 'Error al obtener preferencias de tema' });
  }
};

export const updateUserTheme = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  const { brandColor } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (!brandColor || !userThemeService.isValidBrandColor(brandColor)) {
    return res.status(400).json({ 
      error: 'Color inválido',
      validColors: userThemeService.VALID_BRAND_COLORS 
    });
  }

  try {
    const theme = await userThemeService.upsertUserTheme(userId, brandColor);
    
    return res.json({
      success: true,
      data: theme,
      message: 'Preferencia de tema actualizada'
    });
  } catch (error) {
    console.error('[UserThemeController] Error updating user theme:', error);
    return res.status(500).json({ error: 'Error al actualizar preferencias de tema' });
  }
};
