
import { Request, Response, NextFunction } from 'express';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    
    // Solo loguear errores (4xx, 5xx) o requests muy lentos (>2000ms)
    if (status >= 400) {
      console.error(`[HTTP] ${method} ${url} ${status} - ${duration}ms`);
    } else if (duration > 2000) {
      console.warn(`[HTTP] ⚠️ Lento: ${method} ${url} ${status} - ${duration}ms`);
    }
  });
  
  next();
};
