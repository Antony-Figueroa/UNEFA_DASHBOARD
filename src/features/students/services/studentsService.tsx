/**
 * @file studentsService.tsx
 * @description Servicio para la gestión de estudiantes mediante API.
 * Implementa la lógica de acceso a datos y normalización para el módulo de Estudiantes.
 * 
 * @module features/students/services
 */

import { Student, CreateStudentPayload, UpdateStudentPayload } from "../types";
import apiClient from "../../../api/apiClient";
import { createCrudService } from "../../../api/crudServiceFactory";

const API_URL = "/students";

/**
 * Normaliza los datos de un estudiante provenientes de la API.
 * Convierte campos de fecha de string a objetos Date y asegura tipos correctos.
 * 
 * @param data - Datos crudos del estudiante desde la API.
 * @returns Estudiante normalizado.
 */
const mapFromApi = (data: any): Student => ({
  ...data,
  enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : new Date(),
});

/**
 * Servicio centralizado para la gestión de estudiantes generado mediante la fábrica CRUD.
 * Provee métodos estandarizados para operaciones básicas mientras mantiene 
 * funcionalidades personalizadas como la verificación de disponibilidad.
 */
export const studentService = createCrudService<Student, CreateStudentPayload, UpdateStudentPayload, any>({
  endpoint: API_URL,
  idField: "studentId",
  mapFromApi
});

/**
 * Verifica si una cédula o correo electrónico ya están registrados.
 * 
 * @param type - Tipo de dato a verificar ('ci' para cédula, 'email' para correo).
 * @param value - Valor a verificar.
 * @param excludeId - ID del estudiante a excluir (útil en ediciones).
 * @returns Promesa con el estado de disponibilidad.
 */
export const checkAvailability = async (
  type: 'ci' | 'email', 
  value: string, 
  excludeId?: string
): Promise<{ available: boolean; status?: number; studentId?: number }> => {
  try {
    const response = await apiClient.get(`${API_URL}/check-availability`, {
      params: { type, value, excludeId }
    });
    return response.data;
  } catch (error) {
    console.error(`[studentsService] Error al verificar disponibilidad de ${type}:`, error);
    throw error;
  }
};

// Exportaciones individuales para mantener compatibilidad
export const getStudents = async () => {
  const data = await studentService.getAll();
  return { data, total: data.length, page: 1, limit: data.length, totalPages: 1 };
};
export const createStudent = studentService.create;
export const updateStudent = (id: string, payload: UpdateStudentPayload) => studentService.update({ ...payload, studentId: id } as any);
export const deleteStudent = studentService.delete;
export const toggleStudentStatus = studentService.toggleStatus!;

