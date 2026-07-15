import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { AppList, ListValueResponse, ValueListDB, ListDB } from '../models/list.js';

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
  'PREFIJO',
  'TÍTULO'
];

/**
 * Mapa de referencias: relaciona cada lista del sistema con las tablas/columnas
 * que almacenan sus valores como strings. Permite verificar si un valor está
 * siendo usado antes de permitir su modificación o eliminación.
 */
const LIST_REFERENCE_MAP: Record<string, Array<{ table: string; column: string }>> = {
  'SEXO': [
    { table: 't_persons', column: 'gender' },
  ],
  'REGISTRO CIVIL': [
    { table: 't_persons', column: 'marital_status' },
  ],
  'TIPO DE ESTUDIANTE': [
    { table: 't_students', column: 'STUDENT_TYPE' },
  ],
  'RANGO MILITAR': [
    { table: 't_students', column: 'MILITARY_RANK' },
  ],
  'TRABAJO': [
    { table: 't_students', column: 'EMPLOYMENT' },
  ],
  'CONDICION': [
    { table: 't_tutors', column: 'CONDITION' },
  ],
  'DEDICACION': [
    { table: 't_tutors', column: 'DEDICATION' },
  ],
  'CATEGORIA': [
    { table: 't_tutors', column: 'CATEGORY' },
  ],
  'PROFESION': [
    { table: 't_tutors', column: 'PROFESSION' },
  ],
  'TÍTULO': [
    { table: 't_tutors', column: 'PROFESSION' },
  ],
  'GRADO DE INSTRUCCIÓN': [
    { table: 't_tutors', column: 'TITULO' },
  ],
  'REGION': [
    { table: 't_institution', column: 'REGION' },
  ],
  'NUCLEO': [
    { table: 't_institution', column: 'NUCLEUS' },
  ],
  'EXTENSION': [
    { table: 't_institution', column: 'EXTENSION' },
  ],
  'TIPO DE EMPRESA': [
    { table: 't_institution', column: 'INSTITUTION_TYPE' },
  ],
  'TIPO DE PRACTICA': [
    { table: 't_institution', column: 'PRACTICE_TYPE' },
  ],
  'REGIMEN/TURNO': [
    { table: 't_professional_practices', column: 'REGIME' },
  ],
  'VISIT_TYPE': [
    { table: 't_practice_visits', column: 'VISIT_TYPE' },
  ],
  'VISIT_CASE': [
    { table: 't_practice_visits', column: 'VISIT_CASE' },
  ],
  'TUTOR_TYPE': [
    { table: 't_professional_practices_tutor', column: 'TUTOR_TYPE' },
  ],
};

// Cache local en memoria para resultados de verificación de uso
// Se invalida al mismo tiempo que el cache de listas
let inUseCache: Map<number, boolean> | null = null;

/**
 * Verifica qué valores de una lista específica están siendo usados en otras tablas.
 * Recorre las referencias definidas en LIST_REFERENCE_MAP y busca coincidencias
 * por nombre del valor.
 * 
 * @returns Set de VALUE_LIST_ID que están en uso
 */
const checkValuesInUse = async (
  supabase: any,
  listName: string,
  values: ValueListDB[]
): Promise<Set<number>> => {
  const refs = LIST_REFERENCE_MAP[listName.toUpperCase()];
  if (!refs || refs.length === 0 || values.length === 0) return new Set();

  const names = [...new Set(values.map(v => String(v.NAME).toUpperCase()))];
  const nameToId = new Map<string, number>();
  values.forEach(v => nameToId.set(String(v.NAME).toUpperCase(), v.VALUE_LIST_ID));

  const inUseIds = new Set<number>();

  await Promise.all(refs.map(async ({ table, column }) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .in(column, names);

      if (!error && data) {
        for (const row of data) {
          const val = String(row[column]).toUpperCase();
          const id = nameToId.get(val);
          if (id !== undefined) inUseIds.add(id);
        }
      }
    } catch {
      // Si una tabla no existe o falla, ignoramos esa referencia
    }
  }));

  return inUseIds;
};

