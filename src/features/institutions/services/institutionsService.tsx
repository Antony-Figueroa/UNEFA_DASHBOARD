import { Institution, CreateInstitutionPayload, UpdateInstitutionPayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";
import apiClient from "../../../api/apiClient";

const API_URL = "/institutions";

/**
 * Interface for Institution Data Transfer Object (API Response).
 */
interface InstitutionDTO {
  institutionId: string;
  rif: string;
  name: string;
  fiscalAddress: string;
  phone: string;
  practiceType: string;
  internshipTypeId?: string;
  careerId: string;
  careerIds?: string[];
  careerName?: string;
  region: string;
  nucleus: string;
  extension: string;
  institutionType: string;
  status: boolean;
  registrationDate: string | Date;
  responsibleCount?: number;
  isInUse?: boolean;
}

/**
 * Maps an InstitutionDTO from the API to a domain Institution object.
 * @param dto - The data transfer object from the API.
 * @returns A domain Institution object with the original date string preserved.
 */
const mapFromApi = (dto: InstitutionDTO): Institution => ({
  ...dto,
  // Mantenemos la fecha como string original para que el modal pueda formatearla correctamente
  // No convertir a Date aquí porque se pierde el formato ISO original
  registrationDate: dto.registrationDate,
});

/**
 * Servicio centralizado para la gestión de instituciones generado mediante la fábrica CRUD.
 */
export const institutionService = createCrudService<Institution, CreateInstitutionPayload, UpdateInstitutionPayload, InstitutionDTO>({
  endpoint: API_URL,
  mapFromApi
});

// Exportaciones individuales para compatibilidad
export const getInstitutions = institutionService.getAll;
export const createInstitution = institutionService.create;
export const updateInstitution = (id: string, institution: UpdateInstitutionPayload) => institutionService.update({ ...institution, institutionId: id } as any);
export const deleteInstitution = institutionService.delete;
export const toggleInstitutionStatus = institutionService.toggleStatus!;

/**
 * Obtiene una institución por su RIF.
 * @param rif - RIF de la institución (formato: J-123456789)
 */
export const getInstitutionByRif = async (rif: string): Promise<Institution | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-rif/${rif}`);
    return response.data?.data || null;
  } catch (error) {
    console.error("[institutionsService] Error al obtener institución por RIF:", error);
    return null;
  }
};

/**
 * Obtiene las carreras asociadas a una institución.
 * @param institutionId - ID de la institución
 */
export const getInstitutionCareers = async (institutionId: string): Promise<{ careerId: string; name: string }[]> => {
  try {
    const response = await apiClient.get(`${API_URL}/${institutionId}/careers`);
    return response.data || [];
  } catch (error) {
    console.error("[institutionsService] Error al obtener carreras de la institución:", error);
    return [];
  }
};

/**
 * Actualiza las carreras asociadas a una institución.
 * @param institutionId - ID de la institución
 * @param careers - Array de IDs de carreras
 */
export const updateInstitutionCareers = async (institutionId: string, careers: string[]): Promise<boolean> => {
  try {
    await apiClient.put(`${API_URL}/${institutionId}/careers`, { careers });
    return true;
  } catch (error) {
    console.error("[institutionsService] Error al actualizar carreras de la institución:", error);
    return false;
  }
};
