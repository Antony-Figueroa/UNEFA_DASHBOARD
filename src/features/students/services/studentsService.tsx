/**
 * @file studentsService.tsx
 * @description Servicio para la gestión de estudiantes mediante API.
 */

import { Student } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/students";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Obtiene la lista de estudiantes desde la API.
 */
export const getStudents = async (): Promise<PaginatedResponse<Student>> => {
  const response = await apiClient.get<PaginatedResponse<Student>>(API_URL);
  return response.data;
};

/**
 * Crea un estudiante en la API.
 */
export const createStudent = async (student: Omit<Student, "studentId" | "enrollmentDate">): Promise<Student> => {
  const response = await apiClient.post<Student>(API_URL, student);
  return response.data;
};

/**
 * Actualiza un estudiante en la API.
 */
export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  const response = await apiClient.put<Student>(`${API_URL}/${id}`, student);
  return response.data;
};

/**
 * Elimina (desactivar) un estudiante en la API.
 */
export const deleteStudent = async (studentId: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${studentId}`);
};

/**
 * Cambia el estado de un estudiante.
 */
export const toggleStudentStatus = async (id: string, status: boolean): Promise<Student> => {
  const response = await apiClient.patch<Student>(`${API_URL}/${id}/status`, { status });
  return response.data;
};