/**
 * Verifica qué valores están en uso para TODAS las listas en un solo batch.
 * Útil para getAllLists() donde necesitamos verificar todas las listas juntas.
 * 
 * @returns Map<valueId, isInUse>
 */
const checkAllValuesInUse = async (
  supabase: any,
  lists: ListDB[]
): Promise<Set<number>> => {
  const result = new Set<number>();
  const checks: Promise<void>[] = [];

  for (const list of lists) {
    const refs = LIST_REFERENCE_MAP[list.NAME.toUpperCase()];
    if (!refs || !list.t_value_list || list.t_value_list.length === 0) continue;

    const names = [...new Set(list.t_value_list.map(v => String(v.NAME).toUpperCase()))];
    if (names.length === 0) continue;

    const nameToId = new Map<string, number>();
    list.t_value_list.forEach(v => nameToId.set(String(v.NAME).toUpperCase(), v.VALUE_LIST_ID));

    for (const { table, column } of refs) {
      checks.push(
        (async () => {
          try {
            const { data, error } = await supabase
              .from(table)
              .select(column)
              .in(column, names);

            if (!error && data) {
              for (const row of data) {
                const val = String(row[column]).toUpperCase();
                const id = nameToId.get(val);
                if (id !== undefined) result.add(id);
              }
            }
          } catch {
            // Ignorar errores de tablas/columnas que no existan
          }
        })()
      );
    }
  }

  await Promise.all(checks);
  return result;
};

/**
 * Mapea un objeto de valor de la base de datos al formato de la aplicación.
 * Si se provee un set de IDs en uso, marca el flag inUse.
 */
const mapValue = (v: ValueListDB, inUseSet?: Set<number> | null): ListValueResponse => ({
  id: String(v.VALUE_LIST_ID),
  name: v.NAME,
  abbreviation: v.ABBREVIATION,
  listId: String(v.LIST_ID),
  status: v.STATUS === 1,
  inUse: inUseSet ? inUseSet.has(v.VALUE_LIST_ID) : false
});

/**
 * Normaliza texto removiendo acentos y convirtiendo a mayúsculas para búsquedas
 */
const normalizeForSearch = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

/**
 * Helper: Determina si un string es un ID numérico
 */
const isNumericId = (value: string): boolean => {
  return /^\d+$/.test(value);
};

/**
 * Helper: Busca una lista por ID o nombre (case-insensitive + accent-insensitive)
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
  
  // Si no es numérico, buscar por nombre normalizando acentos
  const normalizedIdentifier = normalizeForSearch(identifier);
  
  // Primero intentar búsqueda exacta normalizada
  const { data, error } = await supabase
    .from(LISTS_TABLE)
    .select('*')
    .limit(50);
  
  if (error || !data) return null;
  
  // Buscar coincidencia normalizando ambos lados
  const match = data.find(list => 
    normalizeForSearch(list.NAME) === normalizedIdentifier
  );
  
  return match || null;
};

/**
 * Helper: Busca múltiples listas por IDs o nombres (case-insensitive + accent-insensitive)
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
  
  // Buscar por nombres (normalizando acentos)
  if (names.length > 0) {
    const normalizedNames = names.map(normalizeForSearch);
    
    const { data, error } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS');
    
    if (!error && data) {
      for (const list of data) {
        const normalizedListName = normalizeForSearch(list.NAME);
        if (normalizedNames.includes(normalizedListName)) {
          if (!results.find(r => r.LIST_ID === list.LIST_ID)) {
            results.push(list);
          }
        }
      }
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

  const result = await dbManager.withRetry(async (supabase) => {
    const { data: lists, error: listsError } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .order('NAME', { ascending: true });

    if (listsError) throw listsError;

    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS');

    if (valuesError) throw valuesError;

    const mappedLists: ListDB[] = (lists || []).map((list: ListDB) => ({
      ...list,
      t_value_list: (values || []).filter((v: ValueListDB) => v.LIST_ID === list.LIST_ID)
    }));

    // Verificar qué valores están en uso en todas las listas
    const inUseMap = await checkAllValuesInUse(supabase, mappedLists);

    return mappedLists.map(l => {
      const mappedValues = (l.t_value_list || []).map(v => mapValue(v, inUseMap));
      return {
        id: String(l.LIST_ID),
        name: l.NAME,
        status: l.STATUS === 1,
        hasInUseValues: mappedValues.some(v => v.inUse),
        values: mappedValues
      } as AppList;
    });
  }, 'getAllLists');

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
 * Verifica que ningún valor esté en uso antes de permitir la eliminación.
 */
