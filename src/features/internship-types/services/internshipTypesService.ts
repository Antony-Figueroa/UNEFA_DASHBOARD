/**
 * @file internshipTypesService.ts
 * @description Servicio para la gestión de Tipos de Pasantía.
 * Proporciona métodos para interactuar con la API y mapear datos crudos a la entidad de dominio.
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
 * Mapea un objeto crudo de la API (DTO) a la entidad de dominio InternshipType.
 * @param {InternshipTypeApiDTO} dto - Objeto crudo de la API.
 * @returns {InternshipType} Entidad normalizada.
 */
const mapFromApi = (dto: InternshipTypeApiDTO): InternshipType => ({
  id: dto.INTERNSHIP_TYPE_ID ?? dto.id ?? 0,
  name: dto.NAME ?? dto.name ?? "",
  abbreviation: dto.ABBREVIATION ?? dto.abbreviation ?? "",
  priority: dto.PRIORITY ?? dto.priority ?? 0,
  status: dto.STATUS === undefined ? true : (typeof dto.STATUS === "number" ? dto.STATUS === 1 : !!dto.STATUS),
  creationDate: dto.CREATION_DATE ? new Date(dto.CREATION_DATE) : (dto.createdAt ? new Date(dto.createdAt) : new Date()),
});

/**
 * Obtiene todos los tipos de pasantía disponibles.
 * @async
 * @returns {Promise<InternshipType[]>} Lista de tipos de pasantía.
 */
export const getInternshipTypes = async (): Promise<InternshipType[]> => {
  const response = await apiClient.get<InternshipTypeApiDTO[]>(API_URL);
  return response.data.map(mapFromApi);
};

/**
 * Obtiene los tipos de pasantía asociados a una carrera específica.
 * @async
 * @param {string | number} careerId - ID de la carrera.
 * @returns {Promise<InternshipType[]>} Lista de tipos de pasantía filtrada.
 */
export const getInternshipTypesByCareer = async (careerId: string | number): Promise<InternshipType[]> => {
  const response = await apiClient.get<InternshipTypeApiDTO[]>(`${API_URL}/career/${careerId}`);
  return response.data.map(mapFromApi);
};

/**
 * Crea un nuevo tipo de pasantía.
 * @async
 * @param {CreateInternshipTypePayload} data - Datos del nuevo tipo.
 * @returns {Promise<InternshipType>} El tipo de pasantía creado.
 */
export const createInternshipType = async (data: CreateInternshipTypePayload): Promise<InternshipType> => {
  const response = await apiClient.post<InternshipTypeApiDTO>(API_URL, data);
  return mapFromApi(response.data);
};

/**
 * Actualiza un tipo de pasantía existente.
 * @async
 * @param {number} id - ID del tipo a actualizar.
 * @param {UpdateInternshipTypePayload} data - Datos a modificar.
 * @returns {Promise<InternshipType>} El tipo actualizado.
 */
export const updateInternshipType = async (id: number, data: UpdateInternshipTypePayload): Promise<InternshipType> => {
  const response = await apiClient.patch<InternshipTypeApiDTO>(`${API_URL}/${id}`, data);
  return mapFromApi(response.data);
};

/**
 * Elimina (o desactiva) un tipo de pasantía.
 * @async
 * @param {number} id - ID del tipo a eliminar.
 */
export const deleteInternshipType = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

/**
 * Cambia el estado de activación de un tipo de pasantía.
 * @async
 * @param {number} id - ID del tipo.
 */
export const toggleInternshipTypeStatus = async (id: number): Promise<void> => {
  await apiClient.patch(`${API_URL}/${id}/toggle-status`);
};

/**
 * Realiza la eliminación masiva de tipos de pasantía.
 * @async
 * @param {number[]} ids - Lista de IDs a eliminar.
 */
export const bulkDeleteInternshipTypes = async (ids: number[]): Promise<void> => {
  await apiClient.post(`${API_URL}/bulk-delete`, { ids });
};

/**
 * Realiza la restauración masiva de tipos de pasantía.
 * @async
 * @param {number[]} ids - Lista de IDs a restaurar.
 */
export const bulkRestoreInternshipTypes = async (ids: number[]): Promise<void> => {
  await apiClient.post(`${API_URL}/bulk-restore`, { ids });
};

/**
 * Mapea entidades InternshipType a opciones para componentes de selección.
 * @param {InternshipType[]} types - Lista de tipos.
 * @returns {InternshipTypeOption[]} Opciones formateadas.
 */
export const mapToOptions = (types: InternshipType[]): InternshipTypeOption[] => {
  return types.map((t) => {
    const label = (t.abbreviation || t.name).toUpperCase();
    return {
      id: t.id,
      value: label,
      label: label,
      text: label,
    };
  });
};
