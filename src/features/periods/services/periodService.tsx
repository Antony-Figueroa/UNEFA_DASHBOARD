/**
 * @file Servicio para la gestión de periodos académicos (API).
 * @description Encapsula la lógica de comunicación con la API para las operaciones CRUD.
 */

import { Periodo } from "../types";

const API_URL = "/api/periodos";

// --- API Data Transformation ---

// DTO (Data Transfer Object) que representa la estructura de la API
interface PeriodoApiDTO {
  periodId: string;
  startDate: number; // timestamp en segundos
  endDate: number;   // timestamp en segundos
  creationDate: number; // timestamp en segundos
  description: string;
  periodStatus: number;
  status: boolean;
}

// Convierte el DTO de la API al modelo de dominio del Frontend (con objetos Date)
const fromApi = (dto: PeriodoApiDTO): Periodo => ({
  periodId: dto.periodId,
  description: dto.description,
  startDate: new Date(dto.startDate * 1000),
  endDate: new Date(dto.endDate * 1000),
  creationDate: new Date(dto.creationDate * 1000),
  periodStatus: dto.periodStatus as 1 | 2 | 3,
  status: dto.status,
});

// Convierte el modelo de dominio del Frontend al DTO para enviar a la API
const toApi = (periodo: Partial<Periodo>): Partial<PeriodoApiDTO> => {
  const dto: Partial<PeriodoApiDTO> = {};
  if (periodo.description) dto.description = periodo.description;
  if (periodo.startDate) dto.startDate = Math.floor(periodo.startDate.getTime() / 1000);
  if (periodo.endDate) dto.endDate = Math.floor(periodo.endDate.getTime() / 1000);
  if (periodo.periodStatus) dto.periodStatus = periodo.periodStatus;
  if (typeof periodo.status === 'boolean') dto.status = periodo.status;
  return dto;
};

export const getPeriods = async (): Promise<Periodo[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data: PeriodoApiDTO[] = await response.json();
  return data.map(fromApi);
};

export const createPeriod = async (periodo: Omit<Periodo, "periodId" | "creationDate">): Promise<Periodo> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApi(periodo)),
  });
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data: PeriodoApiDTO = await response.json();
  return fromApi(data);
};

export const updatePeriod = async (periodo: Periodo): Promise<Periodo> => {
  const response = await fetch(`${API_URL}/${periodo.periodId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApi(periodo)),
  });
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data: PeriodoApiDTO = await response.json();
  return fromApi(data);
};

// Eliminación lógica (soft delete)
export const deletePeriod = async (periodo: Periodo): Promise<Periodo> => {
  const updatedPeriod = { ...periodo, status: false }; // Marcar como eliminado
  return updatePeriod(updatedPeriod);
};