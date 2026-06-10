import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import * as personService from '../services/person.service.js';

const TABLE_NAME = 't_institution_manager';
const PIVOT_TABLE = 't_institution_manager_institution';
const CACHE_PREFIX_RESP = 'institutional-responsibles:';
const CACHE_KEY_RESP_LIST = `${CACHE_PREFIX_RESP}list`;
const CACHE_KEY_RESP_BY_CI = (ci: string) => `${CACHE_PREFIX_RESP}by-ci:${ci}`;
const CACHE_TTL = 300000; // 5 minutos

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('[DB Error Controller]:', error);
  const dbError = error as { message?: string; details?: string; code?: string; status?: number };

  let userMessage = 'Error en la base de datos';
  let statusCode = dbError.status || 500;

  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
    statusCode = 400;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un responsable con esta cédula';
    statusCode = 400;
  } else if (dbError.code === '23503') {
    userMessage = 'Error: La institución seleccionada no es válida o no existe';
    statusCode = 400;
  } else if (dbError.code === '22001') {
    userMessage = 'Error: Los datos ingresados exceden el límite permitido. Verifique la longitud de los campos.';
    statusCode = 400;
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '42703' || (dbError.message && dbError.message.includes('column') && dbError.message.includes('not exist'))) {
    userMessage = 'Error estructural: Un campo requerido no existe en su base de datos. Por favor, contacte al administrador.';
  } else if (dbError.code === 'PGRST116' || dbError.code === '404' || dbError.status === 404) {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(statusCode).json({
    message: userMessage,
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code,
    raw: dbError
  });
};

// ============================================================
// Types
// ============================================================

interface DBPersonJoin {
  person_id: number;
  ci: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
}

interface DBInstitutionalResponsible {
  MANAGER_ID: number;
  person_id: number;
  CREATION_DATE: string;
  STATUS: number;
  TITLE: string | null;
  t_persons: DBPersonJoin;
  institutions?: Array<{
    institutionId: string;
    institutionName: string;
    cargo: string;
  }>;
}

// ============================================================
// Helpers
// ============================================================

const MANAGER_COLUMNS = `MANAGER_ID, person_id, CREATION_DATE, STATUS, TITLE`;
const PERSON_JOIN = `t_persons!inner(person_id, ci, first_name, middle_name, last_name, second_last_name, email, phone, gender)`;

