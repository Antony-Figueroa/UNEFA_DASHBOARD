/**
 * @file tutorsService.tsx
 * @description Servicio para la gestión de tutores a través de la API.
 */

import { Tutor, CreateTutorPayload, UpdateTutorPayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";
import apiClient from "../../../api/apiClient";

const API_URL = "/tutors";

/**
 * Interface for Tutor Data Transfer Object (API Response).
 */
interface TutorDTO extends Omit<Tutor, 'registrationDate'> {
  registrationDate: string | Date;
}

/**
 * Maps a TutorDTO from the API to a domain object.
 */
const mapFromApi = (dto: TutorDTO): Tutor => ({
  ...dto,
  registrationDate: new Date(dto.registrationDate),
});

/**
 * Servicio de Tutores utilizando la factoría CRUD.
 */
export const tutorsService = createCrudService<Tutor, CreateTutorPayload, UpdateTutorPayload, TutorDTO>({
  endpoint: API_URL,
  mapFromApi
});

// Exportaciones individuales para mantener compatibilidad
export const getTutors = tutorsService.getAll;
export const createTutor = tutorsService.create;
export const updateTutor = tutorsService.update;
export const deleteTutor = tutorsService.delete;
export const toggleTutorStatus = tutorsService.toggleStatus!;

/**
 * Obtiene un tutor por su cédula de identidad.
 * @param ci - Cédula de identidad (formato: V-12345678)
 */
/**
 * Interface for person-only data returned when a person exists but not as a tutor.
 */
interface PersonData {
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  maritalStatus?: string;
}

/**
 * Resultado de la búsqueda por CI. Puede contener:
 * - `tutor`: datos del tutor si existe como tal
 * - `person`: datos de la persona si existe en t_persons pero no como tutor
 * - Ambos `null`: la persona no existe en el sistema
 */
interface TutorByCiResult {
  tutor: Tutor | null;
  person: PersonData | null;
}

/**
 * Obtiene un tutor por su cédula de identidad.
 * @param ci - Cédula de identidad (formato: V-12345678)
 */
export const getTutorByCi = async (ci: string): Promise<TutorByCiResult> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-ci/${ci}`, { silent: true } as any);
    const body = response.data;
    if (body?.data) {
      return { tutor: mapFromApi(body.data), person: null };
    }
    if (body?.person) {
      return { tutor: null, person: body.person };
    }
    return { tutor: null, person: null };
  } catch (error) {
    console.error("[tutorsService] Error al obtener tutor por CI:", error);
    return { tutor: null, person: null };
  }
};
