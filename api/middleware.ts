import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

export const checkRole = (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.headers['x-user-role'] as string;
  
  if (!userRole) {
    return res.status(401).json({ message: 'No se proporcionó rol de usuario' });
  }

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes' });
  }

  next();
};
