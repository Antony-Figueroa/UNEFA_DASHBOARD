import { Request, Response } from 'express';
import * as listsService from '../services/lists.service.js';

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
  } else if (dbError.code === '400') {
    userMessage = dbError.message || 'Solicitud incorrecta';
    return res.status(400).json({ message: userMessage });
  } else if (dbError.code === '409') {
    userMessage = dbError.message || 'Conflicto: el recurso está en uso';
    return res.status(409).json({ message: userMessage });
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

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

/**
 * Create a new list
 */
export const createList = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre de la lista es requerido' });
    const data = await listsService.createList(name);
    res.status(201).json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Update a list
 */
export const updateList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre de la lista es requerido' });
    const data = await listsService.updateList(id, name);
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Delete a list
 */
export const deleteList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await listsService.deleteList(id);
    res.json({ message: 'Lista eliminada correctamente' });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Toggle list status
 */
export const toggleListStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await listsService.toggleListStatus(id, status);
    res.json({ message: 'Estado de la lista actualizado correctamente' });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Delete a value
 */
export const deleteValue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await listsService.deleteValue(id);
    res.json({ message: 'Valor eliminado correctamente' });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Create a new value for a list
 */
export const createValue = async (req: Request, res: Response) => {
  try {
    const { listId, name, abbreviation } = req.body;
    if (!listId || !name) return res.status(400).json({ message: 'listId y name son requeridos' });
    const data = await listsService.createValue(listId, name, abbreviation);
    res.status(201).json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Update a value
 */
export const updateValue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, abbreviation } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre del valor es requerido' });
    const data = await listsService.updateValue(id, name, abbreviation);
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Toggle value status
 */
export const toggleValueStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await listsService.toggleValueStatus(id, status);
    res.json({ message: 'Estado del valor actualizado correctamente' });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Get phone prefixes (public endpoint - no auth required)
 */
export const getPhonePrefixes = async (_req: Request, res: Response) => {
  try {
    const data = await listsService.getPhonePrefixes();
    res.json(data);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
