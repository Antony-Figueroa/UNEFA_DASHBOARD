/**
 * @file Servicio para la gestión de carreras (API).
 * @description Encapsula la comunicación con el endpoint `/careers` usando el mismo patrón que periodos.
 */

import { Career } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/careers";

// DTO de la API — flexible para adaptarse a números o strings
interface CareerApiDTO {
  careerId?: string;
  CAREER_ID?: string;
  id?: string;
  ID?: string;
  _id?: string;
  careerCode?: string;
  CAREER_CODE?: string;
  code?: string;
  codigo?: string;
  careerName?: string;
  CAREER_NAME?: string;
  name?: string;
  nombre?: string;
  title?: string;
  minimumGrade?: string | number;
  MINIMUM_GRADE?: string | number;
  minGrade?: string | number;
  notaMinima?: string | number;
  careerAbbreviation?: string;
  CAREER_ABBREVIATION?: string;
  abbreviation?: string;
  siglas?: string;
  internshipTypeIds?: string[];
  INTERNSHIP_TYPE_IDS?: string[];
  internships?: string[];
  creationDate?: string | number;
  CREATION_DATE?: string | number;
  createdAt?: string | number;
  fechaCreacion?: string | number;
  status?: boolean | number;
  STATUS?: boolean | number;
  activo?: boolean | number;
  enabled?: boolean | number;
  [key: string]: unknown; // Index signature to allow dynamic access
}

const parseDate = (value: number | string | undefined): Date => {
  if (!value) return new Date();
  if (typeof value === "number") {
    // Si viene en segundos (típico de MockAPI)
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  return new Date(value);
};

const fromApi = (dto: CareerApiDTO): Career => {
  // Flexibilidad total para nombres de campos comunes
  const careerIdRaw = (dto.careerId ?? dto.CAREER_ID ?? dto.id ?? dto.ID ?? dto._id ?? "") as string;
  const careerCodeRaw = (dto.careerCode ?? dto.CAREER_CODE ?? dto.code ?? dto.codigo ?? "") as string;
  const careerNameRaw = (dto.careerName ?? dto.CAREER_NAME ?? dto.name ?? dto.nombre ?? dto.title ?? "") as string;
  const rawMinimum = dto.minimumGrade ?? dto.MINIMUM_GRADE ?? dto.minGrade ?? dto.notaMinima ?? 0;
  const careerAbbreviationRaw = (dto.careerAbbreviation ?? dto.CAREER_ABBREVIATION ?? dto.abbreviation ?? dto.siglas ?? "") as string;
  const internshipTypeIdsRaw = (dto.internshipTypeIds ?? dto.INTERNSHIP_TYPE_IDS ?? dto.internships ?? []) as string[];
  const rawCreation = dto.creationDate ?? dto.CREATION_DATE ?? dto.createdAt ?? dto.fechaCreacion ?? Date.now();
  const rawStatus = dto.status ?? dto.STATUS ?? dto.activo ?? dto.enabled;

  const minimumGrade = typeof rawMinimum === "string" ? parseFloat(rawMinimum) : rawMinimum;
  const creationDate = parseDate(rawCreation as number | string);
  
  // Si status es undefined, asumimos true (activo)
  const status = rawStatus === undefined ? true : (typeof rawStatus === "number" ? rawStatus === 1 : !!rawStatus);

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
  
  // Enviar solo los campos necesarios y en el formato que espera MockAPI
  if (career.careerCode !== undefined) dto.careerCode = career.careerCode;
  if (career.careerName !== undefined) dto.careerName = career.careerName;
  if (career.minimumGrade !== undefined) dto.minimumGrade = career.minimumGrade;
  if (career.careerAbbreviation !== undefined) dto.careerAbbreviation = career.careerAbbreviation;
  if (career.status !== undefined) dto.status = career.status;
  if (career.internshipTypeIds !== undefined) dto.internshipTypeIds = career.internshipTypeIds;
  
  // El ID se maneja en la URL, pero algunos mocks lo requieren en el body
  if (career.careerId !== undefined) {
    dto.id = career.careerId;
    dto.careerId = career.careerId;
  }

  return dto;
};

export const getCareers = async (): Promise<Career[]> => {
  try {
    const response = await apiClient.get<CareerApiDTO[]>(API_URL);
    return response.data.map(fromApi);
  } catch (error) {
    console.error(`[careersService] Error fetching careers:`, error);
    throw error;
  }
};

export const createCareer = async (
  careerData: Omit<Career, "careerId" | "creationDate">
): Promise<Career> => {
  try {
    const response = await apiClient.post<CareerApiDTO>(API_URL, toApi(careerData));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[careersService] Error creating career:`, error);
    throw error;
  }
};

export const updateCareer = async (careerData: Career): Promise<Career> => {
  if (!careerData.careerId || String(careerData.careerId).trim().length === 0) {
    throw new Error("careerId es requerido para actualizar la carrera");
  }
  try {
    const response = await apiClient.put<CareerApiDTO>(
      `${API_URL}/${careerData.careerId}`,
      toApi(careerData)
    );
    return fromApi(response.data);
  } catch (error) {
    console.error(`[careersService] Error updating career:`, error);
    throw error;
  }
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