const getInstitutionsForManager = async (supabase: any, managerId: number) => {
  const { data: pivotData, error: pivotError } = await supabase
    .from(PIVOT_TABLE)
    .select('INSTITUTION_ID, cargo')
    .eq('MANAGER_ID', managerId);

  if (pivotError || !pivotData || pivotData.length === 0) return [];

  const institutionIds = pivotData.map((d: any) => d.INSTITUTION_ID ?? d.institution_id);

  const { data: instData } = await supabase
    .from('t_institution')
    .select('INSTITUTION_ID, INSTITUTION_NAME')
    .in('INSTITUTION_ID', institutionIds);

  const instMap = new Map<number, string>((instData || []).map((i: any) => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

  return pivotData.map((p: any) => {
    const iId = p.INSTITUTION_ID ?? p.institution_id;
    return {
      institutionId: String(iId),
      institutionName: instMap.get(iId) || 'N/A',
      cargo: p.cargo || p.CARGO || ''
    };
  });
};

const mapDBToFrontend = (r: DBInstitutionalResponsible) => {
  const p = r.t_persons;
  return {
    responsibleId: String(r.MANAGER_ID),
    personId: String(r.person_id),
    identificationPrefix: p.ci.includes('-') ? p.ci.split('-')[0] : 'V',
    identificationNumber: p.ci.includes('-') ? p.ci.split('-')[1] : p.ci,
    firstName: p.first_name,
    middleName: p.middle_name || undefined,
    lastName: p.last_name,
    secondLastName: p.second_last_name || undefined,
    phone: p.phone,
    email: p.email,
    title: r.TITLE || undefined,
    cargo: r.institutions?.[0]?.cargo || undefined,
    institutions: r.institutions || [],
    status: r.STATUS === 1,
    registrationDate: r.CREATION_DATE
  };
};

function extractPersonData(body: any) {
  return {
    ci: `${body.identificationPrefix || 'V'}-${body.identificationNumber}`,
    firstName: String(body.firstName || '').toUpperCase(),
    middleName: body.middleName ? String(body.middleName).toUpperCase() : null,
    lastName: String(body.lastName || '').toUpperCase(),
    secondLastName: body.secondLastName ? String(body.secondLastName).toUpperCase() : null,
    email: String(body.email || '').toUpperCase(),
    phone: body.phone || null,
  };
}

// ============================================================
// LIST
// ============================================================

export const getInstitutionalResponsibles = async (_req: Request, res: Response) => {
  const cacheKey = CACHE_KEY_RESP_LIST;
  try {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: responsibles, error } = await supabase
        .from(TABLE_NAME)
        .select(`${MANAGER_COLUMNS}, ${PERSON_JOIN}`)
        .order('first_name', { ascending: true, referencedTable: 't_persons' });

      if (error) throw error;

      // Obtener instituciones desde tabla pivote
      const { data: instData } = await supabase.from('t_institution').select('INSTITUTION_ID, INSTITUTION_NAME');
      const instMap = new Map<number, string>((instData || []).map((i: any) => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

      const { data: pivotData } = await supabase
        .from(PIVOT_TABLE)
        .select('MANAGER_ID, INSTITUTION_ID, cargo');

      // Agrupar instituciones por manager
      const managerInstitutions = new Map<number, Array<{ institutionId: string; institutionName: string; cargo: string }>>();
      (pivotData || []).forEach((p: any) => {
        const mKey = p.MANAGER_ID ?? p.manager_id;
        const iKey = p.INSTITUTION_ID ?? p.institution_id;
        if (mKey !== undefined && iKey !== undefined) {
          const existing = managerInstitutions.get(mKey) || [];
          existing.push({
            institutionId: String(iKey),
            institutionName: instMap.get(iKey) || 'N/A',
            cargo: p.cargo || p.CARGO || ''
          });
          managerInstitutions.set(mKey, existing);
        }
      });

      return (responsibles || []).map((r: any) => ({
        ...r,
        institutions: managerInstitutions.get(r.MANAGER_ID) || [],
      })) as unknown as DBInstitutionalResponsible[];
    }, 'getInstitutionalResponsibles');

    const result = data.map(mapDBToFrontend);
    cacheManager.set(cacheKey, result, CACHE_TTL);
    res.json(result);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// GET BY CI
// ============================================================

export const getInstitutionalResponsibleByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;
    const cacheKey = CACHE_KEY_RESP_BY_CI(ci);

    const cached = cacheManager.get(cacheKey);
    if (cached) return res.json(cached);

    const person = await personService.getPersonByCi(ci);
    if (!person) {
      return res.status(200).json({ message: 'Responsable no encontrado', data: null });
    }

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: responsible, error } = await supabase
        .from(TABLE_NAME)
        .select(`${MANAGER_COLUMNS}, ${PERSON_JOIN}`)
        .eq('person_id', person.personId)
        .maybeSingle();

      if (error) throw error;
      if (!responsible) return null;

      const institutions = await getInstitutionsForManager(supabase, responsible.MANAGER_ID);
      return { ...responsible, institutions } as unknown as DBInstitutionalResponsible;
    }, 'getInstitutionalResponsibleByCi');

    if (!data) {
      // Persona existe pero no como responsable institucional → devolver datos de persona
      return res.json({
        data: null,
        person: {
          identificationPrefix: person.prefixCi,
          identificationNumber: person.identificationNumber,
          firstName: person.firstName,
          middleName: person.middleName || '',
          lastName: person.lastName,
          secondLastName: person.secondLastName || '',
          email: person.email,
          phone: person.phone || '',
          birthDate: person.birthDate || '',
          gender: person.gender || '',
          address: person.address || '',
          maritalStatus: person.maritalStatus || '',
        }
      });
    }

    cacheManager.set(cacheKey, { data: mapDBToFrontend(data) }, CACHE_TTL);
    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// CREATE
// ============================================================

