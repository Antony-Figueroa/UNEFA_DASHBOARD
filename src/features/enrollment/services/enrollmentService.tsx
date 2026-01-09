/**
 * @file enrollmentService.tsx
 * @description Servicio estático para la gestión de inscripciones (Modo Demo).
 */

import { Enrollment } from "../types";

const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    enrollmentId: "1",
    identificationPrefix: "V",
    identificationNumber: "31114449",
    studentName: "ANTONY FIGUEROA",
    academicTutorId: "1",
    academicTutorName: "CARLOS PÉREZ",
    methodologicalTutorId: "2",
    methodologicalTutorName: "ANA RODRÍGUEZ",
    institutionId: "1",
    institutionName: "PDVSA",
    institutionResponsibleId: "1",
    institutionResponsibleName: "JUAN GONZÁLEZ",
    practiceType: "ORDINARIA",
    period: "2026 - II",
    enrollmentDate: new Date("2026-01-08"),
    status: true,
  },
  {
    enrollmentId: "2",
    identificationPrefix: "V",
    identificationNumber: "28555666",
    studentName: "MARIA LOPEZ",
    academicTutorId: "3",
    academicTutorName: "LUIS MARTÍNEZ",
    methodologicalTutorId: "4",
    methodologicalTutorName: "ELENA GÓMEZ",
    institutionId: "2",
    institutionName: "CANTV",
    institutionResponsibleId: "3",
    institutionResponsibleName: "PEDRO SÁNCHEZ",
    practiceType: "ORDINARIA",
    period: "2026 - II",
    enrollmentDate: new Date("2026-01-07"),
    status: true,
  }
];

export const getEnrollments = async (): Promise<Enrollment[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_ENROLLMENTS];
};

export const createEnrollment = async (data: Omit<Enrollment, "enrollmentId" | "enrollmentDate">): Promise<Enrollment> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newEnrollment: Enrollment = {
    ...data,
    enrollmentId: Math.random().toString(36).substr(2, 9),
    enrollmentDate: new Date(),
  };
  MOCK_ENROLLMENTS.unshift(newEnrollment);
  return newEnrollment;
};

export const updateEnrollment = async (data: Enrollment): Promise<Enrollment> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const index = MOCK_ENROLLMENTS.findIndex(e => e.enrollmentId === data.enrollmentId);
  if (index !== -1) {
    MOCK_ENROLLMENTS[index] = data;
  }
  return data;
};

export const deleteEnrollment = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const index = MOCK_ENROLLMENTS.findIndex(e => e.enrollmentId === id);
  if (index !== -1) {
    MOCK_ENROLLMENTS.splice(index, 1);
  }
};
