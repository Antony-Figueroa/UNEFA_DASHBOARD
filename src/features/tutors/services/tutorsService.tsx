/**
 * @file tutorsService.tsx
 * @description Servicio para la gestión de tutores a través de la API.
 */

import { Tutor, CreateTutorPayload, UpdateTutorPayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";

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
