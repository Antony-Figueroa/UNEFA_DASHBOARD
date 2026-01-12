
import { Request, Response, NextFunction } from 'express';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Capturar el final de la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    
    const logMessage = `[HTTP] ${method} ${url} ${status} - ${duration}ms`;
    
    if (duration > 500) {
      console.warn(`[Performance] SLOW REQUEST: ${logMessage}`);
    } else {
      console.log(logMessage);
    }
  });
  
  next();
};