export const createInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const r = req.body;
    console.log('[createInstitutionalResponsible] Request body:', JSON.stringify(r));

    // Parsear instituciones
    let institutions: Array<{ institutionId: string; cargo: string }> = [];

    if (r.institutions && Array.isArray(r.institutions)) {
      institutions = r.institutions.map((inst: any) => ({
        institutionId: String(inst.institutionId),
        cargo: inst.cargo || ''
      }));
    } else if (r.institutionIds && Array.isArray(r.institutionIds)) {
      institutions = r.institutionIds.map((id: string) => ({
        institutionId: String(id),
        cargo: r.cargo || ''
      }));
    } else if (r.institutionId) {
      institutions = [{ institutionId: String(r.institutionId), cargo: r.cargo || '' }];
    }

    const validInstitutions = institutions.filter(inst => {
      const num = parseInt(inst.institutionId);
      return !isNaN(num) && num > 0;
    });

    if (institutions.length > 0 && validInstitutions.length === 0) {
      return res.status(400).json({ message: 'Los IDs de institución deben ser números válidos' });
    }

    const personData = extractPersonData(r);
    const managerCi = personData.ci;

    // Validar duplicado de email (entre distintas personas)
    if (r.email) {
      const existingPerson = await personService.getPersonByCi(managerCi);
      const excludePersonId = existingPerson?.personId;
      const emailCheck = await personService.validateUniqueEmail(r.email, excludePersonId);
      if (!emailCheck.available) {
        return res.status(400).json({ message: `El correo ${r.email} ya está registrado por otra persona` });
      }
    }

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Buscar persona existente por CI o crear nueva
      const newPerson = await personService.findOrCreatePerson(personData, supabase);

      // 2. Insertar manager
      const dbData = {
        person_id: newPerson.personId,
        STATUS: r.status === false ? 0 : 1,
        CREATION_DATE: new Date().toISOString(),
        INSTITUTION_ID: null,
        cargo: null,
        TITLE: r.title || null,
      };

      const { data: newManager, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select(`${MANAGER_COLUMNS}, ${PERSON_JOIN}`)
        .single();

      if (error) {
        console.error('[createInstitutionalResponsible] DB Insert Error:', error);
        throw error;
      }

      // 3. Insertar relaciones en tabla pivote
      if (validInstitutions.length > 0) {
        const pivotInserts = validInstitutions.map((inst: any) => ({
          MANAGER_ID: newManager.MANAGER_ID,
          INSTITUTION_ID: parseInt(inst.institutionId),
          cargo: inst.cargo ? String(inst.cargo).toUpperCase() : null
        }));

        const { error: pivotError } = await supabase
          .from(PIVOT_TABLE)
          .insert(pivotInserts);

        if (pivotError) {
          console.error('[createInstitutionalResponsible] Pivot Insert Error:', pivotError);
          await supabase.from(TABLE_NAME).delete().eq('MANAGER_ID', newManager.MANAGER_ID);
          throw pivotError;
        }
      }

      // 4. Obtener instituciones para devolver
      const instIds = validInstitutions.map((i: any) => parseInt(i.institutionId));
      const { data: instData } = await supabase
        .from('t_institution')
        .select('INSTITUTION_ID, INSTITUTION_NAME')
        .in('INSTITUTION_ID', instIds);

      const instMap = new Map<number, string>((instData || []).map((i: any) => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

      return {
        ...newManager,
        institutions: validInstitutions.map((inst: any) => ({
          institutionId: inst.institutionId,
          institutionName: instMap.get(parseInt(inst.institutionId)) || 'N/A',
          cargo: inst.cargo
        }))
      } as unknown as DBInstitutionalResponsible;
    }, 'createInstitutionalResponsible');

    cacheManager.delete(CACHE_KEY_RESP_LIST);

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// UPDATE
// ============================================================

export const updateInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = req.body;
    console.log(`[updateInstitutionalResponsible] Updating ID: ${id}, Body:`, JSON.stringify(r));

    const data = await dbManager.withRetry(async (supabase) => {
      // 0. Obtener registro actual
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select(`MANAGER_ID, person_id, STATUS, t_persons!inner(ci, email)`)
        .eq('MANAGER_ID', id)
        .single();

      if (!existing) {
        const err = new Error('Responsable no encontrado') as AppError;
        (err as any).status = 404;
        throw err;
      }

      const existingRow = existing as any;
      const personId = existingRow.person_id;

      const personData = extractPersonData(r);

      // Validar duplicados en t_persons si cambió CI
      if (r.identificationPrefix !== undefined || r.identificationNumber !== undefined) {
        const managerCi = personData.ci;
        if (managerCi !== existingRow.t_persons.ci) {
          const ciCheck = await personService.validateUniqueCi(managerCi, personId);
          if (!ciCheck.available) {
            const err = new Error('Ya existe un responsable con esa cédula') as AppError;
            (err as any).status = 400;
            throw err;
          }
        }
      }

      // 1. Actualizar t_persons
      await personService.updatePerson(personId, personData, supabase);

      // 2. Actualizar t_institution_manager
      const dbData: Record<string, unknown> = {};
      dbData.INSTITUTION_ID = null;

      if (r.status !== undefined) dbData.STATUS = r.status ? 1 : 0;
      if (r.title !== undefined) dbData.TITLE = r.title || null;

      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('MANAGER_ID', id);

      if (updateError) throw updateError;

      // 3. Actualizar tabla pivote si se enviaron instituciones
      if (r.institutions !== undefined) {
        const newInstitutions = (r.institutions as Array<{ institutionId: string; cargo: string }>)
          .map(inst => ({
            institutionId: parseInt(inst.institutionId),
            cargo: inst.cargo ? String(inst.cargo).toUpperCase() : ''
          }))
          .filter(inst => !isNaN(inst.institutionId) && inst.institutionId > 0);

        await supabase.from(PIVOT_TABLE).delete().eq('MANAGER_ID', id);

        if (newInstitutions.length > 0) {
          const pivotInserts = newInstitutions.map(inst => ({
            MANAGER_ID: parseInt(id),
            INSTITUTION_ID: inst.institutionId,
            cargo: inst.cargo || null
          }));

          const { error: pivotError } = await supabase.from(PIVOT_TABLE).insert(pivotInserts);
          if (pivotError) throw pivotError;
        }
      }

      // 4. Obtener datos actualizados
      const { data: updatedData, error: selectError } = await supabase
        .from(TABLE_NAME)
        .select(`${MANAGER_COLUMNS}, ${PERSON_JOIN}`)
        .eq('MANAGER_ID', id)
        .single();

      if (selectError) throw selectError;

      const institutions = await getInstitutionsForManager(supabase, parseInt(id));

      return { ...updatedData, institutions } as unknown as DBInstitutionalResponsible;
    });

    cacheManager.delete(CACHE_KEY_RESP_LIST);

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// DELETE (soft delete)
// ============================================================

export const deleteInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('MANAGER_ID', id);
      if (error) throw error;
    });
    cacheManager.delete(CACHE_KEY_RESP_LIST);
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// TOGGLE STATUS
// ============================================================

export const toggleInstitutionalResponsibleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('STATUS, person_id')
        .eq('MANAGER_ID', id)
        .single();

      const { data: updatedData, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('MANAGER_ID', id)
        .select(`${MANAGER_COLUMNS}, ${PERSON_JOIN}`)
        .single();

      if (error) throw error;

      // Sincronizar t_persons
      if (oldData?.person_id) {
        await personService.togglePersonStatus(oldData.person_id, status ? 1 : 0);
      }

      const institutions = await getInstitutionsForManager(supabase, parseInt(id));
      return { ...updatedData, institutions } as unknown as DBInstitutionalResponsible;
    });

    cacheManager.delete(CACHE_KEY_RESP_LIST);

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

// ============================================================
// CHECK AVAILABILITY
// ============================================================

export const checkIdAvailability = async (req: Request, res: Response) => {
  try {
    const { type, value, excludeId } = req.query;

    if (!type || !value) {
      return res.status(400).json({ message: 'Faltan parámetros: type y value son requeridos' });
    }

    if (type === 'ci') {
      const result = await personService.validateUniqueCi(value as string, excludeId ? parseInt(excludeId as string) : undefined);
      return res.json({ ...result, responsibleId: result.personId });
    }

    if (type === 'email') {
      const result = await personService.validateUniqueEmail(value as string, excludeId ? parseInt(excludeId as string) : undefined);
      return res.json({ ...result, responsibleId: result.personId });
    }

    return res.status(400).json({ message: 'Tipo de validación no válido. Use "ci" o "email"' });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

