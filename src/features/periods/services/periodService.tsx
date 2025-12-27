/**
 * @file Servicio para la gestión de periodos académicos (API).
 * @description Encapsula la lógica de comunicación con la API para las operaciones CRUD.
 */

import { Periodo } from "../types";

const MOCKAPI_URL = "https://694ed7abb5bc648a93c169dc.mockapi.io/periodos";

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
  periodStatus: dto.periodStatus,
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
  const response = await fetch(MOCKAPI_URL);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data: PeriodoApiDTO[] = await response.json();
  return data.map(fromApi);
};

export const createPeriod = async (
  periodoData: Omit<Periodo, "periodId" | "creationDate">
): Promise<Periodo> => {
  const response = await fetch(MOCKAPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApi(periodoData)),
  });
  if (!response.ok) throw new Error(`Error al crear: ${response.status}`);
  const created: PeriodoApiDTO = await response.json();
  return fromApi(created);
};

export const updatePeriod = async (periodoData: Periodo): Promise<Periodo> => {
  const response = await fetch(`${MOCKAPI_URL}/${periodoData.periodId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApi(periodoData)),
  });
  if (!response.ok) throw new Error(`Error al actualizar: ${response.status}`);
  const updated: PeriodoApiDTO = await response.json();
  return fromApi(updated);
};

// Eliminación lógica (soft delete)
export const deletePeriod = async (periodo: Periodo): Promise<Periodo> => {
  const updatedPeriod = { ...periodo, status: false }; // Marcar como eliminado
  return updatePeriod(updatedPeriod);
};