/**
 * @file periodTypeDatesService.ts
 * @description Servicio CRUD para fechas personalizadas por tipo de pasantía (t_period_type_dates).
 */

import apiClient from "../../../api/apiClient";
import { PeriodTypeDate } from "../types";

const API_URL = "/period-type-dates";

/**
 * Obtiene todas las fechas personalizadas para un periodo.
 * @param periodId - ID del periodo.
 * @returns Lista de registros PeriodTypeDate.
 */
export const getByPeriod = async (periodId: number): Promise<PeriodTypeDate[]> => {
  const response = await apiClient.get<PeriodTypeDate[]>(`${API_URL}?periodId=${periodId}`);
  return response.data;
};

/**
 * Obtiene las fechas para un periodo y tipo específicos.
 * @param periodId - ID del periodo.
 * @param internshipTypeId - ID del tipo de pasantía.
 * @returns El registro o null si no existe.
 */
export const getByPeriodAndType = async (periodId: number, internshipTypeId: number): Promise<PeriodTypeDate | null> => {
  const response = await apiClient.get<PeriodTypeDate | null>(`${API_URL}?periodId=${periodId}&internshipTypeId=${internshipTypeId}`);
  return response.data;
};

/**
 * Crea o actualiza (upsert) fechas para un tipo de pasantía en un periodo.
 * @param data - Datos del registro (periodId, internshipTypeId, startDate, endDate).
 * @returns El registro creado o actualizado.
 */
export const upsert = async (data: Omit<PeriodTypeDate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PeriodTypeDate> => {
  const response = await apiClient.post<PeriodTypeDate>(API_URL, data);
  return response.data;
};

/**
 * Elimina un registro de fechas personalizadas.
 * @param id - ID del registro a eliminar.
 */
export const remove = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

export const getAll = getByPeriod;
export const create = upsert;
export { remove as delete };
