/**
 * @file Servicio para la gestión de carreras (API).
 * @description Encapsula la comunicación con el endpoint `/careers` usando el mismo patrón que periodos.
 */

import { Career } from "../types";

// TODO: Reemplazar por la URL real del backend si aplica
const API_URL = "/api/careers";

// DTO de la API — flexible para adaptarse a números o strings
interface CareerApiDTO {
  // id por defecto de MockAPI
  id?: string;
  // variantes minúsculas
  careerId?: string;
  careerCode?: string;
  careerName?: string;
  minimumGrade?: number | string;
  careerAbbreviation?: string;
  internshipTypeIds?: string[];
  creationDate?: number | string;
  status?: boolean | number;
  // variantes mayúsculas
  CAREER_ID?: string;
  CAREER_CODE?: string;
  CAREER_NAME?: string;
  MINIMUM_GRADE?: number | string;
  CAREER_ABBREVIATION?: string;
  INTERNSHIP_TYPE_IDS?: string[];
  CREATION_DATE?: number | string;
  STATUS?: boolean | number;
  // variantes adicionales que podrían aparecer
  ID?: string;
}

const parseDate = (value: number | string): Date => {
  if (typeof value === "number") {
    // si viene en segundos
    const ms = value < 1e12 ? value * 1000 : value; // heurística simple
    return new Date(ms);
  }
  // ISO string
  return new Date(value);
};

const fromApi = (dto: CareerApiDTO): Career => {
  const careerIdRaw = dto.careerId ?? dto.CAREER_ID ?? dto.id ?? dto.ID ?? "";
  const careerCodeRaw = dto.careerCode ?? dto.CAREER_CODE ?? "";
  const careerNameRaw = dto.careerName ?? dto.CAREER_NAME ?? "";
  const rawMinimum = dto.minimumGrade ?? dto.MINIMUM_GRADE ?? 0;
  const careerAbbreviationRaw = dto.careerAbbreviation ?? dto.CAREER_ABBREVIATION ?? "";
  const internshipTypeIdsRaw = dto.internshipTypeIds ?? dto.INTERNSHIP_TYPE_IDS ?? [];
  const rawCreation = dto.creationDate ?? dto.CREATION_DATE ?? Date.now();
  const rawStatus = dto.status ?? dto.STATUS ?? true;

  const minimumGrade = typeof rawMinimum === "string" ? parseFloat(rawMinimum) : rawMinimum;
  const creationDate = parseDate(rawCreation);
  const status = typeof rawStatus === "number" ? rawStatus === 1 : !!rawStatus;

  // Normalización: garantizar strings para campos textuales y ids
  const careerId = String(careerIdRaw);
  const careerCode = String(careerCodeRaw);
  const careerName = String(careerNameRaw);
  const careerAbbreviation = String(careerAbbreviationRaw);
  const internshipTypeIds = Array.isArray(internshipTypeIdsRaw)
    ? internshipTypeIdsRaw.map((v) => String(v))
    : [];

  return {
    careerId,
    careerCode,
    careerName,
    minimumGrade: isNaN(minimumGrade as number) ? 0 : (minimumGrade as number),
    careerAbbreviation,
    internshipTypeIds,
    creationDate,
    status,
  };
};

const toApi = (career: Partial<Career>): Partial<CareerApiDTO> => {
  const dto: Partial<CareerApiDTO> = {};
  if (career.careerCode !== undefined) {
    dto.careerCode = career.careerCode;
    dto.CAREER_CODE = career.careerCode as unknown as string;
  }
  if (career.careerName !== undefined) {
    dto.careerName = career.careerName;
    dto.CAREER_NAME = career.careerName as unknown as string;
  }
  if (career.minimumGrade !== undefined) {
    dto.minimumGrade = career.minimumGrade as number;
    dto.MINIMUM_GRADE = career.minimumGrade as number;
  }
  if (career.careerAbbreviation !== undefined) {
    dto.careerAbbreviation = career.careerAbbreviation;
    dto.CAREER_ABBREVIATION = career.careerAbbreviation as unknown as string;
  }
  if (career.internshipTypeIds !== undefined) {
    dto.internshipTypeIds = career.internshipTypeIds;
    dto.INTERNSHIP_TYPE_IDS = (career.internshipTypeIds as string[]);
  }
  if (career.status !== undefined) {
    dto.status = career.status;
    dto.STATUS = career.status ? 1 : 0;
  }
  if (career.careerId !== undefined) {
    // incluir id por compatibilidad con MockAPI
    dto.id = career.careerId;
    dto.careerId = career.careerId;
    dto.CAREER_ID = career.careerId;
  }
  if (career.creationDate !== undefined) {
    dto.creationDate = (career.creationDate as Date).toISOString();
    dto.CREATION_DATE = (career.creationDate as Date).toISOString();
  }
  return dto;
};

export const getCareers = async (retries = 3): Promise<Career[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      if (response.status === 503 && retries > 0) {
        console.warn(`Servicio no disponible (503), reintentando... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return getCareers(retries - 1);
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data: CareerApiDTO[] = await response.json();
    return data.map(fromApi);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Error de red o servidor, reintentando... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getCareers(retries - 1);
    }
    throw error;
  }
};

export const createCareer = async (
  careerData: Omit<Career, "careerId" | "creationDate">
): Promise<Career> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApi(careerData)),
  });
  if (!response.ok) throw new Error(`Error al crear: ${response.status}`);
  const created: CareerApiDTO = await response.json();
  return fromApi(created);
};

export const updateCareer = async (careerData: Career): Promise<Career> => {
  if (!careerData.careerId || String(careerData.careerId).trim().length === 0) {
    throw new Error("careerId es requerido para actualizar la carrera");
  }
  const response = await fetch(`${API_URL}/${careerData.careerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(toApi(careerData)),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.text();
      detail = errBody?.slice(0, 200) || "";
    } catch {
      // si falla leer el cuerpo, mantenemos el detalle vacío
      detail = "";
    }
    throw new Error(`Error al actualizar: ${response.status}${detail ? ` — ${detail}` : ""}`);
  }
  const updated: CareerApiDTO = await response.json();
  return fromApi(updated);
};

// Soft delete: marcar como inactivo
export const deleteCareer = async (career: Career): Promise<Career> => {
  if (!career.careerId || String(career.careerId).trim().length === 0) {
    throw new Error("careerId es requerido para eliminar la carrera");
  }
  const updatedCareer = { ...career, status: false };
  return updateCareer(updatedCareer);
};

// Cambio de estado explícito
export const toggleCareerStatus = async (career: Career): Promise<Career> => {
  if (!career.careerId || String(career.careerId).trim().length === 0) {
    throw new Error("careerId es requerido para cambiar el estado");
  }
  const updatedCareer = { ...career, status: !career.status };
  return updateCareer(updatedCareer);
};
