import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

const handleAuthError = (res: Response, error: unknown) => {
  console.error('Auth Error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({ 
    message: 'Error en el proceso de autenticación',
    error: errorMessage
  });
};

export const login = async (req: Request, res: Response) => {
  const { userCi, password } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!userCi || !password) {
    return res.status(400).json({ message: 'Cédula y contraseña son requeridas' });
  }

  try {
    const result = await authService.login(userCi, password, ip, userAgent);

    if (!result.success) {
      return res.status(result.status || 401).json({ message: result.message });
    }

    if (result.requirePasswordChange) {
      return res.json({
        requirePasswordChange: true,
        userId: result.userId,
        message: result.message
      });
    }

    // Establecer cookie para el token
    if (result.token) {
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000 // 30 minutos
      });
    }

    res.json({
      message: 'Login exitoso',
      user: result.user
    });
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const getSecurityQuestions = async (req: Request, res: Response) => {
  const { userCi } = req.params;
  try {
    const result = await authService.getSecurityQuestions(userCi);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const verifySecurityQuestions = async (req: Request, res: Response) => {
  const { userId, answers } = req.body;
  try {
    const result = await authService.verifySecurityQuestions(userId, answers);
    if (!result.success) return res.status(401).json(result);
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Sesión cerrada correctamente' });
};

export const changePassword = async (req: Request, res: Response) => {
  const { userId, newPassword, securityQuestions } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'ID de usuario y nueva contraseña son requeridos' });
  }

  try {
    const result = await authService.changePassword(userId, newPassword, securityQuestions);
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'ID de usuario y nueva contraseña son requeridos' });
  }

  try {
    const result = await authService.resetPassword(userId, newPassword);
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const getPresetQuestions = async (_req: Request, res: Response) => {
  try {
    const result = await authService.getPresetQuestions();
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};
