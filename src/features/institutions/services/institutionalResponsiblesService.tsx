/**
 * @fileoverview Institutional Responsibles service for API interaction.
 * Handles data fetching, mapping, and persistence for institution personnel.
 */

import { InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";
import apiClient from "../../../api/apiClient";

/**
 * Base URL for institutional responsibles endpoints.
 */
const API_URL = "/institutional-responsibles";

/**
 * Interface for InstitutionalResponsible Data Transfer Object (API Response).
 */
interface ResponsibleInstitutionDTO {
  institutionId: string;
  institutionName: string;
  cargo: string;
}

interface InstitutionalResponsibleDTO {
  responsibleId: string;
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  fullName: string;
  position: string;
  phone: string;
  email: string;
  cargo?: string;
  institutions: ResponsibleInstitutionDTO[];
  status: boolean;
  registrationDate: string | Date;
}

/**
 * Maps an InstitutionalResponsibleDTO from the API to a domain object.
 * @param dto - The data transfer object from the API.
 * @returns A domain InstitutionalResponsible object with proper date formatting.
 */
const mapFromApi = (dto: InstitutionalResponsibleDTO): InstitutionalResponsible => ({
  ...dto,
  registrationDate: new Date(dto.registrationDate),
});

/**
 * Institutional Responsibles service for API interaction.
 * Handles data fetching, mapping, and persistence for institution personnel using the CRUD factory.
 */
export const responsibleService = createCrudService<InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload, InstitutionalResponsibleDTO>({
  endpoint: API_URL,
  idField: "responsibleId",
  mapFromApi
});

/**
 * Obtiene un responsable institucional por su cédula de identidad.
 * @param ci - Cédula de identidad (formato: V-12345678)
 */
/**
 * Verifica disponibilidad de CI o email.
 * @param type - Tipo de dato a verificar ('ci' o 'email').
 * @param value - Valor a verificar.
 * @param excludeId - ID de la persona a excluir (útil en ediciones).
 * @returns Promesa con el estado de disponibilidad.
 */
export const checkAvailability = async (
  type: 'ci' | 'email',
  value: string,
  excludeId?: string
): Promise<{ available: boolean; status?: number; responsibleId?: number }> => {
  try {
    const response = await apiClient.get(`${API_URL}/check-availability`, {
      params: { type, value, excludeId }
    });
    return response.data;
  } catch (error) {
    console.error("[responsibleService] Error al verificar disponibilidad:", error);
    throw error;
  }
};

/**
 * Obtiene un responsable institucional por su cédula de identidad.
 * @param ci - Cédula de identidad (formato: V-12345678)
 */
/**
 * Interface for person-only data returned when a person exists but not as an institutional responsible.
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
 * - `responsible`: datos del responsable si existe como tal
 * - `person`: datos de la persona si existe en t_persons pero no como responsable
 * - Ambos `null`: la persona no existe en el sistema
 */
interface ResponsibleByCiResult {
  responsible: InstitutionalResponsible | null;
  person: PersonData | null;
}

/**
 * Obtiene un responsable institucional por su cédula de identidad.
 * @param ci - Cédula de identidad (formato: V-12345678)
 */
export const getResponsibleByCi = async (ci: string): Promise<ResponsibleByCiResult> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-ci/${ci}`, { silent: true } as any);
    const body = response.data;
    if (body?.data) {
      return { responsible: mapFromApi(body.data), person: null };
    }
    if (body?.person) {
      return { responsible: null, person: body.person };
    }
    return { responsible: null, person: null };
  } catch (error) {
    console.error("[responsibleService] Error al obtener responsable por CI:", error);
    return { responsible: null, person: null };
  }
};
