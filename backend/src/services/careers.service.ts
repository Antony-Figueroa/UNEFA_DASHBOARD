import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { Career, CareerDBRecord } from '../models/career.js';

const TABLE_NAME = 't_career';
const RELATION_TABLE = 't_career_internship_type';
const CACHE_PREFIX = 'careers:';
const CACHE_TTL = 3600000;
const CAREER_COLUMNS = 'CAREER_ID, CAREER_NAME, CAREER_CODE, MINIMUM_GRADE, STATUS, CAREER_ABBREVIATION';

const mapRecord = (career: Record<string, unknown>): Career => {
  const internshipTypeIds = (career[RELATION_TABLE] as { INTERNSHIP_TYPE_ID: string }[])?.map(r => r.INTERNSHIP_TYPE_ID) || [];
  const careerData = { ...career } as CareerDBRecord;
  delete (careerData as any)[RELATION_TABLE];
    const c = career as CareerDBRecord;

    return {
      // CamelCase keys for frontend
      careerId: c.CAREER_ID ?? undefined,
      careerName: (c.CAREER_NAME as string) ?? undefined,
      careerCode: (c.CAREER_CODE as unknown as number) ?? undefined,
      minimumGrade: (c.MINIMUM_GRADE as unknown as number) ?? undefined,
      careerAbbreviation: (c.CAREER_ABBREVIATION as string) ?? undefined,
      status: typeof c.STATUS === 'number' ? c.STATUS === 1 : undefined,
      internshipTypeIds: internshipTypeIds || [],
      // Uppercase keys for backward compatibility (frontend legacy)
      CAREER_ID: c.CAREER_ID,
      CAREER_NAME: c.CAREER_NAME,
      CAREER_CODE: c.CAREER_CODE,
      MINIMUM_GRADE: c.MINIMUM_GRADE,
      CAREER_ABBREVIATION: c.CAREER_ABBREVIATION,
      STATUS: c.STATUS,
      // Mantener metadatos / auditoría
      CREATION_DATE: c.CREATION_DATE,
      MODIF_USER_ID: c.MODIF_USER_ID,
      MODIF_USER_DATE: c.MODIF_USER_DATE,
      ELIM_USER_ID: c.ELIM_USER_ID,
      ELIM_USER_DATE: c.ELIM_USER_DATE,
      REST_USER_ID: c.REST_USER_ID,
      REST_USER_DATE: c.REST_USER_DATE
    } as Career & Record<string, unknown>;
};

export const getCareers = async () => {
  const cacheKey = `${CACHE_PREFIX}list`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const transformed = await dbManager.withRetry(async (supabase) => {
    const { data: careers, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        ${CAREER_COLUMNS},
        ${RELATION_TABLE} (
          INTERNSHIP_TYPE_ID
        )
      `)
      .order('CAREER_NAME', { ascending: true });

    if (error) throw error;

    return (careers || []).map((c: Record<string, unknown>) => mapRecord(c));
  }, 'getCareers');

  cacheManager.set(cacheKey, transformed, CACHE_TTL);
  return transformed;
};

export const getCareerById = async (id: string) => {
  const career = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`*, ${RELATION_TABLE} ( INTERNSHIP_TYPE_ID )`)
      .eq('CAREER_ID', id)
      .single();

    if (error) throw error;
    return mapRecord(data as Record<string, unknown>);
  });

  return career;
};

export const createCareer = async (payload: Record<string, unknown>) => {
  const { INTERNSHIP_TYPE_IDS, ...careerData } = payload;
  const now = new Date().toISOString();

  const result = await dbManager.withRetry(async (supabase) => {
    const { data: newCareer, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          CAREER_CODE: careerData.CAREER_CODE,
          CAREER_NAME: careerData.CAREER_NAME,
          MINIMUM_GRADE: careerData.MINIMUM_GRADE,
          CAREER_ABBREVIATION: careerData.CAREER_ABBREVIATION,
          STATUS: careerData.STATUS ?? 1,
          CREATION_DATE: now,
          MODIF_USER_ID: 1,
          MODIF_USER_DATE: now,
          ELIM_USER_ID: 1,
          ELIM_USER_DATE: now,
          REST_USER_ID: 1,
          REST_USER_DATE: now
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (INTERNSHIP_TYPE_IDS && Array.isArray(INTERNSHIP_TYPE_IDS) && INTERNSHIP_TYPE_IDS.length > 0) {
      const relations = (INTERNSHIP_TYPE_IDS as string[]).map(id => ({ CAREER_ID: (newCareer as any).CAREER_ID, INTERNSHIP_TYPE_ID: id }));
      const { error: relErr } = await supabase.from(RELATION_TABLE).insert(relations);
      if (relErr) throw relErr;
    }

      return mapRecord({ ...(newCareer as Record<string, unknown>), [RELATION_TABLE]: [] });
  }, 'createCareer');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
  return result;
};

export const updateCareer = async (id: string, payload: Record<string, unknown>) => {
  const { INTERNSHIP_TYPE_IDS, ...updates } = payload;
  const now = new Date().toISOString();
  delete (updates as any).CAREER_ID;
  delete (updates as any).CREATION_DATE;

  const result = await dbManager.withRetry(async (supabase) => {
    const { data: updatedCareer, error } = await supabase
      .from(TABLE_NAME)
      .update({ ...updates, MODIF_USER_DATE: now, MODIF_USER_ID: 1 })
      .eq('CAREER_ID', id)
      .select()
      .single();

    if (error) throw error;

    if (INTERNSHIP_TYPE_IDS !== undefined && Array.isArray(INTERNSHIP_TYPE_IDS)) {
      await supabase.from(RELATION_TABLE).delete().eq('CAREER_ID', id);
      if ((INTERNSHIP_TYPE_IDS as any[]).length > 0) {
        const relations = (INTERNSHIP_TYPE_IDS as any[]).map(typeId => ({ CAREER_ID: id, INTERNSHIP_TYPE_ID: typeId }));
        const { error: relErr } = await supabase.from(RELATION_TABLE).insert(relations);
        if (relErr) throw relErr;
      }
    }

      return mapRecord({ ...(updatedCareer as Record<string, unknown>), [RELATION_TABLE]: [] });
  }, 'updateCareer');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
  return result;
};

export const deleteCareer = async (id: string) => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase.from(TABLE_NAME).update({ STATUS: 0 }).eq('CAREER_ID', id);
    if (error) throw error;
  }, 'deleteCareer');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
};

export const bulkDeleteCareers = async (ids: unknown[]) => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase.from(TABLE_NAME).update({ STATUS: 0 }).in('CAREER_ID', ids as any[]);
    if (error) throw error;
  }, 'bulkDeleteCareers');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
};
