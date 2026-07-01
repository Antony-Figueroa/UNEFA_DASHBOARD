import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { validatePassword } from '../utils/security.utils.js';
import { decodeToken } from '../utils/auth.utils.js';
import { getConfig } from '../services/config.service.js';
import { dbManager } from '../lib/db-manager.js';
import { auditCreate, auditUpdate } from '../utils/audit-helpers.js';
import { nowStringVenezuela } from '../utils/date.utils.js';

const handleAuthError = (res: Response, error: unknown) => {
  console.error('Auth Error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  res.status(500).json({ 
    message: errorMessage
  });
};

const getSessionMinutes = async (): Promise<number> => {
  const config = await getConfig();
  return config?.KEY_LEGTH || 60;
};

const getSessionMaxAge = async (): Promise<number> => {
  const minutes = await getSessionMinutes();
  return minutes * 60 * 1000;
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
    const sessionMinutes = await getSessionMinutes();
    const result = await authService.login(userCi, password, ip, userAgent, `${sessionMinutes}m`);

    if (!result.success) {
      console.warn(`[Auth] Login fallido para CI ${userCi}: ${result.message}`);
      return res.status(result.status || 401).json({ message: result.message });
    }

    if (result.requirePasswordChange) {
      console.log(`[Auth] Cambio de clave requerido para CI: ${userCi}`);
      
      // Setear cookie temporal (15 min) para que el flujo de cambio de clave funcione
      if (result.tempToken) {
        res.cookie('auth_token', result.tempToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutos
          path: '/'
        });
      }
      
      return res.json({
        requirePasswordChange: true,
        userId: result.userId,
        message: result.message
      });
    }

    // Establecer cookie para el token
    if (result.token) {
      console.log(`[Auth] Generando cookie de sesión para CI: ${userCi}`);
      
      // Ponytail: cookie dura 24h para que refresh funcione aunque JWT expire.
      // La seguridad real está en JWT expiry (KEY_LEGTH, default 60min) +
      // DB session max age (MAX_SESSION_HOURS, 24h en auth.service.ts).
      const cookieMaxAge = 24 * 60 * 60 * 1000;
      
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: cookieMaxAge,
        path: '/'
      });
    }

    console.log(`[Auth] Login exitoso para CI: ${userCi}`);
    
    // Auditoría de login exitoso (usar user.id del resultado)
    if (result.user && 'id' in result.user) {
      try {
        await auditCreate(req, 't_user', {
          USER_ID: (result.user as any).id,
          LAST_LOGIN: nowStringVenezuela()
        }, ['LAST_LOGIN']);
      } catch (auditError) {
        console.error('[Audit] Error auditing login:', auditError);
      }
    }
    
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
  const { userCi } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!userCi) {
    return res.status(400).json({ success: false, message: 'La cédula es requerida' });
  }

  try {
    const config = await getConfig();
    
    if (config?.RECOVERY_EMAIL !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: 'La recuperación de contraseña por correo electrónico está deshabilitada. Contacte al administrador.' 
      });
    }

    const result = await authService.requestPasswordResetByCi(userCi, ip, userAgent);
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const getUserSecurityQuestions = async (req: Request, res: Response) => {
  const { userCi } = req.params;

  if (!userCi) {
    return res.status(400).json({ success: false, message: 'La cédula es requerida' });
  }

  try {
    const result = await authService.getUserSecurityQuestions(userCi);
    res.json(result);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const verifySecurityAnswersAndReset = async (req: Request, res: Response) => {
  const { userCi, answers, newPassword } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!userCi || !answers || !Array.isArray(answers) || answers.length < 3) {
    return res.status(400).json({ success: false, message: 'Cédula, respuestas y nueva contraseña son requeridas' });
  }

  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'La nueva contraseña es requerida' });
  }

  const passwordValidation = await validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ success: false, message: passwordValidation.message });
  }

  try {
    const result = await authService.verifySecurityAnswersAndReset(userCi, answers, newPassword, ip, userAgent);
    if (!result.success) {
      return res.status(('status' in result ? result.status : null) || 400).json(result);
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
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    const token = req.cookies?.auth_token;

    // Intentar obtener userId del middleware (si está autenticado) o decodificar
    // el token aunque esté expirado (para revocar en DB igual)
    let userId = req.user?.userId;
    let userCi = req.user?.userCi;

    if (!userId && token) {
      const decoded = decodeToken(token) as { userId?: number; userCi?: string } | null;
      if (decoded?.userId) {
        userId = decoded.userId;
        userCi = decoded.userCi;
      }
    }

    if (userId && userCi && token) {
      authService.revokeToken(token, userId, userCi);
      await authService.logAuthAction(userId, userCi, 'LOGOUT', ip, userAgent, 'Cierre de sesión manual');
    }

    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('[Auth] Error en logout:', error);
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Sesión cerrada' });
  }
};

