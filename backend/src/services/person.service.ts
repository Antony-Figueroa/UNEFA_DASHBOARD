import { dbManager } from '../lib/db-manager.js';

interface PersonRow {
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
}

export interface PersonDTO {
  personId: number;
  ci: string;
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
}

interface ServiceError extends Error {
  code?: string;
  status?: number;
}

function mapRowToDTO(row: PersonRow): PersonDTO {
  return {
    personId: row.person_id,
    ci: row.ci,
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
  };
}

function createError(message: string, code: string, status: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.status = status;
  return error;
}

export const personService = {
  async getPersonById(personId: number): Promise<PersonDTO | null> {
    return dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_persons')
        .select('*')
        .eq('person_id', personId)
        .maybeSingle();

      if (error) {
        console.error('[PersonService] Error fetching person:', error);
        throw error;
      }

      return data ? mapRowToDTO(data as PersonRow) : null;
    }, 'getPersonById');
  },

  async getPersonByCi(ci: string): Promise<PersonDTO | null> {
    return dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_persons')
        .select('*')
        .eq('ci', ci)
        .maybeSingle();

      if (error) {
        console.error('[PersonService] Error fetching person by CI:', error);
        throw error;
      }

      return data ? mapRowToDTO(data as PersonRow) : null;
    }, 'getPersonByCi');
  },

  async searchPersons(query: string): Promise<PersonDTO[]> {
    return dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_persons')
        .select('*')
        .or(`ci.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('first_name', { ascending: true })
        .limit(20);

      if (error) {
        console.error('[PersonService] Error searching persons:', error);
        throw error;
      }

      return (data as PersonRow[] || []).map(mapRowToDTO);
    }, 'searchPersons');
  },

  async getAllPersons(page = 1, limit = 20, filters?: { status?: number; search?: string }): Promise<{ persons: PersonDTO[]; totalCount: number; totalPages: number }> {
    return dbManager.withRetry(async (supabase) => {
      let query = supabase
        .from('t_persons')
        .select('*', { count: 'exact' });

      if (filters?.status !== undefined) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`ci.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('[PersonService] Error fetching persons:', error);
        throw error;
      }

      return {
        persons: (data as PersonRow[] || []).map(mapRowToDTO),
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }, 'getAllPersons');
  },

  async createPerson(personData: {
    ci: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    email: string;
    phone?: string;
    gender?: string;
    birthDate?: string;
    address?: string;
    maritalStatus?: string;
  }): Promise<PersonDTO> {
    return dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_persons')
        .insert({
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
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          const field = error.message.includes('ci') ? 'cédula' : 'correo electrónico';
          throw createError(`Ya existe una persona con esta ${field}`, 'PERSON_ALREADY_EXISTS', 409);
        }
        console.error('[PersonService] Error creating person:', error);
        throw error;
      }

      return mapRowToDTO(data as PersonRow);
    }, 'createPerson');
  },

  async updatePerson(personId: number, personData: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    secondLastName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    birthDate?: string;
    address?: string;
    maritalStatus?: string;
    status?: number;
  }): Promise<PersonDTO> {
    return dbManager.withRetry(async (supabase) => {
      const updateData: Record<string, unknown> = {};
      if (personData.firstName !== undefined) updateData.first_name = personData.firstName;
      if (personData.middleName !== undefined) updateData.middle_name = personData.middleName;
      if (personData.lastName !== undefined) updateData.last_name = personData.lastName;
      if (personData.secondLastName !== undefined) updateData.second_last_name = personData.secondLastName;
      if (personData.email !== undefined) updateData.email = personData.email;
      if (personData.phone !== undefined) updateData.phone = personData.phone;
      if (personData.gender !== undefined) updateData.gender = personData.gender;
      if (personData.birthDate !== undefined) updateData.birthdate = personData.birthDate;
      if (personData.address !== undefined) updateData.address = personData.address;
      if (personData.maritalStatus !== undefined) updateData.marital_status = personData.maritalStatus;
      if (personData.status !== undefined) updateData.status = personData.status;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('t_persons')
        .update(updateData)
        .eq('person_id', personId)
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          throw createError('Ya existe otra persona con este correo electrónico', 'EMAIL_DUPLICATE', 409);
        }
        console.error('[PersonService] Error updating person:', error);
        throw error;
      }

      return data ? mapRowToDTO(data as PersonRow) : null;
    }, 'updatePerson');
  },

  async togglePersonStatus(personId: number): Promise<PersonDTO> {
    return dbManager.withRetry(async (supabase) => {
      const { data: current, error: fetchError } = await supabase
        .from('t_persons')
        .select('status')
        .eq('person_id', personId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!current) throw createError('Persona no encontrada', 'PERSON_NOT_FOUND', 404);

      const newStatus = current.status === 1 ? 0 : 1;
      const { data, error } = await supabase
        .from('t_persons')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('person_id', personId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToDTO(data as PersonRow);
    }, 'togglePersonStatus');
  },

  async validateUniqueCi(ci: string, excludePersonId?: number): Promise<boolean> {
    return dbManager.withRetry(async (supabase) => {
      let query = supabase
        .from('t_persons')
        .select('person_id')
        .eq('ci', ci);

      if (excludePersonId) {
        query = query.neq('person_id', excludePersonId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return !data;
    }, 'validateUniqueCi');
  },

  async validateUniqueEmail(email: string, excludePersonId?: number): Promise<boolean> {
    return dbManager.withRetry(async (supabase) => {
      let query = supabase
        .from('t_persons')
        .select('person_id')
        .ilike('email', email);

      if (excludePersonId) {
        query = query.neq('person_id', excludePersonId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return !data;
    }, 'validateUniqueEmail');
  },

  splitCi(ci: string): { prefix: string; number: string } {
    const match = ci.match(/^([VE]?-?)(\d+)$/i);
    if (!match) return { prefix: 'V', number: ci };
    return { prefix: match[1]?.replace('-', '') || 'V', number: match[2] };
  },

  joinCi(prefix: string, number: string): string {
    return `${prefix}-${number}`;
  },

  handlePersonError(error: unknown, context: string): never {
    const err = error as ServiceError;
    if (err.code === 'PERSON_ALREADY_EXISTS' || err.code === 'EMAIL_DUPLICATE' || err.code === 'PERSON_NOT_FOUND') {
      throw error;
    }

    const pgError = error as { code?: string; message?: string };
    switch (pgError.code) {
      case '23505':
        throw createError('Ya existe un registro con este valor único', 'DUPLICATE', 409);
      case '23502':
        throw createError('Faltan campos obligatorios', 'NOT_NULL', 400);
      case '23503':
        throw createError('El registro está siendo usado por otros registros', 'FK_VIOLATION', 409);
      case 'PGRST116':
        throw createError('Persona no encontrada', 'NOT_FOUND', 404);
      case 'PGRST205':
        throw createError('No se pudo completar la operación', 'OPERATION_FAILED', 400);
      default:
        console.error(`[PersonService] ${context}:`, pgError);
        throw createError('Error interno del servidor', 'INTERNAL_ERROR', 500);
    }
  },
};
