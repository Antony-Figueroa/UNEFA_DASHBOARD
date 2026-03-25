/**
 * @fileoverview Institución types and interfaces.
 * Defines the domain models and payloads for Institution-related operations.
 */

/**
 * Represents an institution in the system.
 */
export interface Institution {
  /** Unique identifier for the institution */
  institutionId: string;
  /** Tax identification number (Registro de Información Fiscal) */
  rif: string;
  /** Full name of the institution */
  name: string;
  /** Legal/Fiscal address */
  fiscalAddress: string;
  /** Contact phone number */
  phone: string;
  /** Geographic region */
  region: string;
  /** University nucleus */
  nucleus: string;
  /** Extension of the nucleus */
  extension: string;
  /** Category of institution (e.g., Public, Private) */
  institutionType: string;
  /** Active status of the institution */
  status: boolean;
  /** Date when the institution was registered */
  registrationDate: string | Date;
  /** Count of responsible personnel assigned (optional) */
  responsibleCount?: number;
  /** Flag indicating if the institution is currently being used in practices (optional) */
  isInUse?: boolean;
  /** Type of practice this institution accepts (Ordinaria or Hospitalaria y Comunitaria) */
  practiceType?: string;
  /** Types of practice this institution has based on enrolled students (computed, optional) */
  practiceTypes?: string[];
  /** IDs of internship types this institution accepts (from t_institution_career) */
  internshipTypeIds?: string[];
  /** Single internship type ID for form selection */
  internshipTypeId?: string;
  /** IDs of careers this institution attends (from t_institution_career) */
  careerIds?: string[];
}

/**
 * Payload for creating a new institution.
 */
export type CreateInstitutionPayload = Omit<Institution, 'institutionId' | 'registrationDate' | 'status' | 'responsibleCount' | 'isInUse' | 'practiceTypes'>;

/**
 * Payload for updating an existing institution.
 */
export interface UpdateInstitutionPayload extends Partial<CreateInstitutionPayload> {
  /** Unique identifier for the institution to update */
  institutionId: string;
}

/**
 * Represents a person responsible for an institution.
 */
export interface InstitutionalResponsible {
  /** Unique identifier for the responsible person */
  responsibleId: string;
  /** Identification prefix (V, E, etc.) */
  identificationPrefix: string;
  /** Identification number */
  identificationNumber: string;
  /** First name */
  firstName: string;
  /** Middle name (optional) */
  middleName?: string;
  /** First last name */
  lastName: string;
  /** Second last name (optional) */
  secondLastName?: string;
  /** Contact phone number */
  phone: string;
  /** Contact email address */
  email: string;
  /** Position/Cargo in the institution */
  cargo?: string;
  /** Associated institution ID */
  institutionId: string;
  /** Name of the associated institution (optional) */
  institutionName?: string;
  /** Active status */
  status: boolean;
  /** Registration date */
  registrationDate: Date;
}

/**
 * Payload for creating a new institutional responsible.
 */
export type CreateInstitutionalResponsiblePayload = Omit<InstitutionalResponsible, 'responsibleId' | 'registrationDate' | 'status' | 'institutionName'>;

/**
 * Payload for updating an existing institutional responsible.
 */
export interface UpdateInstitutionalResponsiblePayload extends Partial<CreateInstitutionalResponsiblePayload> {
  /** Unique identifier for the responsible person to update */
  responsibleId: string;
  /** Active status (optional in update) */
  status?: boolean;
}

/**
 * Interface for Institution data in table rows.
 */
export interface InstitutionRowData extends Institution {
  registrationDate: any; // formatted as string in UI
}

/**
 * Interface for Institutional Responsible data in table rows.
 */
export interface InstitutionalResponsibleRowData extends InstitutionalResponsible {
  registrationDate: any; // formatted as string in UI
}

/**
 * Data structure for table rows in the UI.
 */
export interface RowData {
  /** Primary key for table identification */
  id: string;
  /** Main title/name to display */
  name: string;
  /** Secondary information (e.g., RIF or Email) */
  subtitle: string;
  /** Tertiary information (e.g., Address or Position) */
  tertiary: string;
  /** Quaternary information (e.g., Phone) */
  quaternary: string;
  /** Current status */
  status: boolean;
  /** Raw data object for reference */
  original: Institution | InstitutionalResponsible;
}