export const deleteList = async (id: string): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    // Obtener la lista con sus valores
    const { data: listData, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME')
      .eq('LIST_ID', id)
      .single();

    if (listError) throw listError;
    
    if (PROTECTED_LISTS_UPPER.includes(listData.NAME.toUpperCase())) {
      throw {
        code: '400',
        message: `No se puede eliminar la lista '${listData.NAME}' porque es una lista del sistema.`
      };
    }

    // Obtener los valores de la lista
    const { data: values, error: valuesFetchError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME')
      .eq('LIST_ID', id);

    if (valuesFetchError) throw valuesFetchError;

    // Verificar si algún valor está en uso
    if (values && values.length > 0) {
      const refs = LIST_REFERENCE_MAP[listData.NAME.toUpperCase()];
      if (refs) {
        const names = values.map(v => String(v.NAME).toUpperCase());
        for (const { table, column } of refs) {
          const { data: usageData } = await supabase
            .from(table)
            .select(column)
            .in(column, names)
            .limit(1);

          if (usageData && usageData.length > 0) {
            throw {
              code: '409',
              message: `No se puede eliminar la lista "${listData.NAME}" porque tiene valores que están siendo usados en ${table}.`
            };
          }
        }
      }
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
 * Verifica que el valor no esté en uso antes de eliminar.
 */
export const deleteValue = async (valueId: string): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    // Obtener el valor y su lista
    const { data: valueData, error: valueError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, LIST_ID, STATUS')
      .eq('VALUE_LIST_ID', valueId)
      .single();

    if (valueError) {
      if (valueError.code === 'PGRST116') {
        throw { code: '404', message: 'Valor no encontrado' };
      }
      throw valueError;
    }

    // Obtener el nombre de la lista para verificar referencias
    const { data: listData, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('NAME')
      .eq('LIST_ID', valueData.LIST_ID)
      .single();

    if (listError) throw listError;

    // Verificar si el valor está en uso
    const refs = LIST_REFERENCE_MAP[listData.NAME.toUpperCase()];
    if (refs) {
      const valueName = String(valueData.NAME).toUpperCase();
      for (const { table, column } of refs) {
        const { data: usageData } = await supabase
          .from(table)
          .select(column)
          .eq(column, valueName)
          .limit(1);

        if (usageData && usageData.length > 0) {
          throw {
            code: '409',
            message: `No se puede eliminar "${valueData.NAME}" porque está siendo usado en ${table}.`
          };
        }
      }
    }

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
 * Si el valor está en uso, solo permite cambios cosméticos (abreviatura),
 * pero bloquea cambios en el nombre.
 */
export const updateValue = async (valueId: string, name: string, abbreviation?: string): Promise<ListValueResponse> => {
  const now = new Date().toISOString();
  const data = await dbManager.withRetry(async (supabase) => {
    // Obtener el valor actual y su lista
    const { data: valueData, error: valueError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, LIST_ID')
      .eq('VALUE_LIST_ID', valueId)
      .single();

    if (valueError) {
      if (valueError.code === 'PGRST116') {
        throw { code: '404', message: 'Valor no encontrado' };
      }
      throw valueError;
    }

    // Obtener el nombre de la lista para verificar referencias
    const { data: listData, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('NAME')
      .eq('LIST_ID', valueData.LIST_ID)
      .single();

    if (listError) throw listError;

    // Verificar si el valor está en uso
    const refs = LIST_REFERENCE_MAP[listData.NAME.toUpperCase()];
    let isInUse = false;
    if (refs) {
      const currentName = String(valueData.NAME).toUpperCase();
      for (const { table, column } of refs) {
        const { data: usageData } = await supabase
          .from(table)
          .select(column)
          .eq(column, currentName)
          .limit(1);

        if (usageData && usageData.length > 0) {
          isInUse = true;
          break;
        }
      }
    }

    // Si está en uso y cambiaron el nombre, bloquear
    if (isInUse && name.toUpperCase() !== String(valueData.NAME).toUpperCase()) {
      throw {
        code: '409',
        message: `No se puede cambiar el nombre de "${valueData.NAME}" porque está siendo usado en otros registros. Solo puedes modificar la abreviatura.`
      };
    }

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
  return mapValue(data as ValueListDB, new Set([Number(valueId)]));
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
export const getListByName = async (idOrName: string): Promise<AppList> => {
  const cacheKey = `${CACHE_PREFIX}byName:${idOrName.toUpperCase()}`;
  const cached = cacheManager.get<AppList>(cacheKey);
  if (cached) return cached;

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

    const listWithValues = { ...list, t_value_list: values || [] } as ListDB;

    // Verificar qué valores están en uso
    const inUseSet = await checkValuesInUse(supabase, listWithValues.NAME, listWithValues.t_value_list || []);

    const mappedValues = (listWithValues.t_value_list || []).map(v => mapValue(v, inUseSet));

    return {
      id: String(listWithValues.LIST_ID),
      name: listWithValues.NAME,
      status: listWithValues.STATUS === 1,
      hasInUseValues: mappedValues.some(v => v.inUse),
      values: mappedValues
    } as AppList;
  }, 'getListByName');

  cacheManager.set(cacheKey, data, CACHE_TTL);
  return data;
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

    const listWithValues = { ...list, t_value_list: values || [] } as ListDB;

    // Verificar qué valores están en uso
    const inUseSet = await checkValuesInUse(supabase, listWithValues.NAME, listWithValues.t_value_list || []);

    const mappedValues = (listWithValues.t_value_list || []).map(v => mapValue(v, inUseSet));

    return {
      id: String(listWithValues.LIST_ID),
      name: listWithValues.NAME,
      status: listWithValues.STATUS === 1,
      hasInUseValues: mappedValues.some(v => v.inUse),
      values: mappedValues
    } as AppList;
  }, 'getListById');

  return data || null;
};

/**
 * Asegura que los prefijos telefónicos existan en la lista PREFIJO.
 * Ahora usa PREFIJO como lista canónica (antes usaba CODIGOS_AREA).
 */
export const ensurePhonePrefixesSeeded = async (): Promise<void> => {
  try {
    let list: AppList | null = null;
    try {
      list = await getListByName('PREFIJO');
    } catch (e: unknown) {
      const code = (e as any)?.code;
      if (code === '404') {
        list = await createList('PREFIJO');
      } else {
        throw e;
      }
    }
    const existing = (list?.values || []).map(v => String(v.name).toUpperCase());
    const prefixes = ['0412', '0414', '0416', '0424', '0426', '0212', '0255', '0422'];
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
    result[keyToUse] = (list.t_value_list || []).map(v => mapValue(v));
  });

  cacheManager.set(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Get phone prefixes (public endpoint - no auth required)
 * Ahora lee de PREFIJO (antes usaba CODIGOS_AREA)
 */
export const getPhonePrefixes = async () => {
  return await dbManager.withRetry(async (supabase) => {
    const { data: list } = await supabase
      .from('t_list')
      .select('LIST_ID')
      .eq('NAME', 'PREFIJO')
      .eq('STATUS', 1)
      .single();

    if (!list) {
      return [];
    }

    const { data: values } = await supabase
      .from('t_value_list')
      .select('NAME, ABBREVIATION')
      .eq('LIST_ID', list.LIST_ID)
      .eq('STATUS', 1)
      .order('NAME');

    return (values || []).map(v => ({
      value: v.NAME,
      label: v.ABBREVIATION || v.NAME
    }));
  });
};
