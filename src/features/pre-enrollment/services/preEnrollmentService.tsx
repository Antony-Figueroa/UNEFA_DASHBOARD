/**
 * @file preEnrollmentService.tsx
 * @description Servicio estático para la gestión de pre-inscripciones (Modo Demo).
 */

import { PreEnrollment } from "../types";

const MOCK_PRE_ENROLLMENTS: PreEnrollment[] = [
  {
    preEnrollmentId: "1",
    identificationPrefix: "V",
    identificationNumber: "31114449",
    studentName: "ANTONY FIGUEROA",
    phone: "0424-1234567",
    period: "2026 - II",
    practiceType: "ORDINARIA",
    enrollmentCode: "ING-AI-111-336-S3",
    preEnrollmentDate: new Date("2026-01-07"),
    status: true,
  },
  {
    preEnrollmentId: "2",
    identificationPrefix: "V",
    identificationNumber: "28555666",
    studentName: "MARIA LOPEZ",
    phone: "0412-9876543",
    period: "2026 - II",
    practiceType: "ORDINARIA",
    enrollmentCode: "ADM-EM-222-444-S1",
    preEnrollmentDate: new Date("2026-01-06"),
    status: true,
  },
  {
    preEnrollmentId: "3",
    identificationPrefix: "E",
    identificationNumber: "84111222",
    studentName: "JOHN DOE",
    phone: "0416-5554433",
    period: "2026 - I",
    practiceType: "ESPECIAL",
    enrollmentCode: "SIS-CP-333-555-S2",
    preEnrollmentDate: new Date("2025-12-15"),
    status: false,
  }
];

export const getPreEnrollments = async (): Promise<PreEnrollment[]> => {
  // Simular retraso de red
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_PRE_ENROLLMENTS];
};
