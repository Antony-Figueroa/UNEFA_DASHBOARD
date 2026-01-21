import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

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

  console.log(`[Auth] Intento de login para CI: ${userCi}`);

  if (!userCi || !password) {
    return res.status(400).json({ message: 'Cédula y contraseña son requeridas' });
  }

  try {
    const result = await authService.login(userCi, password, ip, userAgent);

    if (!result.success) {
      console.warn(`[Auth] Login fallido para CI ${userCi}: ${result.message}`);
      return res.status(result.status || 401).json({ message: result.message });
    }

    if (result.requirePasswordChange) {
      console.log(`[Auth] Cambio de clave requerido para CI: ${userCi}`);
      return res.json({
        requirePasswordChange: true,
        userId: result.userId,
        message: result.message
      });
    }

    // Establecer cookie para el token
    if (result.token) {
      console.log(`[Auth] Generando cookie de sesión para CI: ${userCi}`);
      const isProd = process.env.NODE_ENV === 'production';
      
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: true, // Siempre true para permitir cross-site en HTTPS
        sameSite: 'none', // Requerido para que Vercel pueda enviar la cookie a Render
        maxAge: 30 * 60 * 1000, // 30 minutos
        path: '/'
      });
    }

    console.log(`[Auth] Login exitoso para CI: ${userCi}`);
    res.json({
      message: 'Login exitoso',
      user: result.user
    });
  } catch (error) {
    console.error(`[Auth] Error crítico en login para CI ${userCi}:`, error);
    handleAuthError(res, error);
  }
};

export const verifyMaster = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'La contraseña es requerida' });
    }

    const result = await authService.verifyMaster(userId, password, ip, userAgent);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error(`[Auth] Error en verifyMaster:`, error);
    handleAuthError(res, error);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log(`[Auth] Verificando sesión para usuario ID: ${userId}`);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    const result = await authService.getUserById(userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error(`[Auth] Error en getMe:`, error);
    handleAuthError(res, error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, secondName, surname, secondSurname, email, phoneNumber } = req.body;
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    // Validaciones básicas
    if (!name || !surname || !email) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Formato de correo inválido' });
    }

    const result = await authService.updateProfile(userId, {
      name,
      secondName,
      surname,
      secondSurname,
      email,
      phoneNumber
    }, ip, userAgent);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error(`[Auth] Error en updateProfile:`, error);
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
