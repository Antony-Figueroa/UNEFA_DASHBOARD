import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { Career, CareerDBRecord } from '../models/career.js';

const TABLE_NAME = 't_career';
const RELATION_TABLE = 't_career_internship_type';
const CACHE_PREFIX = 'careers:';
const CACHE_TTL = 3600000;
const CAREER_COLUMNS = 'CAREER_ID, CAREER_NAME, CAREER_CODE, MINIMUM_GRADE, STATUS, CAREER_ABBREVIATION, CAREER_TYPE';

const mapRecord = (career: Record<string, unknown>): Career => {
  const relationData = career[RELATION_TABLE] as unknown as { INTERNSHIP_TYPE_ID: number; PRIORITY: number }[] | undefined;
  const internshipTypeIds = relationData?.map(r => String(r.INTERNSHIP_TYPE_ID)) || [];
  const internshipPriorities = relationData?.map(r => r.PRIORITY).filter((p): p is number => p !== null && p !== undefined && !isNaN(p)) || [];
  const careerData = { ...career } as CareerDBRecord;
  delete careerData[RELATION_TABLE];
  const c = careerData;

    return {
      // CamelCase keys for frontend
      careerId: c.CAREER_ID ?? undefined,
      careerName: (c.CAREER_NAME as string) ?? undefined,
      careerCode: (c.CAREER_CODE as unknown as number) ?? undefined,
      minimumGrade: (c.MINIMUM_GRADE as unknown as number) ?? undefined,
      careerAbbreviation: (c.CAREER_ABBREVIATION as string) ?? undefined,
      careerType: (c.CAREER_TYPE as string) ?? undefined,
      status: typeof c.STATUS === 'number' ? c.STATUS === 1 : undefined,
      internshipTypeIds: internshipTypeIds || [],
      internshipPriorities: internshipPriorities || [],
      // Uppercase keys for backward compatibility (frontend legacy)
      CAREER_ID: c.CAREER_ID,
      CAREER_NAME: c.CAREER_NAME,
      CAREER_CODE: c.CAREER_CODE,
      MINIMUM_GRADE: c.MINIMUM_GRADE,
      CAREER_ABBREVIATION: c.CAREER_ABBREVIATION,
      CAREER_TYPE: c.CAREER_TYPE,
      STATUS: c.STATUS,
      // Mantener metadatos / auditoría
      CREATION_DATE: c.CREATION_DATE,
      MODIF_USER_ID: c.MODIF_USER_ID,
      MODIF_USER_DATE: c.MODIF_USER_DATE,
      ELIM_USER_ID: c.ELIM_USER_ID,
      ELIM_USER_DATE: c.ELIM_USER_DATE,
      REST_USER_ID: c.REST_USER_ID,
      REST_USER_DATE: c.REST_USER_DATE,
      // Información de uso (opcional para el frontend)
      isInUse: (career.IS_IN_USE as boolean) ?? false,
      hasPendingEvaluations: (career.HAS_PENDING_EVALUATIONS as boolean) ?? false
    } as Career & Record<string, unknown>;
};

