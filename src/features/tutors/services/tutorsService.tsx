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
export const getTutorByCi = async (ci: string): Promise<Tutor | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-ci/${ci}`, { silent: true } as any);
    return response.data?.data || null;
  } catch (error) {
    console.error("[tutorsService] Error al obtener tutor por CI:", error);
    return null;
  }
};
