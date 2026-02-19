import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { AppList, ValueListDB, ListDB } from '../models/list.js';

const LISTS_TABLE = 't_list';
const VALUES_TABLE = 't_value_list';
const CACHE_PREFIX = 'lists:';
const CACHE_TTL = 3600000;

// Nombres protegidos en mayúsculas para comparación case-insensitive
const PROTECTED_LISTS_UPPER = [
  'SEXO', 
  'REGISTRO CIVIL', 
  'NACIONALIDAD', 
  'REGIMEN/TURNO', 
  'TRABAJO', 
  'TIPO DE EMPRESA', 
  'RIF', 
  'TIPO DE PRACTICA', 
  'CONDICION', 
  'DEDICACION', 
  'CATEGORIA', 
  'TIPO DE ESTUDIANTE', 
  'RANGO MILITAR', 
  'ESTATUS PASANTIA', 
  'ESTATUS PERIODO', 
  'REGION', 
  'NUCLEO', 
  'EXTENSION', 
  'TRASLADO', 
  'PROFESION', 
  'CARRERA', 
  'ROLES', 
  'CODIGOS_AREA'
];

/**
 * Mapea un objeto de valor de la base de datos al formato de la aplicación.
 */
const mapValue = (v: ValueListDB) => ({
  id: String(v.VALUE_LIST_ID),
  name: v.NAME,
  abbreviation: v.ABBREVIATION,
  listId: String(v.LIST_ID),
  status: v.STATUS === 1
});

/**
 * Helper: Determina si un string es un ID numérico
 */
const isNumericId = (value: string): boolean => {
  return /^\d+$/.test(value);
};

/**
 * Helper: Busca una lista por ID o nombre (case-insensitive)
 */
const findListByIdentifier = async (supabase: any, identifier: string): Promise<ListDB | null> => {
  // Si es numérico, buscar por ID
  if (isNumericId(identifier)) {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .select('*')
      .eq('LIST_ID', Number(identifier))
      .limit(1);
    
    if (error) return null;
    return (data && data.length > 0) ? data[0] : null;
  }
  
  // Si no es numérico, buscar por nombre (case-insensitive)
  const { data, error } = await supabase
    .from(LISTS_TABLE)
    .select('*')
    .ilike('NAME', identifier)
    .limit(1);
  
  if (error) return null;
  return (data && data.length > 0) ? data[0] : null;
};

/**
 * Helper: Busca múltiples listas por IDs o nombres (case-insensitive)
 */
const findListsByIdentifiers = async (supabase: any, identifiers: string[]): Promise<ListDB[]> => {
  const numericIds: number[] = [];
  const names: string[] = [];
  
  identifiers.forEach(id => {
    if (isNumericId(id)) {
      numericIds.push(Number(id));
    } else {
      names.push(id.toUpperCase());
    }
  });
  
  const results: ListDB[] = [];
  
  // Buscar por IDs numéricos
  if (numericIds.length > 0) {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .in('LIST_ID', numericIds);
    
    if (!error && data) {
      results.push(...data);
    }
  }
  
  // Buscar por nombres (case-insensitive usando ILIKE individual)
  for (const name of names) {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .ilike('NAME', name);
    
    if (!error && data && data.length > 0) {
      // Solo agregar si no está ya en los resultados
      data.forEach((list: Pick<ListDB, 'LIST_ID' | 'NAME' | 'STATUS'>) => {
        if (!results.find(r => r.LIST_ID === list.LIST_ID)) {
          results.push(list as ListDB);
        }
      });
    }
  }
  
  return results;
};

/**
 * Obtiene todas las listas junto con sus valores.
 * Incluye tanto activas como inactivas para gestión.
 */