export const getCareers = async () => {
  const cacheKey = `${CACHE_PREFIX}list`;
  // Temporalmente deshabilitar caché para debug
  // const cached = cacheManager.get(cacheKey);
  // if (cached) return cached;
  cacheManager.delete(cacheKey);

  const transformed = await dbManager.withRetry(async (supabase) => {
    // 1. Obtener carreras básicas
    const { data: careers, error } = await supabase
      .from(TABLE_NAME)
      .select(CAREER_COLUMNS)
      .order('CAREER_NAME', { ascending: true });

    if (error) throw error;

    // 2. Obtener relaciones carrera-tipo de práctica
    const { data: careerInternshipRelations, error: relError } = await supabase
      .from(RELATION_TABLE)
      .select('CAREER_ID, INTERNSHIP_TYPE_ID');

    if (relError) throw relError;

    // 3. Obtener tipos de práctica con sus prioridades
    const { data: internshipTypes, error: typeError } = await supabase
      .from('t_internship_type')
      .select('INTERNSHIP_TYPE_ID, PRIORITY');

    if (typeError) throw typeError;

    // 4. Crear mapa de priorities por career_id y por internship_type_id
    const careerPrioritiesMap: Record<number, Record<number, number>> = {};
    const careerTypeIdsMap: Record<number, string[]> = {};

    // Inicializar mapas
    (careers || []).forEach((c: Record<string, unknown>) => {
      careerPrioritiesMap[c.CAREER_ID as number] = {};
      careerTypeIdsMap[c.CAREER_ID as number] = [];
    });

    // Llenar mapas - crear un mapa de priority por internship_type_id
    const priorityByTypeId: Record<number, number> = {};
    (internshipTypes || []).forEach((t: { INTERNSHIP_TYPE_ID: number; PRIORITY: number }) => {
      priorityByTypeId[t.INTERNSHIP_TYPE_ID] = t.PRIORITY;
    });

    (careerInternshipRelations || []).forEach((rel: { CAREER_ID: number; INTERNSHIP_TYPE_ID: number }) => {
      if (careerPrioritiesMap[rel.CAREER_ID]) {
        careerPrioritiesMap[rel.CAREER_ID][rel.INTERNSHIP_TYPE_ID] = priorityByTypeId[rel.INTERNSHIP_TYPE_ID] ?? 0;
        careerTypeIdsMap[rel.CAREER_ID].push(String(rel.INTERNSHIP_TYPE_ID));
      }
    });

    // 5. Unir con las carreras
    const result = (careers || []).map((c: Record<string, unknown>) => {
      const careerId = c.CAREER_ID as number;
      const relations = (careerTypeIdsMap[careerId] || []).map(typeId => ({
        INTERNSHIP_TYPE_ID: typeId,
        PRIORITY: careerPrioritiesMap[careerId]?.[parseInt(typeId)] ?? 0
      }));
      
      return mapRecord({
        ...c,
        [RELATION_TABLE]: relations
      });
    });

    // 6. Verificar uso de forma eficiente (estudiantes, instituciones, prácticas)
    const { data: studentUsage } = await supabase.from('t_students').select('CAREER_ID').eq('STATUS', 1);
    const { data: institutionUsage } = await supabase.from('t_institution').select('CAREER_ID').eq('STATUS', 1);
    const { data: practiceUsage } = await supabase.from('t_professional_practices').select('CAREER_ID').eq('STATUS', 1);

    // 7. Verificar si hay evaluaciones pendientes para la restricción de nota mínima
    const { data: pendingEvals } = await supabase
      .from('t_professional_practices')
      .select('CAREER_ID')
      .eq('STATUS', 1)
      .eq('INTERNSHIP_STATUS', 1);

    const usedIds = new Set([
      ...(studentUsage || []).map(s => String(s.CAREER_ID)),
      ...(institutionUsage || []).map(i => String(i.CAREER_ID)),
      ...(practiceUsage || []).map(p => String(p.CAREER_ID))
    ]);

    const pendingEvalIds = new Set((pendingEvals || []).map(p => String(p.CAREER_ID)));

    return result.map((career: Career) => {
      const careerId = String(career.careerId);
      return {
        ...career,
        isInUse: usedIds.has(careerId),
        hasPendingEvaluations: pendingEvalIds.has(careerId)
      };
    });
  }, 'getCareers');

  cacheManager.set(cacheKey, transformed, CACHE_TTL);
  return transformed;
};

