/**
 * @file Servicio para la gestión de periodos académicos (API).
 * @description Encapsula la lógica de comunicación con la API para las operaciones CRUD.
 */

import { Periodo } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/periodos";

// --- API Data Transformation ---

// DTO (Data Transfer Object) que representa la estructura de la API
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
  [key: string]: unknown;
}

const parseDate = (value: number | string | undefined): Date => {
  if (!value) return new Date();
  if (typeof value === "number") {
    // Unix timestamp in ms or seconds
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  return new Date(value);
};

// Convierte el DTO de la API al modelo de dominio del Frontend (con objetos Date)
const fromApi = (dto: PeriodoApiDTO): Periodo => {
  // Flexibilidad total para nombres de campos comunes en la API
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
    isInUse: !!isInUseRaw,
  };
};

// Convierte el modelo de dominio del Frontend al DTO para enviar a la API
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

export const getPeriods = async (): Promise<Periodo[]> => {
  try {
    const response = await apiClient.get<PeriodoApiDTO[]>(API_URL);
    return response.data.map(fromApi);
  } catch (error) {
    console.error(`[periodService] Error fetching periods:`, error);
    throw error;
  }
};

export const createPeriod = async (periodo: Omit<Periodo, "periodId" | "creationDate">): Promise<Periodo> => {
  try {
    const response = await apiClient.post<PeriodoApiDTO>(API_URL, toApi(periodo));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error creating period:`, error);
    throw error;
  }
};

export const updatePeriod = async (periodo: Periodo): Promise<Periodo> => {
  if (!periodo.periodId) throw new Error("ID de periodo requerido para actualizar");
  try {
    const response = await apiClient.put<PeriodoApiDTO>(`${API_URL}/${periodo.periodId}`, toApi(periodo));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error updating period:`, error);
    throw error;
  }
};

export const deletePeriod = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`[periodService] Error deleting period:`, error);
    throw error;
  }
};