export const refreshSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userCi = req.user?.userCi;
    const role = req.user?.role;
    const token = req.cookies?.auth_token;
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!userId || !userCi || role === undefined || !token) {
      return res.status(401).json({ success: false, message: 'Sesión no válida' });
    }

    // Verificar timeout absoluto de sesión en DB (24h)
    try {
      const supabase = dbManager.getClient();
      const dbCheck = await authService.verifySessionInDB(supabase, token);
      if (!dbCheck.valid) {
        // SESSION_NOT_FOUND: posible reinicio del servidor, permitir refresh para recrear sesión
        if (dbCheck.reason === 'SESSION_NOT_FOUND') {
          console.warn(`[Auth] Token sin sesión en DB durante refresh (posible reinicio) para userId=${userId}`);
        } else {
          return res.status(403).json({
            success: false,
            message: dbCheck.reason === 'SESSION_MAX_AGE_EXCEEDED'
              ? 'La sesión ha expirado por tiempo máximo. Debe iniciar sesión nuevamente.'
              : 'La sesión ha sido cerrada.',
            code: dbCheck.reason
          });
        }
      }
    } catch (dbErr) {
      console.error('[Auth] Error en verificación DB durante refresh:', dbErr);
      // No bloquear por error de DB, permitir cooldown del JWT
    }

    const sessionMinutes = await getSessionMinutes();
    const newToken = authService.generateRefreshToken({ userId, userCi, role }, `${sessionMinutes}m`);
    const maxAge = sessionMinutes * 60 * 1000;

    // Actualizar LAST_ACTIVITY en DB y registrar nuevo token
    try {
      const supabase = dbManager.getClient();
      await authService.upsertSession(supabase, userId, newToken, ip, userAgent);
    } catch (dbErr) {
      console.error('[Auth] Error actualizando sesión en DB durante refresh:', dbErr);
    }

    // Ponytail: misma regla que en login — cookie 24h para que refresh funcione
    const cookieMaxAge = 24 * 60 * 60 * 1000;
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: cookieMaxAge,
      path: '/'
    });

    console.log(`[Auth] Sesión renovada para CI: ${userCi}`);
    res.json({ 
      success: true, 
      message: 'Sesión renovada exitosamente',
      expiresIn: `${sessionMinutes}m`
    });
  } catch (error) {
    console.error(`[Auth] Error al renovar sesión:`, error);
    handleAuthError(res, error);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { userId, newPassword, securityQuestions, profileData, currentPassword } = req.body;
  const token = req.cookies?.auth_token;

  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'ID de usuario y nueva contraseña son requeridos' });
  }

  const passwordValidation = await validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  // Si no es primer login (no hay profileData), exigir contraseña actual
  if (!currentPassword && !profileData) {
    return res.status(400).json({ success: false, message: 'Debe proporcionar su contraseña actual' });
  }

  if (currentPassword) {
    const isValid = await authService.verifyCurrentPassword(userId, currentPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta' });
    }
  }

  try {
    const result = await authService.changePassword(userId, newPassword, securityQuestions, profileData);

    // Revocar el token actual en blacklist (cubre tokens que no estén en t_user_sessions)
    if (result.success && token) {
      const decoded = decodeToken(token) as { userCi?: string } | null;
      authService.revokeToken(token, userId, decoded?.userCi || '');
    }

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

  const passwordValidation = await validatePassword(newPassword);
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

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) return res.status(400).json({ success: false, message: 'fileName y contentType son requeridos' });

    const result = await authService.uploadAvatar(userId, fileName, contentType);
    res.json(result);
  } catch (error) {
    console.error('[Auth] uploadAvatar error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const result = await authService.deleteAvatar(userId);
    res.json(result);
  } catch (error) {
    console.error('[Auth] deleteAvatar error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const token = req.cookies?.auth_token;
    const tokenHash = token ? authService.hashToken(token) : undefined;
    const result = await authService.getActiveSessions(userId, tokenHash);
    res.json(result);
  } catch (error) {
    console.error('[Auth] getActiveSessions error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const terminateSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const sessionId = parseInt(req.params.id);
    if (!sessionId) return res.status(400).json({ success: false, message: 'ID de sesión requerido' });

    const result = await authService.terminateSession(userId, sessionId);
    res.json(result);
  } catch (error) {
    console.error('[Auth] terminateSession error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getNotificationPrefs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const result = await authService.getNotificationPrefs(userId);
    res.json(result);
  } catch (error) {
    console.error('[Auth] getNotificationPrefs error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const saveNotificationPrefs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const { preferences } = req.body;
    if (!Array.isArray(preferences)) return res.status(400).json({ success: false, message: 'preferences debe ser un array' });

    const result = await authService.saveNotificationPrefs(userId, preferences);
    res.json(result);
  } catch (error) {
    console.error('[Auth] saveNotificationPrefs error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const deactivateAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const { currentPassword, reason } = req.body;
    if (!currentPassword) return res.status(400).json({ success: false, message: 'Contraseña actual requerida' });

    const isValid = await authService.verifyCurrentPassword(userId, currentPassword);
    if (!isValid) return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta' });

    const result = await authService.deactivateAccount(userId, reason || '');
    if (!result.success) return res.status(500).json(result);

    res.clearCookie('auth_token');
    res.json(result);
  } catch (error) {
    console.error('[Auth] deactivateAccount error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const updateLocale = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const { locale } = req.body;
    if (!locale || !['es', 'en'].includes(locale)) return res.status(400).json({ success: false, message: 'Locale debe ser "es" o "en"' });

    const result = await authService.updateLocale(userId, locale);
    res.json(result);
  } catch (error) {
    console.error('[Auth] updateLocale error:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const sendCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId) return res.status(401).json({ success: false, message: 'Sesión no válida' });

    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere un array de userIds' });
    }

    const result = await authService.sendCredentialsToUsers(userIds, adminUserId);
    res.json(result);
  } catch (error) {
    console.error('[Auth] Error en sendCredentials:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const claimCredentials = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Token requerido' });
    }

    const result = await authService.claimCredentials(token);
    res.json(result);
  } catch (error) {
    console.error('[Auth] Error en claimCredentials:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getPasswordPolicy = async (_req: Request, res: Response) => {
  try {
    const config = await getConfig();
    res.json({
      minLength: config?.USER_LENGTH || 12,
      requireUppercase: (config?.USER_UPPERCASE ?? 1) === 1,
      requireLowercase: (config?.USER_LOWERCASE ?? 1) === 1,
      requireNumbers: (config?.USER_NUMBERS ?? 1) === 1,
      requireSpecial: (config?.USER_SPECIAL_CHARACTERS ?? 1) === 1,
      minUppercase: config?.USER_NUM_UPPERCASE || 1,
      minLowercase: config?.USER_NUM_LOWERCASE || 1,
      minNumbers: config?.USER_NUM_NUMBERS || 1,
      minSpecial: config?.USER_NUM_SPECIAL_CHARACTERS || 1,
    });
  } catch (error) {
    console.error('Get Password Policy Error:', error);
    res.status(500).json({ message: 'Error al obtener política de contraseñas' });
  }
};
