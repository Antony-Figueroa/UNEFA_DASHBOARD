import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup expired entries cada 5 minutos para evitar memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of Object.entries(store)) {
    if (now > entry.resetTime) {
      delete store[ip];
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Simple in-memory rate limiter
 * @param limit Max requests
 * @param windowMs Time window in milliseconds
 */
export const rateLimit = (limit: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    if (!store[ip]) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    if (now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    if (store[ip].count >= limit) {
      return res.status(429).json({
        message: 'Too many requests, please try again later.'
      });
    }

    store[ip].count++;
    next();
  };
};
