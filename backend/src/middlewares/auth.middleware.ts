import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Sesión no iniciada' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Sesión inválida o expirada' });
  }

  req.user = payload;
  next();
};