export const getCareersByInternshipType = async (typeId: string | number) => {
  const cacheKey = `${CACHE_PREFIX}type:${typeId}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const transformed = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(RELATION_TABLE)
      .select(`
        t_career (
          ${CAREER_COLUMNS},
          ${RELATION_TABLE} (
            INTERNSHIP_TYPE_ID
          )
        )
      `)
      .eq('INTERNSHIP_TYPE_ID', typeId);

    if (error) throw error;

    return (data || [])
      .map((item: any) => item.t_career)
      .filter(Boolean)
      .map((c: Record<string, unknown>) => mapRecord(c));
  }, 'getCareersByInternshipType');

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

export const getCareerByCode = async (code: string) => {
  try {
    const career = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`*, ${RELATION_TABLE} ( INTERNSHIP_TYPE_ID )`)
        .eq('CAREER_CODE', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapRecord(data as Record<string, unknown>);
    });

    return career;
  } catch (error) {
    console.error("[careersService] Error in getCareerByCode:", error);
    return null;
  }
};

export const createCareer = async (payload: Record<string, unknown>, userId: number = 1) => {
  const { INTERNSHIP_TYPE_IDS, ...careerData } = payload;
  const now = new Date().toISOString();

  // Asegurar mayúsculas
  const careerName = String(careerData.CAREER_NAME || '').toUpperCase();
  const careerAbbreviation = String(careerData.CAREER_ABBREVIATION || '').toUpperCase();
  const careerType = String(careerData.CAREER_TYPE || 'LARGA').toUpperCase();

  const result = await dbManager.withRetry(async (supabase) => {
    // Validar duplicados por nombre o código (ignorando el registro actual en caso de edición)
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('CAREER_ID')
      .or(`CAREER_NAME.eq."${careerName}",CAREER_CODE.eq.${careerData.CAREER_CODE}`)
      .eq('STATUS', 1)
      .maybeSingle();

    if (existing) {
      throw { code: 'BUSINESS_RULE_VIOLATION', message: 'Ya existe una carrera con ese nombre o código' };
    }

    const { data: newCareer, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          CAREER_CODE: careerData.CAREER_CODE,
          CAREER_NAME: careerName,
          MINIMUM_GRADE: careerData.MINIMUM_GRADE,
          CAREER_ABBREVIATION: careerAbbreviation,
          CAREER_TYPE: careerType,
          STATUS: careerData.STATUS ?? 1,
          CREATION_DATE: now,
          MODIF_USER_ID: userId,
          MODIF_USER_DATE: now,
          ELIM_USER_ID: userId,
          ELIM_USER_DATE: now,
          REST_USER_ID: userId,
          REST_USER_DATE: now
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (INTERNSHIP_TYPE_IDS && Array.isArray(INTERNSHIP_TYPE_IDS) && INTERNSHIP_TYPE_IDS.length > 0) {
      const relations = (INTERNSHIP_TYPE_IDS as string[]).map(id => ({ 
        CAREER_ID: (newCareer as CareerDBRecord).CAREER_ID, 
        INTERNSHIP_TYPE_ID: id 
      }));
      const { error: relErr } = await supabase.from(RELATION_TABLE).insert(relations);
      if (relErr) throw relErr;
    }

      return mapRecord({ ...(newCareer as Record<string, unknown>), [RELATION_TABLE]: [] });
  }, 'createCareer');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
  return result;
};

export const updateCareer = async (id: string, payload: Record<string, unknown>, userId: number = 1) => {
  const { INTERNSHIP_TYPE_IDS, ...updates } = payload;
  const now = new Date().toISOString();
  const updateData = updates as Record<string, unknown>;
  delete updateData.CAREER_ID;
  delete updateData.CREATION_DATE;

  // Asegurar mayúsculas en campos relevantes
  if (updateData.CAREER_NAME) updateData.CAREER_NAME = String(updateData.CAREER_NAME).toUpperCase();
  if (updateData.CAREER_ABBREVIATION) updateData.CAREER_ABBREVIATION = String(updateData.CAREER_ABBREVIATION).toUpperCase();
  if (updateData.CAREER_TYPE) updateData.CAREER_TYPE = String(updateData.CAREER_TYPE).toUpperCase();

  const result = await dbManager.withRetry(async (supabase) => {
    // Obtener datos actuales para comparar y evitar validaciones innecesarias
    const { data: current, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('CAREER_ID', id)
      .single();

    if (fetchError || !current) throw { code: 'NOT_FOUND', message: 'Carrera no encontrada' };

    // 0. Validar duplicados solo si se está cambiando nombre o código
    const isChangingName = updateData.CAREER_NAME && String(updateData.CAREER_NAME).toUpperCase() !== current.CAREER_NAME;
    
    // Convertir ambos a número para una comparación segura
    const newCode = updateData.CAREER_CODE !== undefined ? Number(updateData.CAREER_CODE) : undefined;
    const currentCode = current.CAREER_CODE !== null ? Number(current.CAREER_CODE) : undefined;
    const isChangingCode = newCode !== undefined && newCode !== currentCode;

    if (isChangingName || isChangingCode) {
      const name = isChangingName ? String(updateData.CAREER_NAME).toUpperCase() : undefined;
      const code = isChangingCode ? newCode : undefined;

      const query = supabase.from(TABLE_NAME).select('CAREER_ID').neq('CAREER_ID', id).eq('STATUS', 1);
      
      const orConditions: string[] = [];
      if (name) orConditions.push(`CAREER_NAME.eq."${name}"`);
      if (code) orConditions.push(`CAREER_CODE.eq.${code}`);
      
      if (orConditions.length > 0) {
        const { data: existing } = await query.or(orConditions.join(',')).maybeSingle();
        if (existing) {
          throw { code: 'BUSINESS_RULE_VIOLATION', message: 'Ya existe otra carrera con ese nombre o código' };
        }
      }
    }

    // 1. Verificar si la carrera está en uso para restricciones generales
    const { data: students } = await supabase.from('t_students').select('STUDENTS_ID').eq('CAREER_ID', id).eq('STATUS', 1).limit(1);
    const { data: institutions } = await supabase.from('t_institution').select('INSTITUTION_ID').eq('CAREER_ID', id).eq('STATUS', 1).limit(1);
    const { data: practices } = await supabase.from('t_professional_practices').select('PROFESSIONAL_PRACTICE_ID').eq('CAREER_ID', id).eq('STATUS', 1).limit(1);
    
    const isInUse = (students && students.length > 0) || (institutions && institutions.length > 0) || (practices && practices.length > 0);

    // El código NUNCA se puede editar una vez creado
    if (isChangingCode) {
      throw { code: 'BUSINESS_RULE_VIOLATION', message: 'No se puede editar el código de una carrera registrada' };
    }

    // El tipo de carrera no se puede editar si está en uso
    if (isInUse && updateData.CAREER_TYPE && updateData.CAREER_TYPE !== current.CAREER_TYPE) {
      throw { code: 'BUSINESS_RULE_VIOLATION', message: 'No se puede editar el tipo de una carrera en uso' };
    }

    // 2. Verificar restricción de nota mínima solo si cambia
    const newMinGrade = updateData.MINIMUM_GRADE !== undefined ? Number(updateData.MINIMUM_GRADE) : undefined;
    const currentMinGrade = current.MINIMUM_GRADE !== null ? Number(current.MINIMUM_GRADE) : undefined;
    
    if (newMinGrade !== undefined && newMinGrade !== currentMinGrade) {
      // Buscar estudiantes de esta carrera
      const { data: careerStudents } = await supabase
        .from('t_students')
        .select('STUDENTS_ID')
        .eq('CAREER_ID', id);

      if (careerStudents && careerStudents.length > 0) {
        const studentIds = careerStudents.map(s => s.STUDENTS_ID);
        
        // Buscar prácticas con estatus de evaluación pendiente para estos estudiantes
        const { data: pendingEval } = await supabase
          .from('t_professional_practices')
          .select('PROFESSIONAL_PRACTICE_ID')
          .eq('STATUS', 1)
          .eq('INTERNSHIP_STATUS', 1) // Asumimos 1 como cursando/pendiente de evaluación
          .in('STUDENTS_ID', studentIds)
          .limit(1);

        if (pendingEval && pendingEval.length > 0) {
          throw { code: 'BUSINESS_RULE_VIOLATION', message: 'No se puede editar la nota mínima si hay estudiantes pendientes por evaluar' };
        }
      }
    }

    const { data: updatedCareer, error } = await supabase
      .from(TABLE_NAME)
      .update({ ...updateData, MODIF_USER_DATE: now, MODIF_USER_ID: userId })
      .eq('CAREER_ID', id)
      .select()
      .single();

    if (error) throw error;

    if (INTERNSHIP_TYPE_IDS !== undefined && Array.isArray(INTERNSHIP_TYPE_IDS)) {
      await supabase.from(RELATION_TABLE).delete().eq('CAREER_ID', id);
      const typeIds = INTERNSHIP_TYPE_IDS as string[];
      if (typeIds.length > 0) {
        const relations = typeIds.map(typeId => ({ CAREER_ID: id, INTERNSHIP_TYPE_ID: typeId }));
        const { error: relErr } = await supabase.from(RELATION_TABLE).insert(relations);
        if (relErr) throw relErr;
      }
    }

      return mapRecord({ ...(updatedCareer as Record<string, unknown>), [RELATION_TABLE]: [] });
  }, 'updateCareer');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
  return result;
};

export const deleteCareer = async (id: string, userId: number = 1) => {
  await dbManager.withRetry(async (supabase) => {
    const now = new Date().toISOString();
    // 1. Confirmar existencia del registro
    const { data: existing, error: existError } = await supabase
      .from(TABLE_NAME)
      .select('CAREER_ID')
      .eq('CAREER_ID', id)
      .single();

    if (existError || !existing) {
      throw { code: 'BUSINESS_RULE_VIOLATION', message: 'La carrera no existe o ya ha sido eliminada' };
    }

    // 2. Verificar si está en uso antes de "eliminar" (desactivar)
    const { data: students } = await supabase.from('t_students').select('STUDENTS_ID').eq('CAREER_ID', id).eq('STATUS', 1).limit(1);
    const { data: institutions } = await supabase.from('t_institution').select('INSTITUTION_ID').eq('CAREER_ID', id).eq('STATUS', 1).limit(1);
    const { data: practices } = await supabase.from('t_professional_practices').select('PROFESSIONAL_PRACTICE_ID').eq('CAREER_ID', id).eq('STATUS', 1).limit(1);

    if ((students && students.length > 0) || (institutions && institutions.length > 0) || (practices && practices.length > 0)) {
      let usageLocation = '';
      if (students?.length) usageLocation = 'Estudiantes';
      else if (institutions?.length) usageLocation = 'Instituciones';
      else if (practices?.length) usageLocation = 'Prácticas Profesionales';
      
      throw { code: 'BUSINESS_RULE_VIOLATION', message: `No se puede eliminar la carrera porque está siendo usada en: ${usageLocation}` };
    }

    const { error } = await supabase.from(TABLE_NAME).update({ STATUS: 0, ELIM_USER_ID: userId, ELIM_USER_DATE: now }).eq('CAREER_ID', id);
    if (error) throw error;
  }, 'deleteCareer');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
};

export const bulkDeleteCareers = async (ids: (string | number)[], userId: number = 1) => {
  await dbManager.withRetry(async (supabase) => {
    const now = new Date().toISOString();
    // 1. Verificar si alguna de las carreras está en uso
    const { data: students } = await supabase.from('t_students').select('CAREER_ID').in('CAREER_ID', ids).eq('STATUS', 1);
    const { data: institutions } = await supabase.from('t_institution').select('CAREER_ID').in('CAREER_ID', ids).eq('STATUS', 1);
    const { data: practices } = await supabase.from('t_professional_practices').select('CAREER_ID').in('CAREER_ID', ids).eq('STATUS', 1);

    const usedIds = new Set([
      ...(students || []).map(s => String(s.CAREER_ID)),
      ...(institutions || []).map(i => String(i.CAREER_ID)),
      ...(practices || []).map(p => String(p.CAREER_ID))
    ]);

    if (usedIds.size > 0) {
      throw { 
        code: 'BUSINESS_RULE_VIOLATION', 
        message: `No se pueden eliminar ${usedIds.size} de las carreras seleccionadas porque están siendo utilizadas.` 
      };
    }

    const { error } = await supabase.from(TABLE_NAME).update({ STATUS: 0, ELIM_USER_ID: userId, ELIM_USER_DATE: now }).in('CAREER_ID', ids);
    if (error) throw error;
  }, 'bulkDeleteCareers');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
};

export const bulkRestoreCareers = async (ids: (string | number)[], userId: number = 1) => {
  await dbManager.withRetry(async (supabase) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from(TABLE_NAME).update({ STATUS: 1, REST_USER_ID: userId, REST_USER_DATE: now }).in('CAREER_ID', ids);
    if (error) throw error;
  }, 'bulkRestoreCareers');

  cacheManager.deleteByPrefix(CACHE_PREFIX);
};
