/**
 * @file Servicio para la gestión de carreras (API).
 * @description Encapsula la comunicación con el endpoint `/careers` usando el mismo patrón que periodos.
 */

import { Career } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/careers";

// Datos de respaldo (Static Mock) para evitar bloqueos por fallos de red en MockAPI
const STATIC_CAREERS: Career[] = [
  {
    careerId: "static-1",
    careerCode: "SIS-01",
    careerName: "Ingeniería de Sistemas",
    minimumGrade: 14,
    careerAbbreviation: "SIS",
    internshipTypeIds: ["1", "2"],
    creationDate: new Date(),
    status: true,
  },
  {
    careerId: "static-2",
    careerCode: "IND-01",
    careerName: "Ingeniería Industrial",
    minimumGrade: 13,
    careerAbbreviation: "IND",
    internshipTypeIds: ["1"],
    creationDate: new Date(),
    status: true,
  },
  {
    careerId: "static-3",
    careerCode: "DER-01",
    careerName: "Derecho",
    minimumGrade: 15,
    careerAbbreviation: "DER",
    internshipTypeIds: ["3"],
    creationDate: new Date(),
    status: true,
  },
];

// DTO de la API — flexible para adaptarse a números o strings
interface CareerApiDTO {
  careerId?: string | number;
  CAREER_ID?: string | number;
  id?: string | number;
  ID?: string | number;
  _id?: string | number;
  careerCode?: string | number;
  CAREER_CODE?: string | number;
  career_code?: string | number;
  code?: string | number;
  codigo?: string | number;
  careerName?: string;
  CAREER_NAME?: string;
  career_name?: string;
  name?: string;
  nombre?: string;
  title?: string;
  minimumGrade?: string | number;
  MINIMUM_GRADE?: string | number;
  minimum_grade?: string | number;
  minGrade?: string | number;
  notaMinima?: string | number;
  careerAbbreviation?: string;
  CAREER_ABBREVIATION?: string;
  career_abbreviation?: string;
  abbreviation?: string;
  siglas?: string;
  internshipTypeIds?: string[];
  INTERNSHIP_TYPE_IDS?: string[];
  internship_type_ids?: string[];
  internships?: string[];
  creationDate?: string | number;
  CREATION_DATE?: string | number;
  created_at?: string | number;
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
  const careerCodeRaw = (dto.careerCode ?? dto.CAREER_CODE ?? dto.career_code ?? dto.code ?? dto.codigo ?? "") as string;
  const careerNameRaw = (dto.careerName ?? dto.CAREER_NAME ?? dto.career_name ?? dto.name ?? dto.nombre ?? dto.title ?? "") as string;
  const rawMinimum = dto.minimumGrade ?? dto.MINIMUM_GRADE ?? dto.minimum_grade ?? dto.minGrade ?? dto.notaMinima ?? 0;
  const careerAbbreviationRaw = (dto.careerAbbreviation ?? dto.CAREER_ABBREVIATION ?? dto.career_abbreviation ?? dto.abbreviation ?? dto.siglas ?? "") as string;
  const internshipTypeIdsRaw = (dto.internshipTypeIds ?? dto.INTERNSHIP_TYPE_IDS ?? dto.internship_type_ids ?? dto.internships ?? []) as string[];
  const rawCreation = dto.creationDate ?? dto.CREATION_DATE ?? dto.created_at ?? dto.createdAt ?? dto.fechaCreacion ?? Date.now();
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
  
  // Enviar campos en MAYÚSCULAS para tu tabla específica
  if (career.careerCode !== undefined) dto.CAREER_CODE = career.careerCode;
  if (career.careerName !== undefined) dto.CAREER_NAME = career.careerName;
  if (career.minimumGrade !== undefined) dto.MINIMUM_GRADE = career.minimumGrade;
  if (career.careerAbbreviation !== undefined) dto.CAREER_ABBREVIATION = career.careerAbbreviation;
  if (career.status !== undefined) dto.STATUS = career.status === true ? 1 : (career.status === false ? 0 : career.status);
  
  // El ID se maneja en la URL en PUT/DELETE
  if (career.careerId !== undefined) {
    dto.CAREER_ID = typeof career.careerId === 'string' ? parseInt(career.careerId, 10) : career.careerId;
  }

  return dto;
};

export const getCareers = async (): Promise<Career[]> => {
  try {
    const response = await apiClient.get<CareerApiDTO[]>(API_URL);
    return response.data.map(fromApi);
  } catch (error) {
    console.error(`[careersService] Error fetching careers from API, using static fallback:`, error);
    // En lugar de propagar el error y romper la UI, devolvemos datos estáticos
    // pero marcamos que son de respaldo (opcionalmente)
    return STATIC_CAREERS;
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
export const deleteCareer = async (careerId: string | number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${careerId}`);
};

// Cambio de estado explícito
export const toggleCareerStatus = async (career: Career): Promise<Career> => {
  if (!career.careerId || String(career.careerId).trim().length === 0) {
    throw new Error("careerId es requerido para cambiar el estado");
  }
  const updatedCareer = { ...career, status: !career.status };
  return updateCareer(updatedCareer);
};
