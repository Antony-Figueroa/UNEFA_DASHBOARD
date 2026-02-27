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
  careerId: string;
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
 * @returns A domain Institution object with proper date formatting.
 */
const mapFromApi = (dto: InstitutionDTO): Institution => ({
  ...dto,
  registrationDate: new Date(dto.registrationDate),
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
