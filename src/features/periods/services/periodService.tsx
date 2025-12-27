/**
 * @file Servicio para la gestión de periodos académicos (API).
 * @description Encapsula la lógica de comunicación con la API para las operaciones CRUD.
 */

import { Periodo } from "../types";

const MOCKAPI_URL = "https://694ed7abb5bc648a93c169dc.mockapi.io/periodos";

const parseDate = (val: any): Date => {
  if (typeof val === "number") return new Date(val * 1000);
  if (typeof val === "string") {
    if (val.includes("/")) {
      const [d, m, y] = val.split("/");
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }
    if (val.includes("-") && val.length === 10) {
      return new Date(`${val}T00:00:00`);
    }
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
};

const formatDate = (d: Date): string => {
  if (isNaN(d.getTime())) {
    throw new Error("Fecha inválida proporcionada para formatear.");
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getPeriods = async (): Promise<Periodo[]> => {
  const response = await fetch(MOCKAPI_URL);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data = await response.json();
  return data.map((item: any) => ({
    ...item,
    id: parseInt(item.id, 10),
    fechaInicio: parseDate(item.fechaInicio),
    fechaFin: parseDate(item.fechaFin),
  }));
};

export const createPeriod = async (
  periodoData: Omit<Periodo, "id">
): Promise<Periodo> => {
  const response = await fetch(MOCKAPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...periodoData,
      fechaInicio: formatDate(periodoData.fechaInicio),
      fechaFin: formatDate(periodoData.fechaFin),
    }),
  });
  if (!response.ok) throw new Error(`Error al crear: ${response.status}`);
  return response.json();
};

export const updatePeriod = async (
  id: number,
  periodoData: Periodo
): Promise<Periodo> => {
  const response = await fetch(`${MOCKAPI_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...periodoData,
      fechaInicio: formatDate(periodoData.fechaInicio),
      fechaFin: formatDate(periodoData.fechaFin),
    }),
  });
  if (!response.ok) throw new Error(`Error al actualizar: ${response.status}`);
  return response.json();
};

export const deletePeriod = async (id: number): Promise<void> => {
  const response = await fetch(`${MOCKAPI_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`Error al eliminar: ${response.status}`);
};