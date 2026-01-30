/**
 * @fileoverview Institutional Responsibles service for API interaction.
 * Handles data fetching, mapping, and persistence for institution personnel.
 */

import { InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";

/**
 * Base URL for institutional responsibles endpoints.
 */
const API_URL = "/institutional-responsibles";

/**
 * Interface for InstitutionalResponsible Data Transfer Object (API Response).
 */
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
  institutionId: string;
  institutionName?: string;
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
  mapFromApi
});
