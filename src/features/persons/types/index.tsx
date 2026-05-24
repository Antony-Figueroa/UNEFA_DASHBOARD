import { Persona, PersonaDTO, mapPersonaFromDTO } from '../../types/person';

export type { Persona, PersonaDTO };

export { mapPersonaFromDTO };

export interface CreatePersonPayload {
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
}

export interface UpdatePersonPayload {
  personId: number;
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
}

export interface PersonRowData {
  id: string;
  ci: string;
  fullName: string;
  email: string;
  phone: string;
  status: boolean;
  original: Persona;
}
