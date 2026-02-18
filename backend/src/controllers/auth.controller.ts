import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { validatePassword } from '../utils/security.utils.js';

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
      
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: true, // Siempre true para permitir cross-site en HTTPS
        sameSite: 'none', // Requerido para que Vercel pueda enviar la cookie a Render
        maxAge: 60 * 60 * 1000, // 1 hora
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

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo electrónico es requerido' });
  }

  try {
    const result = await authService.requestPasswordReset(email, ip, userAgent);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const resetPasswordWithToken = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
  }

  try {
    const result = await authService.resetPasswordWithToken(token, newPassword, ip, userAgent);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userCi = req.user?.userCi;
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    const token = req.cookies?.auth_token;

    if (userId && userCi) {
      await authService.logAuthAction(userId, userCi, 'LOGOUT', ip, userAgent, 'Cierre de sesión manual');
      if (token) {
        authService.revokeToken(token, userId, userCi);
      }
    }

    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Sesión cerrada' });
  }
};

export const refreshSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userCi = req.user?.userCi;
    const role = req.user?.role;

    if (!userId || !userCi || role === undefined) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    // Generar nuevo token con tiempo extendido
    const newToken = authService.generateRefreshToken({ userId, userCi, role });

    // Actualizar cookie
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000, // 1 hora
      path: '/'
    });

    console.log(`[Auth] Sesión renovada para CI: ${userCi}`);
    res.json({ 
      success: true, 
      message: 'Sesión renovada exitosamente',
      expiresIn: '1h'
    });
  } catch (error) {
    console.error(`[Auth] Error al renovar sesión:`, error);
    handleAuthError(res, error);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { userId, newPassword, securityQuestions } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'ID de usuario y nueva contraseña son requeridos' });
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
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

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
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

export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log('[Auth] getLoginHistory called for userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const history = await authService.getLoginHistory(userId, limit);
    console.log('[Auth] getLoginHistory result:', history?.length, 'records');
    
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error('[Auth] getLoginHistory error:', error.message);
    handleAuthError(res, error);
  }
};

export const getAllAuthLogs = async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const offset = (page - 1) * limit;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const result = await authService.getAllAuthLogs(limit, offset, userId);
    res.json({ 
      success: true, 
      data: result.data,
      meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
    });
  } catch (error: any) {
    console.error('[Auth] getAllAuthLogs error:', error.message);
    handleAuthError(res, error);
  }
};
