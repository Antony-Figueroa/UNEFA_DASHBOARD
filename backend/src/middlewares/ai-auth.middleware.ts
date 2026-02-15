import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils.js';

// AI Agent Role ID (e.g., 99 for AI Agent)
export const AI_ROLE = 99;

export interface AIAuthRequest extends Request {
  aiAgent?: {
    id: string;
    role: number;
  };
}

export const authenticateAI = (req: AIAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  const payload = verifyToken(token);

  if (!payload || typeof payload === 'string' || payload.role !== AI_ROLE) {
    return res.status(403).json({ message: 'Invalid AI token' });
  }

  req.aiAgent = {
    id: payload.userId || 'ai-agent',
    role: payload.role
  };

  next();
};
