import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils.js';

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
  ASISTENTE: 2
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Sesión no iniciada' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Sesión inválida o expirada' });
  }

  req.user = payload as unknown as UserPayload;
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
