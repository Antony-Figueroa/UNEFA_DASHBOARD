/**
 * @file careersService.tsx
 * @description Servicio para la gestión de carreras (API).
 * Encapsula la comunicación con el endpoint `/careers` y realiza el mapeo de datos.
 * 
 * @module features/careers/services
 */

import { Career, CreateCareerPayload, UpdateCareerPayload } from "../types";
import { createCrudService } from "../../../api/crudServiceFactory";
import apiClient from "../../../api/apiClient";

const API_URL = "/careers";

/**
 * Interfaz interna que representa la estructura cruda devuelta por la API.
 */
interface CareerApiDTO {
  careerId?: string | number;
  CAREER_ID?: string | number;
  id?: string | number;
  ID?: string | number;
  careerCode?: string | number;
  career_code?: string | number;
  careerName?: string;
  career_name?: string;
  minimumGrade?: string | number;
  minimum_grade?: string | number;
  careerAbbreviation?: string;
  career_abbreviation?: string;
  internshipTypeIds?: (string | number)[];
  creationDate?: string | number;
  createdAt?: string | number;
  status?: boolean | number;
  careerType?: "CORTA" | "LARGA";
  isInUse?: boolean;
  hasPendingEvaluations?: boolean;
  [key: string]: unknown;
}

const parseDate = (value: number | string | undefined): Date => {
  if (!value) return new Date();
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  return new Date(value);
};

/**
 * Mapea un objeto crudo de la API (DTO) a la entidad de dominio Career.
 */
const mapFromApi = (dto: CareerApiDTO): Career => {
  const careerId = String(dto.careerId ?? dto.CAREER_ID ?? dto.id ?? dto.ID ?? "");
  const careerCode = String(dto.careerCode ?? dto.career_code ?? "");
  const careerName = String(dto.careerName ?? dto.career_name ?? "");
  const rawMinimum = dto.minimumGrade ?? dto.minimum_grade ?? 0;
  const minimumGrade = typeof rawMinimum === "string" ? parseFloat(rawMinimum) : rawMinimum;
  
  return {
    careerId,
    careerCode,
    careerName,
    minimumGrade: isNaN(minimumGrade as number) ? 0 : (minimumGrade as number),
    careerAbbreviation: String(dto.careerAbbreviation ?? dto.career_abbreviation ?? ""),
    careerType: (dto.careerType ?? "LARGA") as "CORTA" | "LARGA",
    internshipTypeIds: Array.isArray(dto.internshipTypeIds) ? dto.internshipTypeIds.map(String) : [],
    creationDate: parseDate(dto.creationDate ?? dto.createdAt),
    status: dto.status === undefined ? true : (typeof dto.status === "number" ? dto.status === 1 : !!dto.status),
    isInUse: !!dto.isInUse,
    hasPendingEvaluations: !!dto.hasPendingEvaluations,
  };
};

/**
 * Mapea la entidad de dominio Career o sus payloads al formato esperado por la API (DTO).
 */
const mapToApi = (payload: any): any => {
  return {
    CAREER_ID: payload.careerId,
    CAREER_CODE: payload.careerCode,
    CAREER_NAME: payload.careerName,
    MINIMUM_GRADE: payload.minimumGrade,
    CAREER_ABBREVIATION: payload.careerAbbreviation,
    CAREER_TYPE: payload.careerType,
    INTERNSHIP_TYPE_IDS: payload.internshipTypeIds,
    STATUS: payload.status === true ? 1 : (payload.status === false ? 0 : payload.status),
  };
};

/**
 * Servicio centralizado para la gestión de carreras generado mediante la fábrica CRUD.
 * 
 * Reemplaza las implementaciones manuales individuales por una estructura estandarizada,
 * manteniendo la lógica de mapeo específica para compatibilidad con el backend.
 */
export const careerService = createCrudService<Career, CreateCareerPayload, UpdateCareerPayload, CareerApiDTO>({
  endpoint: API_URL,
  idField: "careerId",
  mapFromApi,
  mapToApi
});

// Mantener exportaciones individuales para compatibilidad con código existente si es necesario
export const getCareers = careerService.getAll;
export const getCareerById = careerService.getById;
export const createCareer = careerService.create;
export const updateCareer = careerService.update;
export const deleteCareer = careerService.delete;
export const toggleCareerStatus = careerService.toggleStatus!;

/**
 * Obtiene una carrera por su código.
 * @param code - Código de la carrera.
 * @returns Promesa con los datos de la carrera o null si no existe.
 */
export const getCareerByCode = async (code: string): Promise<Career | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-code/${code}`, { silent: true, withCredentials: true } as any);
    return response.data?.data || null;
  } catch {
    // 404 es comportamiento esperado (código no existe), no es error
    return null;
  }
};
