import { Request, Response } from 'express';
import * as careersService from '../services/careers.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };
  
  if (dbError.code === 'BUSINESS_RULE_VIOLATION') {
    return res.status(400).json({ message: dbError.message });
  }

  if (dbError.code === 'NOT_FOUND') {
    return res.status(404).json({ message: dbError.message });
  }

  // Mensaje amigable según el código de error de Postgres
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '22P02') {
    userMessage = 'Error: Formato de datos inválido (ej: número esperado en lugar de texto)';
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

export const getCareers = async (_req: Request, res: Response) => {
  try {
    const result = await careersService.getCareers();
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getCareersByInternshipType = async (req: Request, res: Response) => {
  try {
    const { typeId } = req.params;
    if (!typeId) {
      return res.status(400).json({ message: 'Se requiere el ID del tipo de práctica' });
    }
    const result = await careersService.getCareersByInternshipType(typeId);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getCareerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await careersService.getCareerById(id);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createCareer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const result = await careersService.createCareer(req.body, userId);
    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateCareer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 1;
    const result = await careersService.updateCareer(id, req.body, userId);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteCareer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 1;
    await careersService.deleteCareer(id, userId);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkDeleteCareers = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.userId || 1;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await careersService.bulkDeleteCareers(ids, userId);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkRestoreCareers = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.userId || 1;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await careersService.bulkRestoreCareers(ids, userId);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const toggleCareerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId || 1;
    
    if (status === false || status === 0) {
      await careersService.deleteCareer(id, userId);
    } else {
      await careersService.bulkRestoreCareers([id], userId);
    }
    
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
