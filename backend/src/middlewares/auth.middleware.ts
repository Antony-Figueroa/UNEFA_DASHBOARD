import { Request, Response, NextFunction } from 'express';
import { verifyToken, decodeToken } from '../utils/auth.utils.js';
import * as authService from '../services/auth.service.js';

export interface UserPayload {
  userId: number;
  userCi: string;
  role: number;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const ROLES = {
  ADMIN: 1,
  ASISTENTE: 2,
};

const expiredTokensLogged = new Set<string>();

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!token) {
    return res.status(401).json({ message: 'Sesión no iniciada' });
  }

  const { revoked, data } = authService.isTokenRevoked(token);
  if (revoked) {
    return res.status(403).json({ message: 'Sesión cerrada', code: 'SESSION_REVOKED' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    const decoded = decodeToken(token) as { userId?: number; userCi?: string } | null;
    if (decoded?.userId && decoded?.userCi) {
      const tokenHash = token.substring(0, 16);
      if (!expiredTokensLogged.has(tokenHash)) {
        expiredTokensLogged.add(tokenHash);
        authService.logAuthAction(decoded.userId, decoded.userCi, 'SESSION_EXPIRED', ip, userAgent, 'Sesión expirada por inactividad');
      }
    }
    return res.status(403).json({ message: 'Sesión expirada', code: 'SESSION_EXPIRED' });
  }

  req.user = payload as unknown as UserPayload;
  next();
};

/**
 * Middleware para requerir verificación adicional (2FA) en acciones sensibles.
 * Solo aplicable para MASTER_ADMIN.
 */
interface VerificationPayload {
  userId: number;
  type: string;
  timestamp: number;
}

export const requireMaster2FA = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Verificar que el usuario esté autenticado
  if (!req.user) {
    return res.status(401).json({ message: 'Sesión no iniciada' });
  }

  // 2. Verificar que sea Administrador
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Acceso denegado: Se requieren permisos administrativos' });
  }

  // 3. Verificar si la petición incluye un token de verificación de sesión sensible (2FA)
  // Este token debe enviarse en el header 'X-Master-Verification'
  const verificationToken = req.headers['x-master-verification'];
  
  if (!verificationToken) {
    return res.status(403).json({ 
      message: 'Se requiere verificación adicional para esta acción sensible.', 
      requires2FA: true 
    });
  }

  // 4. Validar el token de verificación
  const payload = verifyToken(verificationToken as string) as unknown as VerificationPayload | null;
  
  if (!payload || payload.type !== 'master_verification') {
    return res.status(403).json({ 
      message: 'La verificación ha expirado o es inválida. Por favor, verifique su identidad nuevamente.', 
      requires2FA: true 
    });
  }

  // 5. Verificar que el token pertenezca al mismo usuario
  if (payload.userId !== req.user.userId) {
    return res.status(403).json({ message: 'Token de verificación no coincide con el usuario actual.' });
  }

  next();
};

/**
 * Middleware to check if the user has a specific role.
 */
export const authorizeRole = (allowedRoles: number[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
};

/**
 * Middleware to restrict write operations for the ASISTENTE role.
 */
export const restrictAsistente = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === ROLES.ASISTENTE) {
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (writeMethods.includes(req.method)) {
      return res.status(403).json({ 
        message: 'Permiso denegado: Los usuarios de nivel ASISTENTE tienen permisos de solo lectura.' 
      });
    }
  }
  next();
};
