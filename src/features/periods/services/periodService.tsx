/**
 * @file Servicio para la gestión de periodos académicos (API).
 * @description Encapsula la lógica de comunicación con la API para las operaciones CRUD.
 */

import { Periodo, CreatePeriodPayload, UpdatePeriodPayload } from "../types";
import apiClient from "../../../api/apiClient";

/**
 * URL base para el recurso de periodos.
 */
const API_URL = "/periodos";

// --- API Data Transformation ---

/**
 * DTO (Data Transfer Object) que representa la estructura del periodo en la API.
 * Incluye múltiples variantes de nombres para asegurar compatibilidad.
 */
interface PeriodoApiDTO {
  periodId?: string;
  PERIOD_ID?: string | number;
  id?: string;
  ID?: string;
  _id?: string;
  startDate?: number | string;
  fechaInicio?: number | string;
  start_date?: number | string;
  START_DATE?: number | string;
  endDate?: number | string;
  fechaFin?: number | string;
  end_date?: number | string;
  END_DATE?: number | string;
  creationDate?: number | string;
  createdAt?: number | string;
  fechaCreacion?: number | string;
  description?: string;
  DESCRIPTION?: string;
  nombre?: string;
  name?: string;
  title?: string;
  periodo?: string;
  periodStatus?: number | string;
  PERIOD_STATUS?: number | string;
  estadoPeriodo?: number | string;
  period_status?: number | string;
  status?: boolean | number;
  STATUS?: boolean | number;
  activo?: boolean | number;
  enabled?: boolean | number;
  T_INTERNSHIPS_CODE?: string;
  code?: string;
  codigo?: string;
  isInUse?: boolean | number;
  IS_IN_USE?: boolean | number;
  is_in_use?: boolean | number;
  [key: string]: unknown;
}

/**
 * Parsea un valor de fecha (string o timestamp) a un objeto Date.
 * 
 * @param value - Valor a parsear.
 * @returns Objeto Date.
 */
