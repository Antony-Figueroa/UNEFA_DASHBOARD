import { dbManager } from '../lib/db-manager';
import { cacheManager } from '../lib/cache-manager';
import { AppList, ValueListDB } from '../models/list';

const LISTS_TABLE = 't_list';
const VALUES_TABLE = 't_value_list';
const CACHE_PREFIX = 'lists:';
const CACHE_TTL = 3600000;

const mapValue = (v: ValueListDB) => ({
  id: String(v.VALUE_LIST_ID),
  name: v.NAME,
  abbreviation: v.ABBREVIATION,
  listId: String(v.LIST_ID),
  status: v.STATUS === 1
});

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
      t_value_list: (values || []).filter((v: any) => v.LIST_ID === list.LIST_ID)
    }));

    return mappedLists as any[];
  }, 'getAllLists');

  const result = (data as any[]).map(l => ({
    id: String(l.LIST_ID),
    name: l.NAME,
    status: l.STATUS === 1,
    values: (l.t_value_list || []).map(mapValue)
  }));

  cacheManager.set(cacheKey, result, CACHE_TTL);
  return result;
};

export const getListByName = async (name: string) => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data: list, error: listError } = await supabase
      .from(LISTS_TABLE)
      .select('*')
      .eq('NAME', name)
      .eq('STATUS', 1)
      .single();

    if (listError) {
      if ((listError as any).code === 'PGRST116') throw { code: '404', message: `Lista '${name}' no encontrada` };
      throw listError;
    }

    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('*')
      .eq('LIST_ID', list.LIST_ID)
      .eq('STATUS', 1);

    if (valuesError) throw valuesError;

    return { ...list, t_value_list: values || [] };
  }, 'getListByName');

  return {
    id: String((data as any).LIST_ID),
    name: (data as any).NAME,
    status: (data as any).STATUS === 1,
    values: ((data as any).t_value_list || []).map(mapValue)
  };
};

export const getMultipleListsByNames = async (names: string[]) => {
  const cacheKey = `${CACHE_PREFIX}multiple:${names.sort().join(',')}`;
  const cached = cacheManager.get<Record<string, any> | null>(cacheKey);
  if (cached) return cached;

  const data = await dbManager.withRetry(async (supabase) => {
    const { data: lists, error: listsError } = await supabase
      .from(LISTS_TABLE)
      .select('LIST_ID, NAME, STATUS')
      .in('NAME', names)
      .eq('STATUS', 1);

    if (listsError) throw listsError;

    const listIds = (lists || []).map((l: any) => l.LIST_ID);
    const { data: values, error: valuesError } = await supabase
      .from(VALUES_TABLE)
      .select('VALUE_LIST_ID, NAME, ABBREVIATION, LIST_ID, STATUS')
      .in('LIST_ID', listIds)
      .eq('STATUS', 1);

    if (valuesError) throw valuesError;

    const mappedLists = (lists || []).map((list: any) => ({
      ...list,
      t_value_list: (values || []).filter((v: any) => v.LIST_ID === list.LIST_ID)
    }));

    return mappedLists as any[];
  }, 'getMultipleListsByNames');

  const result: Record<string, any[]> = {};
  (data as any[]).forEach(list => {
    result[list.NAME] = (list.t_value_list || []).map(mapValue);
  });

  cacheManager.set(cacheKey, result, CACHE_TTL);
  return result;
};