export const getAllLists = async (): Promise<AppList[]> => {
  const cacheKey = `${CACHE_PREFIX}all`;
  const cached = cacheManager.get<AppList[]>(cacheKey);
  if (cached) return cached;

  const data = await dbManager.withRetry(async (supabase) => {
    const { data: lists, error: listsError } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .order('NAME', { ascending: true });

    if (listsError) throw listsError;

    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS');

    if (valuesError) throw valuesError;

    const mappedLists = (lists || []).map(list => ({
      ...list,
      t_value_list: (values || []).filter((v: ValueListDB) => v.LIST_ID === list.LIST_ID)
    }));

    return mappedLists as ListDB[];
  }, 'getAllLists');

  const result = (data as ListDB[]).map(l => ({
    id: String(l.LIST_ID),
    name: l.NAME,
    status: l.STATUS === 1,
    values: (l.t_value_list || []).map(mapValue)
  }));

  cacheManager.set(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Crea una nueva lista en la base de datos.
 */
export const createList = async (name: string): Promise<AppList> => {
  const now = new Date().toISOString();
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .insert([{ 
        NAME: name.toUpperCase(), 
        STATUS: 1,
        CREATION_DATE: now,
        MODIF_USER_ID: 0,
        MODIF_USER_DATE: now,
        ELIM_USER_ID: 0,
        ELIM_USER_DATE: now,
        REST_USER_ID: 0,
        REST_USER_DATE: now
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'createList');

  const list = data as ListDB;
  cacheManager.delete(`${CACHE_PREFIX}all`);
  return {
    id: String(list.LIST_ID),
    name: list.NAME,
    status: list.STATUS === 1,
    values: []
  };
};

/**
 * Actualiza el nombre de una lista existente.
 */
export const updateList = async (id: string, name: string): Promise<AppList> => {
  const now = new Date().toISOString();
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .update({ 
        NAME: name.toUpperCase(),
        MODIF_USER_ID: 0,
        MODIF_USER_DATE: now
      })
      .eq('LIST_ID', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateList');

  const list = data as ListDB;
  cacheManager.delete(`${CACHE_PREFIX}all`);
  return {
    id: String(list.LIST_ID),
    name: list.NAME,
    status: list.STATUS === 1,
    values: []
  };
};

/**
 * Cambia el estado (activo/inactivo) de una lista.
 */
export const toggleListStatus = async (id: string, status: boolean): Promise<void> => {
  const now = new Date().toISOString();
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(LISTS_TABLE)
      .update({ 
        STATUS: status ? 1 : 0,
        MODIF_USER_ID: 0,
        MODIF_USER_DATE: now
      })
      .eq('LIST_ID', id);

    if (error) throw error;
  }, 'toggleListStatus');
  cacheManager.delete(`${CACHE_PREFIX}all`);
};

/**
 * Elimina una lista y todos sus valores asociados.
 */
export const deleteList = async (id: string): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    // Verificar si la lista es protegida (case-insensitive)
    const { data: listData, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('NAME')
      .eq('LIST_ID', id)
      .single();

    if (listError) throw listError;
    
    if (PROTECTED_LISTS_UPPER.includes(listData.NAME.toUpperCase())) {
      const error: any = new Error(`No se puede eliminar la lista '${listData.NAME}' porque es una lista del sistema.`);
      error.code = '400';
      throw error;
    }

    // Eliminar valores asociados
    const { error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .delete()
      .eq('LIST_ID', id);
      
    if (valuesError) throw valuesError;

    const { error } = await supabase
      .from(LISTS_TABLE)
      .delete()
      .eq('LIST_ID', id);

    if (error) throw error;
  }, 'deleteList');
  cacheManager.delete(`${CACHE_PREFIX}all`);
};

/**
 * Elimina un valor de lista específico.
 */
export const deleteValue = async (valueId: string): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(VALUES_TABLE)
      .delete()
      .eq('VALUE_LIST_ID', valueId);

    if (error) throw error;
  }, 'deleteValue');
  cacheManager.delete(`${CACHE_PREFIX}all`);
};

/**
 * Crea un nuevo valor dentro de una lista específica.
 * @param listIdOrName ID o nombre de la lista (case-insensitive)
 */
