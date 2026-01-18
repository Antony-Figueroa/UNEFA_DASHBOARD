/**
 * @file index.tsx
 * @description Define la estructura de datos para una Institución.
 */

export interface Institution {
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
  registrationDate: Date;
  responsibleCount?: number;
  isInUse?: boolean;
}

/**
 * Tipo para mostrar en tabla (fechas formateadas).
 */
export interface InstitutionRowData extends Omit<Institution, "registrationDate"> {
  registrationDate: string;
}

export interface InstitutionalResponsible {
  responsibleId: string;
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  phone: string;
  email: string;
  institutionId: string;
  institutionName?: string;
  status: boolean;
  registrationDate: Date;
}

export interface InstitutionalResponsibleRowData extends Omit<InstitutionalResponsible, "registrationDate"> {
  registrationDate: string;
}

