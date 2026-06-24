/**
 * @file index.ts
 * @description Type definitions for the Enrollment module.
 */

/**
 * Represents a complete Enrollment record.
 */
export interface Enrollment {
  /** Unique identifier for the enrollment */
  enrollmentId: string;
  
  /** National identification prefix (V for Venezuelan, E for Foreigner) */
  identificationPrefix: "V" | "E";
  /** National identification number */
  identificationNumber: string;
  
  /** Full name of the student */
  studentName: string;
  /** Name of the academic career the student is enrolled in */
  careerName?: string;
  
  /** ID of the assigned academic tutor */
  academicTutorId: string;
  /** Name of the assigned academic tutor */
  academicTutorName?: string;
  /** Phone number of the academic tutor */
  academicTutorPhone?: string;
  /** ID of the assigned methodological tutor */
  methodologicalTutorId: string;
  /** Name of the assigned methodological tutor */
  methodologicalTutorName?: string;
  /** Phone number of the methodological tutor */
  methodologicalTutorPhone?: string;
  
  /** ID of the host institution */
  institutionId: string;
  /** Name of the host institution */
  institutionName?: string;
  /** Physical address of the host institution */
  institutionAddress?: string;
  /** Phone number of the host institution */
  institutionPhone?: string;
  /** ID of the specific person responsible at the institution */
  institutionResponsibleId: string;
  /** Name of the person responsible at the institution */
  institutionResponsibleName?: string;
  /** Phone number of the person responsible at the institution */
  institutionResponsiblePhone?: string;
  
  /** Geographical region */
  region?: string;
  /** Academic nucleus */
  nucleus?: string;
  /** Academic extension */
  extension?: string;
  /** Type of institution (Public, Private, etc.) */
  institutionType?: string;
  
  /** Type of internship or professional practice */
  practiceType: string;
  /** Academic period description (e.g., '2023-I') */
  period: string;
  /** Unique tracking code for the enrollment */
  enrollmentCode?: string;
  /** Additional notes or observations */
  observation?: string;
  
  /** Date when the enrollment was recorded */
  enrollmentDate: Date;
  /** Current status of the enrollment (true: active, false: inactive) */
  status: boolean;
}

/**
 * Payload required to create a new enrollment record.
 */
export interface CreateEnrollmentPayload extends Omit<Enrollment, "enrollmentId" | "enrollmentDate" | "status"> {
  /** Si es true, salta la validación de período/fecha en el backend */
  overridePeriodValidation?: boolean;
}

/**
 * Payload required to update an existing enrollment record.
 */
export interface UpdateEnrollmentPayload extends Partial<CreateEnrollmentPayload> {
  /** The unique identifier of the enrollment to update */
  enrollmentId: string;
}

/**
 * Data structure optimized for table display (with string-formatted dates).
 */
export interface EnrollmentRowData extends Omit<Enrollment, "enrollmentDate"> {
  /** Date formatted as a string for display */
  enrollmentDate: string;
}