const parseDate = (value: number | string | undefined): Date => {
  if (!value) return new Date();
  if (typeof value === "number") {
    // Unix timestamp en ms o segundos
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  return new Date(value);
};

/**
 * Mapea un DTO de la API al modelo de dominio Periodo.
 * 
 * @param dto - Objeto proveniente de la API.
 * @returns Objeto de tipo Periodo.
 */
const fromApi = (dto: PeriodoApiDTO): Periodo => {
  const periodId = dto.PERIOD_ID ?? dto.periodId ?? dto.id ?? dto.ID ?? dto._id ?? "";
  const description = dto.DESCRIPTION ?? dto.description ?? dto.nombre ?? dto.name ?? dto.title ?? dto.periodo ?? "";
  const startDateRaw = dto.START_DATE ?? dto.startDate ?? dto.fechaInicio ?? dto.start_date;
  const endDateRaw = dto.END_DATE ?? dto.endDate ?? dto.fechaFin ?? dto.end_date;
  const creationDateRaw = dto.creationDate ?? dto.createdAt ?? dto.fechaCreacion ?? Date.now();
  const periodStatusRaw = dto.PERIOD_STATUS ?? dto.periodStatus ?? dto.estadoPeriodo ?? dto.period_status ?? 1;
  const statusRaw = dto.STATUS ?? dto.status ?? dto.activo ?? dto.enabled ?? true;
  const code = dto.T_INTERNSHIPS_CODE ?? dto.code ?? dto.codigo ?? "";
  const isInUseRaw = dto.isInUse ?? dto.IS_IN_USE ?? dto.is_in_use ?? false;

  return {
    periodId: String(periodId),
    description: String(description),
    startDate: parseDate(startDateRaw as number | string),
    endDate: parseDate(endDateRaw as number | string),
    creationDate: parseDate(creationDateRaw as number | string),
    periodStatus: (Number(periodStatusRaw) || 1) as 1 | 2 | 3,
    status: typeof statusRaw === 'number' ? statusRaw === 1 : !!statusRaw,
    code: String(code),
    isInUse: typeof isInUseRaw === 'number' ? isInUseRaw === 1 : !!isInUseRaw,
  };
};

/**
 * Mapea el modelo de dominio o payloads al formato esperado por la API.
 * 
 * @param periodo - Datos del periodo a enviar.
 * @returns DTO parcial para la API.
 */
const toApi = (periodo: Partial<Periodo>): Partial<PeriodoApiDTO> => {
  const dto: Partial<PeriodoApiDTO> = {};
  if (periodo.description) dto.description = periodo.description;
  if (periodo.startDate) dto.startDate = Math.floor(periodo.startDate.getTime() / 1000);
  if (periodo.endDate) dto.endDate = Math.floor(periodo.endDate.getTime() / 1000);
  if (periodo.periodStatus) dto.periodStatus = periodo.periodStatus;
  if (typeof periodo.status === 'boolean') dto.status = periodo.status;
  if (periodo.periodId) dto.id = periodo.periodId; 
  if (periodo.code) dto.code = periodo.code;
  return dto;
};

/**
 * Obtiene todos los periodos académicos.
 * 
 * @returns Promesa con la lista de periodos.
 */
export const getPeriods = async (): Promise<Periodo[]> => {
  try {
    const response = await apiClient.get<PeriodoApiDTO[]>(API_URL);
    return response.data.map(fromApi);
  } catch (error) {
    console.error(`[periodService] Error al obtener periodos:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo periodo académico.
 * 
 * @param payload - Datos del nuevo periodo.
 * @returns Promesa con el periodo creado.
 */
export const createPeriod = async (payload: CreatePeriodPayload): Promise<Periodo> => {
  try {
    const response = await apiClient.post<PeriodoApiDTO>(API_URL, toApi(payload));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error al crear periodo:`, error);
    throw error;
  }
};

/**
 * Actualiza un periodo académico existente.
 * 
 * @param payload - Datos actualizados del periodo.
 * @returns Promesa con el periodo actualizado.
 */
export const updatePeriod = async (payload: UpdatePeriodPayload): Promise<Periodo> => {
  if (!payload.periodId) throw new Error("ID de periodo requerido para actualizar");
  try {
    const response = await apiClient.put<PeriodoApiDTO>(`${API_URL}/${payload.periodId}`, toApi(payload));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error al actualizar periodo:`, error);
    throw error;
  }
};

/**
 * Elimina (físicamente) un periodo académico.
 * 
 * @param id - Identificador del periodo a eliminar.
 */
export const deletePeriod = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`[periodService] Error al eliminar periodo:`, error);
    throw error;
  }
};

/**
 * Cambia el estado (activo/inactivo) de un periodo académico.
 * 
 * @param id - Identificador del periodo.
 * @param status - Nuevo estado.
 */
export const toggleStatus = async (id: string | number, status: boolean): Promise<void> => {
  try {
    await apiClient.patch(`${API_URL}/${id}/toggle-status`, { status });
  } catch (error) {
    console.error(`[periodService] Error al cambiar estado de periodo:`, error);
    throw error;
  }
};

/**
 * Realiza la eliminación masiva de periodos.
 * 
 * @param ids - Arreglo de identificadores.
 */
export const bulkDelete = async (ids: (string | number)[]): Promise<void> => {
  try {
    await apiClient.post(`${API_URL}/bulk-delete`, { ids });
  } catch (error) {
    console.error(`[periodService] Error en eliminación masiva de periodos:`, error);
    throw error;
  }
};

/**
 * Realiza la restauración masiva de periodos.
 * 
 * @param ids - Arreglo de identificadores.
 */
export const bulkRestore = async (ids: (string | number)[]): Promise<void> => {
  try {
    await apiClient.post(`${API_URL}/bulk-restore`, { ids });
  } catch (error) {
    console.error(`[periodService] Error en restauración masiva de periodos:`, error);
    throw error;
  }
};

// --- CRUD Adapter ---
export const getAll = getPeriods;
export const create = createPeriod;
export const update = updatePeriod;
export { deletePeriod as delete };