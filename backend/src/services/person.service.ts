import { SupabaseClient } from '@supabase/supabase-js';
import { dbManager } from '../lib/db-manager.js';
import { Response } from 'express';

// ============================================================
// TYPES
// ============================================================

export interface PersonDTO {
  personId: number;
  ci: string;
  prefixCi: string;
  identificationNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  address: string | null;
  maritalStatus: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonDTO {
  ci: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  address?: string | null;
  maritalStatus?: string | null;
  status?: number;
}

export interface UpdatePersonDTO {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  email?: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  address?: string | null;
  maritalStatus?: string | null;
  status?: number;
}

interface DBPersonRow {
  person_id: number;
  ci: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  birthdate: string | null;
  address: string | null;
  marital_status: string | null;
  status: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ERROR HANDLER
// ============================================================

interface AppError extends Error {
  code?: string;
  details?: string;
}

/**
 * Manejo estandarizado de errores para operaciones con t_persons.
 */
export const handlePersonError = (res: Response, error: unknown, defaultMessage = 'Error en operación de persona'): void => {
  console.error('[PersonService] Error:', error);
  const dbError = error as AppError;

  let userMessage = defaultMessage;
  let statusCode = 500;

  if (dbError.code === '23502') {
    statusCode = 400;
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    statusCode = 409;
    userMessage = 'Error: Ya existe una persona con esta cédula o correo electrónico';
  } else if (dbError.code === 'PGRST116' || dbError.code === '404') {
    statusCode = 404;
    userMessage = dbError.message || 'Persona no encontrada';
  }

  res.status(statusCode).json({
    message: userMessage,
    error: dbError.message || 'Unknown error',
    details: dbError.details,
    code: dbError.code
  });
};

// ============================================================
// CI UTILITIES
// ============================================================

/**
 * Divide una cédula en prefijo y número.
 * Ej: "V-12345678" → { prefix: "V", number: "12345678" }
 */
export const splitCi = (ci: string): { prefix: string; number: string } => {
  const parts = ci.split('-');
  if (parts.length === 2) {
    return { prefix: parts[0], number: parts[1] };
  }
  // Sin prefijo: asumimos "V" como default
  return { prefix: 'V', number: ci };
};

/**
 * Une prefijo y número en formato de cédula.
 * Ej: ("V", "12345678") → "V-12345678"
 */
export const joinCi = (prefix: string, number: string): string => {
  return `${prefix}-${number}`;
};

// ============================================================
// MAPPING
// ============================================================

/**
 * Convierte una fila de t_persons al formato del frontend.
 */
export const mapPersonToFrontend = (row: DBPersonRow): PersonDTO => {
  const { prefix, number } = splitCi(row.ci);
  return {
    personId: row.person_id,
    ci: row.ci,
    prefixCi: prefix,
    identificationNumber: number,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    secondLastName: row.second_last_name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    birthDate: row.birthdate,
    address: row.address,
    maritalStatus: row.marital_status,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// ============================================================
// CRUD OPERATIONS
// ============================================================

const TABLE_NAME = 't_persons';
const PERSON_COLUMNS = `
  person_id, ci, first_name, middle_name, last_name, second_last_name,
  email, phone, gender, birthdate, address, marital_status,
  status, created_at, updated_at
`;

/**
 * Obtiene todas las personas con paginación y búsqueda opcional.
 */
export const getPersons = async (options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: number | null;
} = {}): Promise<{ data: PersonDTO[]; total: number; page: number; limit: number; totalPages: number }> => {
  const { page = 1, limit = 50, search, status } = options;
  const offset = (page - 1) * limit;

  return dbManager.withRetry(async (supabase) => {
    let query = supabase
      .from(TABLE_NAME)
      .select(PERSON_COLUMNS, { count: 'exact' });

    if (status !== undefined && status !== null) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `ci.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('first_name', { ascending: true });

    if (error) throw error;

    return {
      data: (data as unknown as DBPersonRow[]).map(mapPersonToFrontend),
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    };
  }, 'getPersons');
};

/**
 * Obtiene una persona por su ID.
 */
export const getPersonById = async (personId: number): Promise<PersonDTO | null> => {
  return dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(PERSON_COLUMNS)
      .eq('person_id', personId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }, 'getPersonById');
};

/**
 * Obtiene una persona por su cédula.
 */
export const getPersonByCi = async (ci: string): Promise<PersonDTO | null> => {
  return dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(PERSON_COLUMNS)
      .eq('ci', ci)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }, 'getPersonByCi');
};

/**
 * Crea una nueva persona en t_persons.
 * Retorna la persona creada.
 */
export const createPerson = async (personData: CreatePersonDTO, supabaseClient?: SupabaseClient): Promise<PersonDTO> => {
  const buildDbData = () => ({
    ci: personData.ci,
    first_name: personData.firstName,
    middle_name: personData.middleName || null,
    last_name: personData.lastName,
    second_last_name: personData.secondLastName || null,
    email: personData.email,
    phone: personData.phone || null,
    gender: personData.gender || null,
    birthdate: personData.birthDate || null,
    address: personData.address || null,
    marital_status: personData.maritalStatus || null,
    status: personData.status ?? 1,
  });

  if (supabaseClient) {
    const dbData = buildDbData();
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .insert([dbData])
      .select(PERSON_COLUMNS)
      .single();

    if (error) throw error;
    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }

  return dbManager.withRetry(async (supabase) => {
    const dbData = buildDbData();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([dbData])
      .select(PERSON_COLUMNS)
      .single();

    if (error) throw error;
    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }, 'createPerson');
};

/**
 * Actualiza los datos personales de una persona existente.
 */
export const updatePerson = async (personId: number, personData: UpdatePersonDTO, supabaseClient?: SupabaseClient): Promise<PersonDTO | null> => {
  const buildDbData = () => {
    const dbData: Record<string, unknown> = {};
    if (personData.firstName !== undefined) dbData.first_name = personData.firstName;
    if (personData.middleName !== undefined) dbData.middle_name = personData.middleName;
    if (personData.lastName !== undefined) dbData.last_name = personData.lastName;
    if (personData.secondLastName !== undefined) dbData.second_last_name = personData.secondLastName;
    if (personData.email !== undefined) dbData.email = personData.email;
    if (personData.phone !== undefined) dbData.phone = personData.phone;
    if (personData.gender !== undefined) dbData.gender = personData.gender;
    if (personData.birthDate !== undefined) dbData.birthdate = personData.birthDate;
    if (personData.address !== undefined) dbData.address = personData.address;
    if (personData.maritalStatus !== undefined) dbData.marital_status = personData.maritalStatus;
    if (personData.status !== undefined) dbData.status = personData.status;
    dbData.updated_at = new Date().toISOString().replace('T', ' ').split('.')[0];
    return dbData;
  };

  const dbData = buildDbData();

  if (Object.keys(dbData).length === 0) {
    // No hay nada que actualizar, obtener el registro actual
    if (supabaseClient) {
      const { data } = await supabaseClient
        .from(TABLE_NAME)
        .select(PERSON_COLUMNS)
        .eq('person_id', personId)
        .single();
      return data ? mapPersonToFrontend(data as unknown as DBPersonRow) : null;
    }
    return getPersonById(personId);
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .update(dbData)
      .eq('person_id', personId)
      .select(PERSON_COLUMNS)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }

  return dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(dbData)
      .eq('person_id', personId)
      .select(PERSON_COLUMNS)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }, 'updatePerson');
};

/**
 * Activa o desactiva una persona.
 */
export const togglePersonStatus = async (personId: number, status: number | boolean, supabaseClient?: SupabaseClient): Promise<PersonDTO | null> => {
  const newStatus = status ? 1 : 0;

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .update({ status: newStatus, updated_at: new Date().toISOString().replace('T', ' ').split('.')[0] })
      .eq('person_id', personId)
      .select(PERSON_COLUMNS)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }

  return dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ status: newStatus, updated_at: new Date().toISOString().replace('T', ' ').split('.')[0] })
      .eq('person_id', personId)
      .select(PERSON_COLUMNS)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapPersonToFrontend(data as unknown as DBPersonRow);
  }, 'togglePersonStatus');
};

// ============================================================
// VALIDATION HELPERS
// ============================================================

export interface ValidationResult {
  available: boolean;
  exists?: boolean;
  status?: number;
  personId?: number;
}

/**
 * Busca una persona por CI o la crea si no existe.
 * Permite que una misma persona sea referenciada por múltiples entidades
 * (estudiante, tutor, usuario, etc.) sin duplicar datos.
 */
export const findOrCreatePerson = async (personData: CreatePersonDTO, supabaseClient?: SupabaseClient): Promise<PersonDTO> => {
  // 1. Buscar si ya existe una persona con esa CI
  const existing = await getPersonByCi(personData.ci);
  if (existing) {
    // Ya existe → devolverla sin modificar (los datos compartidos se crean una vez)
    return existing;
  }

  // 2. No existe → crear nueva persona
  return createPerson(personData, supabaseClient);
};

/**
 * Verifica si una cédula ya está registrada en t_persons.
 * Opcionalmente excluye un person_id (para updates).
 */
export const validateUniqueCi = async (ci: string, excludePersonId?: number): Promise<ValidationResult> => {
  return dbManager.withRetry(async (supabase) => {
    let query = supabase
      .from(TABLE_NAME)
      .select('person_id, status')
      .eq('ci', ci);

    if (excludePersonId !== undefined) {
      query = query.neq('person_id', excludePersonId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    return {
      available: !data,
      exists: !!data,
      status: data?.status,
      personId: data?.person_id,
    };
  }, 'validateUniqueCi');
};

/**
 * Verifica si un email ya está registrado en t_persons.
 * Opcionalmente excluye un person_id (para updates).
 */
export const validateUniqueEmail = async (email: string, excludePersonId?: number): Promise<ValidationResult> => {
  return dbManager.withRetry(async (supabase) => {
    let query = supabase
      .from(TABLE_NAME)
      .select('person_id, status')
      .ilike('email', email);

    if (excludePersonId !== undefined) {
      query = query.neq('person_id', excludePersonId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    return {
      available: !data,
      exists: !!data,
      status: data?.status,
      personId: data?.person_id,
    };
  }, 'validateUniqueEmail');
};

// ============================================================
// SEARCH
// ============================================================

/**
 * Búsqueda global de personas por CI, nombre o email.
 */
export const searchPersons = async (query: string, limit = 20): Promise<PersonDTO[]> => {
  return dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(PERSON_COLUMNS)
      .or(`ci.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (data as unknown as DBPersonRow[]).map(mapPersonToFrontend);
  }, 'searchPersons');
};
