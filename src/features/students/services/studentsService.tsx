/**
 * @file studentsService.tsx
 * @description Servicio para la gestión de estudiantes (API).
 */

import { Student } from "../types";

const API_URL = "/api/students";

export const getStudents = async (): Promise<Student[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data = await response.json();
  return (data as Record<string, unknown>[]).map((s: Record<string, unknown>) => ({
    ...s,
    studentId: (s.studentId ?? s.id ?? s.ID ?? s._id ?? "") as string,
    firstName: (s.firstName ?? s.first_name ?? s.nombre ?? "") as string,
    lastName: (s.lastName ?? s.last_name ?? s.apellido ?? "") as string,
    enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate as string | number) : (s.createdAt ? new Date(s.createdAt as string | number) : new Date())
  })) as unknown as Student[];
};

export const createStudent = async (student: Omit<Student, "studentId" | "enrollmentDate">): Promise<Student> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data = (await response.json()) as Record<string, unknown>;
  return { 
    ...data, 
    studentId: (data.studentId ?? data.id ?? "") as string,
    enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate as string | number) : new Date() 
  } as unknown as Student;
};