export const createValue = async (listIdOrName: string, name: string, abbreviation?: string): Promise<AppList['values'][0]> => {
  const now = new Date().toISOString();
  
  const data = await dbManager.withRetry(async (supabase) => {
    // Buscar la lista por ID o nombre
    const list = await findListByIdentifier(supabase, listIdOrName);
    
    if (!list) {
      throw { code: '404', message: `Lista '${listIdOrName}' no encontrada` };
    }

    const { data, error } = await supabase
      .from(VALUES_TABLE)
      .insert([{ 
        LIST_ID: list.LIST_ID, 
        NAME: name.toUpperCase(), 
        ABBREVIATION: abbreviation?.toUpperCase(), 
        STATUS: 1,
        CREATION_DATE: now,
        MODIF_USER_ID: 0,
        MODIF_USER_DATE: now,
        ELIM_USER_ID: 0,
        ELIM_USER_DATE: now,
        REST_USER_ID: 0,
        REST_USER_DATE: now
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'createValue');

  cacheManager.delete(`${CACHE_PREFIX}all`);
  return mapValue(data as ValueListDB);
};

/**
 * Actualiza un valor existente en una lista.
 */
export const updateValue = async (valueId: string, name: string, abbreviation?: string): Promise<AppList['values'][0]> => {
  const now = new Date().toISOString();
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(VALUES_TABLE)
      .update({ 
        NAME: name.toUpperCase(), 
        ABBREVIATION: abbreviation?.toUpperCase(),
        MODIF_USER_ID: 0,
        MODIF_USER_DATE: now
      })
      .eq('VALUE_LIST_ID', valueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateValue');

  cacheManager.delete(`${CACHE_PREFIX}all`);
  return mapValue(data as ValueListDB);
};

/**
 * Cambia el estado (activo/inactivo) de un valor de lista.
 */
export const toggleValueStatus = async (valueId: string, status: boolean): Promise<void> => {
  const now = new Date().toISOString();
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(VALUES_TABLE)
      .update({ 
        STATUS: status ? 1 : 0,
        MODIF_USER_ID: 0,
        MODIF_USER_DATE: now
      })
      .eq('VALUE_LIST_ID', valueId);

    if (error) throw error;
  }, 'toggleValueStatus');
  cacheManager.delete(`${CACHE_PREFIX}all`);
};

/**
 * Obtiene una lista y sus valores por ID o nombre.
 * @param idOrName ID numérico o nombre de la lista (case-insensitive)
 */
export const getListByName = async (idOrName: string) => {
  const data = await dbManager.withRetry(async (supabase) => {
    // Buscar por ID o nombre (case-insensitive)
    const list = await findListByIdentifier(supabase, idOrName);

    if (!list) {
      throw { code: '404', message: `Lista '${idOrName}' no encontrada` };
    }

    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('*')
      .eq('LIST_ID', list.LIST_ID)
      .eq('STATUS', 1);

    if (valuesError) throw valuesError;

    return { ...list, t_value_list: values || [] } as ListDB;
  }, 'getListByName');

  const listData = data as ListDB;
  return {
    id: String(listData.LIST_ID),
    name: listData.NAME,
    status: listData.STATUS === 1,
    values: (listData.t_value_list || []).map(mapValue)
  };
};

/**
 * Obtiene una lista por su ID.
 */
export const getListById = async (id: string): Promise<AppList | null> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data: list, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('*')
      .eq('LIST_ID', Number(id))
      .single();

    if (listError) {
      if (listError.code === 'PGRST116') return null;
      throw listError;
    }

    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('*')
      .eq('LIST_ID', list.LIST_ID)
      .eq('STATUS', 1);

    if (valuesError) throw valuesError;

    return { ...list, t_value_list: values || [] } as ListDB;
  }, 'getListById');

  if (!data) return null;

  const listData = data as ListDB;
  return {
    id: String(listData.LIST_ID),
    name: listData.NAME,
    status: listData.STATUS === 1,
    values: (listData.t_value_list || []).map(mapValue)
  };
};

export const ensurePhonePrefixesSeeded = async (): Promise<void> => {
  try {
    let list: AppList | null = null;
    try {
      list = await getListByName('CODIGOS_AREA') as unknown as AppList;
    } catch (e: unknown) {
      const code = (e as any)?.code;
      if (code === '404') {
        list = await createList('CODIGOS_AREA');
      } else {
        throw e;
      }
    }
    const existing = (list?.values || []).map(v => String(v.name).toUpperCase());
    const prefixes = ['0412','0414','0424','0416','0426','0212'];
    for (const p of prefixes) {
      if (!existing.includes(p.toUpperCase())) {
        await createValue(list!.id, p);
      }
    }
    cacheManager.delete(`${CACHE_PREFIX}all`);
  } catch {
    // Silenciar errores
  }
};

/**
 * Obtiene múltiples listas por sus IDs o nombres.
 * @param identifiers Array de IDs numéricos o nombres de listas (case-insensitive)
 */
export const getMultipleListsByNames = async (identifiers: string[]) => {
  const cacheKey = `${CACHE_PREFIX}multiple:${identifiers.sort().join(',')}`;
  const cached = cacheManager.get<Record<string, AppList['values']> | null>(cacheKey);
  if (cached) return cached;

  const data = await dbManager.withRetry(async (supabase) => {
    // Buscar listas por IDs o nombres
    const lists = await findListsByIdentifiers(supabase, identifiers);

    const listIds = lists.map((l: ListDB) => l.LIST_ID);
    
    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS')
      .in('LIST_ID', listIds)
      .eq('STATUS', 1);

    if (valuesError) throw valuesError;

    const mappedLists = lists.map((list: ListDB) => ({
      ...list,
      t_value_list: (values || []).filter((v: ValueListDB) => v.LIST_ID === list.LIST_ID)
    }));

    return mappedLists as ListDB[];
  }, 'getMultipleListsByNames');

  const result: Record<string, AppList['values']> = {};
  
  // Mapear resultados a los identificadores originales
  (data as ListDB[]).forEach(list => {
    // Buscar el identificador original que coincide
    const originalIdentifier = identifiers.find(id => {
      if (isNumericId(id)) {
        return String(list.LIST_ID) === id;
      }
      return id.toUpperCase() === list.NAME.toUpperCase();
    });
    
    const keyToUse = originalIdentifier || list.NAME;
    result[keyToUse] = (list.t_value_list || []).map(mapValue);
  });

  cacheManager.set(cacheKey, result, CACHE_TTL);
  return result;
};
