/**
 * @file studentsService.tsx
 * @description Servicio para la gestión de estudiantes mediante API.
 * Implementa la lógica de acceso a datos y normalización para el módulo de Estudiantes.
 * 
 * @module features/students/services
 */

import { Student, CreateStudentPayload, UpdateStudentPayload } from "../types";
import apiClient from "../../../api/apiClient";
import { unwrapData } from "../../api/crudServiceFactory";
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

/**
 * Interface for person-only data returned when a person exists but not as a student.
 */
interface PersonData {
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  maritalStatus?: string;
}

/**
 * Resultado de la búsqueda por CI. Puede contener:
 * - `student`: datos del estudiante si existe como tal
 * - `person`: datos de la persona si existe en t_persons pero no como estudiante
 * - Ambos `null`: la persona no existe en el sistema
 */
interface StudentByCiResult {
  student: Student | null;
  person: PersonData | null;
}

/**
 * Obtiene un estudiante por su cédula de identidad.
 * 
 * @param ci - Cédula de identidad (formato: V-12345678).
 * @returns Promesa con los datos del estudiante, datos de persona, o null si no existe.
 */
export const getStudentByCi = async (ci: string): Promise<StudentByCiResult> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-ci/${ci}`, { silent: true } as any);
    const body = response.data;
    if (body?.data) {
      return { student: mapFromApi(body.data), person: null };
    }
    if (body?.person) {
      return { student: null, person: body.person };
    }
    return { student: null, person: null };
  } catch (error) {
    console.error("[studentsService] Error al obtener estudiante por CI:", error);
    return { student: null, person: null };
  }
};

/**
 * Resultado de la consulta a la API externa de cédula.
 */
export interface CedulaLookupResult {
  nacionalidad: string;
  cedula: string;
  rif: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
}

/**
 * Consulta la API externa de cédula.com.ve para obtener datos personales
 * a partir del número de cédula. Permite autocompletar nombres y apellidos
 * durante el registro de estudiantes.
 *
 * @param ci - Cédula completa con prefijo (formato: V-12345678)
 * @returns Datos de la persona o null si no se encuentra
 */
export const lookupCi = async (ci: string): Promise<CedulaLookupResult | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/lookup-ci/${encodeURIComponent(ci)}`, { silent: true } as any);
    return response.data?.data || null;
  } catch (error) {
    console.error('[studentsService] Error al consultar API de cédula:', error);
    return null;
  }
};

export interface ChangeRegistrationPayload {
  changeType: 'institution' | 'tutor';
  newValue: string;
  reason?: string;
}

export const changeStudentRegistration = async (
  studentId: string,
  payload: ChangeRegistrationPayload
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const response = await apiClient.patch(`${API_URL}/${studentId}/change-registration`, payload);
    return response.data;
  } catch (error: any) {
    console.error("[studentsService] Error al cambiar registro:", error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al cambiar el registro del estudiante'
    };
  }
};

// Exportaciones individuales para mantener compatibilidad
export const getStudents = async () => {
  const result = await studentService.getAll();
  const data = unwrapData(result);
  return { data, total: data.length, page: 1, limit: data.length, totalPages: 1 }
};
export const createStudent = studentService.create;
export const updateStudent = (id: string, payload: UpdateStudentPayload) => studentService.update({ ...payload, studentId: id } as any);
export const deleteStudent = studentService.delete;
export const toggleStudentStatus = studentService.toggleStatus!;

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export interface ImportValidationRow {
  row: number;
  cedula: string;
  nombre_apellido: string;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
  // Datos adicionales para mostrar
  sexo?: string;
  birthDate?: string;
  email?: string;
  career?: string;
}

export interface ImportValidationResponse {
  valid: boolean;
  rows: ImportValidationRow[];
  summary: {
    total: number;
    validCount: number;
    warningCount: number;
    errorCount: number;
  };
}

export interface ImportExecuteResponse {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  results: {
    row: number;
    status: 'created' | 'updated' | 'error';
    message: string;
    studentId?: string;
  }[];
}

/**
 * Valida un archivo Excel de estudiantes sin guardar en BD.
 * @param file - Archivo Excel a validar.
 * @returns Resultado de validación.
 */
export const validateImport = async (file: File): Promise<ImportValidationResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`${API_URL}/import/validate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error: any) {
    console.error("[studentsService] Error al validar importación:", error);
    return {
      valid: false,
      rows: [],
      summary: { total: 0, validCount: 0, warningCount: 0, errorCount: 0 }
    };
  }
};

/**
 * Ejecuta la importación de estudiantes desde un archivo Excel.
 * @param file - Archivo Excel a importar.
 * @param confirmed - Indica si el usuario confirmó las advertencias.
 * @returns Resultado de importación.
 */
export const executeImport = async (file: File, confirmed: boolean = false): Promise<ImportExecuteResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confirmed', String(confirmed));
    
    const response = await apiClient.post(`${API_URL}/import/execute`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error: any) {
    console.error("[studentsService] Error al ejecutar importación:", error);
    return {
      success: false,
      created: 0,
      updated: 0,
      failed: 0,
      results: []
    };
  }
};

/**
 * Descarga la plantilla de importación de estudiantes.
 * @returns Blob con el archivo Excel de la plantilla.
 */
export const downloadTemplate = async (): Promise<Blob> => {
  try {
    const response = await apiClient.get(`${API_URL}/import/template`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error("[studentsService] Error al descargar plantilla:", error);
    throw error;
  }
};

export const importStudents = async (data: Record<string, unknown>[]): Promise<ImportResult> => {
  try {
    const response = await apiClient.post(`${API_URL}/import`, { students: data });
    return response.data;
  } catch (error: any) {
    console.error("[studentsService] Error al importar:", error);
    return {
      success: false,
      imported: 0,
      failed: data.length,
      errors: [error.response?.data?.message || 'Error al importar estudiantes']
    };
  }
};

export const exportStudents = async (filters?: {
  status?: boolean;
}): Promise<Student[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status !== undefined) params.append('status', String(filters.status));
    
    const response = await apiClient.get(`${API_URL}/export?${params.toString()}`);
    return response.data.data || [];
  } catch (error) {
    console.error("[studentsService] Error al exportar:", error);
    return [];
  }
};

