/**
 * @file internshipTypesService.ts
 * @description Servicio de capa de datos para la gestión de Tipos de Práctica Profesional.
 * Proporciona métodos para interactuar con los endpoints de la API, manejando la normalización
 * de datos (DTO a Entidad) y el mapeo para componentes de interfaz.
 * 
 * @module features/internship-types/services
 */

import apiClient from "../../../api/apiClient";
import { 
  InternshipType, 
  InternshipTypeOption, 
  InternshipTypeApiDTO, 
  CreateInternshipTypePayload, 
  UpdateInternshipTypePayload 
} from "../types";

const API_URL = "/internship-types";

/**
 * Normaliza un objeto proveniente de la API (DTO) al formato de la entidad de dominio.
 * Maneja inconsistencias entre nombres de campos (Snake Case vs Camel Case).
 * 
 * @param {InternshipTypeApiDTO} dto - Objeto crudo de la respuesta de la API.
 * @returns {InternshipType} Objeto de dominio normalizado.
 */
const mapFromApi = (dto: InternshipTypeApiDTO): InternshipType => ({
  id: dto.INTERNSHIP_TYPE_ID ?? dto.id ?? 0,
  name: dto.NAME ?? dto.name ?? "",
  priority: dto.PRIORITY ?? dto.priority ?? 0,
  status: dto.STATUS === undefined ? true : (typeof dto.STATUS === "number" ? dto.STATUS === 1 : !!dto.STATUS),
  creationDate: dto.CREATION_DATE ? new Date(dto.CREATION_DATE) : (dto.createdAt ? new Date(dto.createdAt) : new Date()),
  hoursRequired: dto.HOURS_REQUIRED ?? 360,
});

/**
 * Obtiene el listado completo de tipos de práctica profesional.
 * @returns {Promise<InternshipType[]>} Una promesa con el array de entidades.
 */
export const getInternshipTypes = async (): Promise<InternshipType[]> => {
  const response = await apiClient.get<InternshipTypeApiDTO[]>(API_URL);
  return response.data.map(mapFromApi);
};

/**
 * Obtiene los tipos de práctica configurados para una carrera específica.
 * @param {string | number} careerId - El identificador único de la carrera.
 * @returns {Promise<InternshipType[]>} Array de tipos de práctica asociados.
 */
export const getInternshipTypesByCareer = async (careerId: string | number): Promise<InternshipType[]> => {
  const response = await apiClient.get<InternshipTypeApiDTO[]>(`${API_URL}/career/${careerId}`);
  return response.data.map(mapFromApi);
};

/**
 * Envía una petición para registrar un nuevo tipo de práctica profesional.
 * @param {CreateInternshipTypePayload} data - Los datos del nuevo registro.
 * @returns {Promise<InternshipType>} El registro creado y normalizado.
 */
export const createInternshipType = async (data: CreateInternshipTypePayload): Promise<InternshipType> => {
  const payload = {
    NAME: data.name,
    PRIORITY: Number(data.priority),
    STATUS: data.status ? 1 : 0
  };
  const response = await apiClient.post<InternshipTypeApiDTO>(API_URL, payload);
  return mapFromApi(response.data);
};

/**
 * Actualiza parcialmente un tipo de práctica profesional existente.
 * @param {number} id - El ID del registro a modificar.
 * @param {UpdateInternshipTypePayload} data - Los campos a actualizar.
 * @returns {Promise<InternshipType>} El registro actualizado.
 */
export const updateInternshipType = async (id: number, data: UpdateInternshipTypePayload): Promise<InternshipType> => {
  const payload = {
    NAME: data.name,
    PRIORITY: data.priority !== undefined ? Number(data.priority) : undefined,
    STATUS: data.status !== undefined ? (data.status ? 1 : 0) : undefined
  };
  const response = await apiClient.put<InternshipTypeApiDTO>(`${API_URL}/${id}`, payload);
  return mapFromApi(response.data);
};

/**
 * Elimina (lógicamente) un tipo de práctica del sistema.
 * @param {number | string} id - ID del registro a eliminar.
 */
export const deleteInternshipType = async (id: number | string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

export const getAll = getInternshipTypes;
export const create = createInternshipType;
export const update = async (data: UpdateInternshipTypePayload): Promise<InternshipType> => {
  const id = (data as any).id;
  if (!id) throw new Error("ID is required for update");
  return updateInternshipType(id, data);
};
export const remove = deleteInternshipType;

/**
 * Cambia el estado de activación de un tipo de práctica.
 * @param {number | string} id - ID del registro.
 * @param {boolean} status - Nuevo estado.
 */
export const toggleStatus = async (id: number | string, status: boolean): Promise<void> => {
  await apiClient.patch(`${API_URL}/${id}/toggle-status`, { status });
};

/**
 * Ejecuta la eliminación masiva de registros.
 */
export const bulkDelete = async (ids: (string | number)[]): Promise<void> => {
  await apiClient.post(`${API_URL}/bulk-delete`, { ids });
};

/**
 * Ejecuta la restauración masiva de registros.
 */
export const bulkRestore = async (ids: (string | number)[]): Promise<void> => {
  await apiClient.post(`${API_URL}/bulk-restore`, { ids });
};

/**
 * Procesa la eliminación masiva de múltiples tipos de práctica.
 * @param {number[]} ids - Lista de identificadores únicos.
 */
export const bulkDeleteInternshipTypes = async (ids: number[]): Promise<void> => {
  await apiClient.post(`${API_URL}/bulk-delete`, { ids });
};

/**
 * Procesa la restauración masiva de múltiples tipos de práctica inactivos.
 * @param {number[]} ids - Lista de identificadores únicos.
 */
export const bulkRestoreInternshipTypes = async (ids: number[]): Promise<void> => {
  await apiClient.post(`${API_URL}/bulk-restore`, { ids });
};

/**
 * Transforma una lista de entidades InternshipType en un formato compatible con selectores.
 * @param {InternshipType[]} types - Array de entidades.
 * @returns {InternshipTypeOption[]} Opciones mapeadas con label y value.
 */
export const mapToOptions = (types: InternshipType[]): InternshipTypeOption[] => {
  return types.map((t) => {
    const label = t.name.toUpperCase();
    return {
      id: t.id,
      value: label,
      label: label,
      text: label,
    };
  });
};
