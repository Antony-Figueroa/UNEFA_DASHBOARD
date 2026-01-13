import { Request, Response } from 'express';
import * as careersService from '../services/careers.service';

const TABLE_NAME = 't_career'; 
const RELATION_TABLE = 't_career_internship_type';
const CACHE_PREFIX = 'careers:';
const CACHE_TTL = 3600000; // 1 hour for careers
const CAREER_COLUMNS = 'CAREER_ID, CAREER_NAME, STATUS, CAREER_ABBREVIATION';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };
  
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

export const getCareerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await careersService.getCareerById(id);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createCareer = async (req: Request, res: Response) => {
  try {
    const result = await careersService.createCareer(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateCareer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await careersService.updateCareer(id, req.body);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteCareer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await careersService.deleteCareer(id);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkDeleteCareers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await careersService.bulkDeleteCareers(ids);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
