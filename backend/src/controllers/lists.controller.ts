import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager';
import { cacheManager } from '../lib/cache-manager';

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
  const cacheKey = `${CACHE_PREFIX}all`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // Fetch lists con proyección específica
      const { data: lists, error: listsError } = await supabase
        .from(LISTS_TABLE)
        .select('LIST_ID, NAME, STATUS')
        .eq('STATUS', 1)
        .order('NAME', { ascending: true });

      if (listsError) throw listsError;

      // Fetch all values con proyección específica
      const { data: values, error: valuesError } = await supabase
        .from(VALUES_TABLE)
        .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS')
        .eq('STATUS', 1);

      if (valuesError) throw valuesError;

      // Map values to their respective lists
      const mappedLists = (lists || []).map(list => ({
        ...list,
        t_value_list: (values || []).filter(v => v.LIST_ID === list.LIST_ID)
      }));

      return mappedLists as DBList[];
    }, 'getAllLists');

    const result = data.map(mapListToFrontend);
    cacheManager.set(cacheKey, result, CACHE_TTL);

    res.json(result);
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
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: list, error: listError } = await supabase
        .from(LISTS_TABLE)
        .select('*')
        .eq('NAME', name)
        .eq('STATUS', 1)
        .single();

      if (listError) {
        if (listError.code === 'PGRST116') {
          throw { code: '404', message: `Lista '${name}' no encontrada` };
        }
        throw listError;
      }

      const { data: values, error: valuesError } = await supabase
        .from(VALUES_TABLE)
        .select('*')
        .eq('LIST_ID', list.LIST_ID)
        .eq('STATUS', 1);

      if (valuesError) throw valuesError;

      return {
        ...list,
        t_value_list: values || []
      } as DBList;
    });

    res.json(mapListToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

/**
 * Get values for multiple lists by their names
 */
export const getMultipleListsByNames = async (req: Request, res: Response) => {
  const { names } = req.body;
  if (!Array.isArray(names)) {
    return res.status(400).json({ message: 'Se requiere un array de nombres de listas' });
  }

  const cacheKey = `${CACHE_PREFIX}multiple:${names.sort().join(',')}`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: lists, error: listsError } = await supabase
        .from(LISTS_TABLE)
        .select('LIST_ID, NAME, STATUS')
        .in('NAME', names)
        .eq('STATUS', 1);

      if (listsError) throw listsError;

      const listIds = (lists || []).map(l => l.LIST_ID);
      const { data: values, error: valuesError } = await supabase
        .from(VALUES_TABLE)
        .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS')
        .in('LIST_ID', listIds)
        .eq('STATUS', 1);

      if (valuesError) throw valuesError;

      const mappedLists = (lists || []).map(list => ({
        ...list,
        t_value_list: (values || []).filter(v => v.LIST_ID === list.LIST_ID)
      }));

      return mappedLists as DBList[];
    }, 'getMultipleListsByNames');

    const result: Record<string, ReturnType<typeof mapValueToFrontend>[]> = {};
    data.forEach(list => {
      result[list.NAME] = (list.t_value_list || []).map(mapValueToFrontend);
    });

    cacheManager.set(cacheKey, result, CACHE_TTL);

    res.json(result);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
