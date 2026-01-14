import { Request, Response } from 'express';
import * as listsService from '../services/lists.service.js';

const LISTS_TABLE = 't_list';
const VALUES_TABLE = 't_value_list';
const CACHE_PREFIX = 'lists:';
const CACHE_TTL = 3600000; // 1 hour for lists

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as AppError;
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '404') {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

interface DBValueList {
  VALUE_LIST_ID: number;
  NAME: string;
  ABBREVIATION: string;
  LIST_ID: number;
  STATUS: number;
}

interface DBList {
  LIST_ID: number;
  NAME: string;
  STATUS: number;
  t_value_list?: DBValueList[];
}

const mapValueToFrontend = (v: DBValueList) => ({
  id: String(v.VALUE_LIST_ID),
  name: v.NAME,
  abbreviation: v.ABBREVIATION,
  listId: String(v.LIST_ID),
  status: v.STATUS === 1
});

const mapListToFrontend = (l: DBList) => ({
  id: String(l.LIST_ID),
  name: l.NAME,
  status: l.STATUS === 1,
  values: (l.t_value_list || []).map(mapValueToFrontend)
});

/**
 * Get all lists with their associated values
 */
export const getAllLists = async (_req: Request, res: Response) => {
  try {
    const data = await listsService.getAllLists();
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Get a specific list by name with its values
 */
export const getListByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const data = await listsService.getListByName(name);
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Get values for multiple lists by their names
 */
export const getMultipleListsByNames = async (req: Request, res: Response) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names)) return res.status(400).json({ message: 'Se requiere un array de nombres de listas' });

    const data = await listsService.getMultipleListsByNames(names);
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
