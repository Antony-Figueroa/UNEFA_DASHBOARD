import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { AppList, ValueListDB, ListDB } from '../models/list.js';

const LISTS_TABLE = 't_list';
const VALUES_TABLE = 't_value_list';
const CACHE_PREFIX = 'lists:';
const CACHE_TTL = 3600000;

/**
 * Mapea un objeto de valor de la base de datos al formato de la aplicación.
 * @param v Objeto de valor de la base de datos (ValueListDB).
 * @returns Objeto de valor formateado para la aplicación.
 */
const mapValue = (v: ValueListDB) => ({
  id: String(v.VALUE_LIST_ID),
  name: v.NAME,
  abbreviation: v.ABBREVIATION,
  listId: String(v.LIST_ID),
  status: v.STATUS === 1
});

/**
 * Obtiene todas las listas activas junto con sus valores.
 * Utiliza caché para mejorar el rendimiento.
 * @returns Promesa que resuelve a un array de AppList.
 */
export const getAllLists = async (): Promise<AppList[]> => {
  const cacheKey = `${CACHE_PREFIX}all`;
  const cached = cacheManager.get<AppList[]>(cacheKey);
  if (cached) return cached;

  const data = await dbManager.withRetry(async (supabase) => {
    const { data: lists, error: listsError } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .eq('STATUS', 1)
      .order('NAME', { ascending: true });

    if (listsError) throw listsError;

    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS')
      .eq('STATUS', 1);

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
 * Invalida el caché global de listas.
 * @param name Nombre de la nueva lista.
 * @returns Promesa que resuelve a la lista creada.
 */
export const createList = async (name: string): Promise<AppList> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .insert([{ NAME: name, STATUS: 1 }])
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
 * Invalida el caché global de listas.
 * @param id ID de la lista a actualizar.
 * @param name Nuevo nombre para la lista.
 * @returns Promesa que resuelve a la lista actualizada.
 */
export const updateList = async (id: string, name: string): Promise<AppList> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .update({ NAME: name })
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
 * Invalida el caché global de listas.
 * @param id ID de la lista.
 * @param status Nuevo estado de la lista.
 */
export const toggleListStatus = async (id: string, status: boolean): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(LISTS_TABLE)
      .update({ STATUS: status ? 1 : 0 })
      .eq('LIST_ID', id);

    if (error) throw error;
  }, 'toggleListStatus');
  cacheManager.delete(`${CACHE_PREFIX}all`);
};

/**
 * Crea un nuevo valor dentro de una lista específica.
 * Invalida el caché global de listas.
 * @param listId ID de la lista a la que pertenecerá el valor.
 * @param name Nombre del valor.
 * @param abbreviation Abreviación opcional del valor.
 * @returns Promesa que resuelve al valor creado.
 */
export const createValue = async (listId: string, name: string, abbreviation?: string): Promise<AppList['values'][0]> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(VALUES_TABLE)
      .insert([{ LIST_ID: listId, NAME: name, ABBREVIATION: abbreviation, STATUS: 1 }])
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
 * Invalida el caché global de listas.
 * @param valueId ID del valor a actualizar.
 * @param name Nuevo nombre para el valor.
 * @param abbreviation Nueva abreviación opcional.
 * @returns Promesa que resuelve al valor actualizado.
 */
export const updateValue = async (valueId: string, name: string, abbreviation?: string): Promise<AppList['values'][0]> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(VALUES_TABLE)
      .update({ NAME: name, ABBREVIATION: abbreviation })
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
 * Invalida el caché global de listas.
 * @param valueId ID del valor.
 * @param status Nuevo estado del valor.
 */
export const toggleValueStatus = async (valueId: string, status: boolean): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(VALUES_TABLE)
      .update({ STATUS: status ? 1 : 0 })
      .eq('VALUE_LIST_ID', valueId);

    if (error) throw error;
  }, 'toggleValueStatus');
  cacheManager.delete(`${CACHE_PREFIX}all`);
};

/**
 * Obtiene una lista y sus valores filtrando por el nombre de la lista.
 * @param name Nombre de la lista a buscar.
 * @returns Promesa que resuelve a la lista encontrada con sus valores.
 * @throws Error 404 si la lista no existe.
 */
export const getListByName = async (name: string) => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data: list, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('*')
      .eq('NAME', name)
      .eq('STATUS', 1)
      .single();

    if (listError) {
      if (listError.code === 'PGRST116') throw { code: '404', message: `Lista '${name}' no encontrada` };
      throw listError;
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
 * Obtiene múltiples listas por sus nombres de forma eficiente.
 * Utiliza caché basado en los nombres solicitados.
 * @param names Array de nombres de listas a buscar.
 * @returns Promesa que resuelve a un objeto con los nombres de las listas como llaves y sus valores como contenido.
 */
// Cache invalidation trigger - Fixed lists status in DB
export const getMultipleListsByNames = async (names: string[]) => {
  const cacheKey = `${CACHE_PREFIX}multiple:${names.sort().join(',')}`;
  const cached = cacheManager.get<Record<string, AppList['values']> | null>(cacheKey);
  if (cached) return cached;

  const data = await dbManager.withRetry(async (supabase) => {
    const { data: lists, error: listsError } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .in('NAME', names)
      .eq('STATUS', 1);

    if (listsError) throw listsError;

    const listIds = (lists || []).map((l: ListDB) => l.LIST_ID);
    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS')
      .in('LIST_ID', listIds)
      .eq('STATUS', 1);

    if (valuesError) throw valuesError;

    const mappedLists = (lists || []).map((list: ListDB) => ({
      ...list,
      t_value_list: (values || []).filter((v: ValueListDB) => v.LIST_ID === list.LIST_ID)
    }));

    return mappedLists as ListDB[];
  }, 'getMultipleListsByNames');

  const result: Record<string, AppList['values']> = {};
  (data as ListDB[]).forEach(list => {
    result[list.NAME] = (list.t_value_list || []).map(mapValue);
  });

  cacheManager.set(cacheKey, result, CACHE_TTL);
  return result;
};
