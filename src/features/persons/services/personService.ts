/**
 * @file personService.ts
 * @description Servicio para la gestión de personas via API /api/persons.
 * Provee operaciones CRUD y utilidades para la superentidad t_persons.
 */

import apiClient from "../../../api/apiClient";
import { Persona, CreatePersonaPayload, UpdatePersonaPayload, CheckAvailabilityResult } from "../types";

const API_URL = "/persons";

/**
 * Normaliza los datos de una persona desde la API al frontend.
 */
const mapFromApi = (data: any): Persona => ({
  personId: data.personId ?? data.person_id,
  ci: data.ci,
  prefixCi: data.prefixCi ?? data.ci?.split("-")[0] ?? "V",
  identificationNumber: data.identificationNumber ?? data.ci?.split("-")[1] ?? "",
  firstName: data.firstName ?? data.first_name ?? "",
  middleName: data.middleName ?? data.middle_name ?? undefined,
  lastName: data.lastName ?? data.last_name ?? "",
  secondLastName: data.secondLastName ?? data.second_last_name ?? undefined,
  email: data.email ?? "",
  phone: data.phone ?? undefined,
  gender: data.gender ?? undefined,
  birthDate: data.birthDate ?? data.birthdate ?? undefined,
  address: data.address ?? undefined,
  maritalStatus: data.maritalStatus ?? data.marital_status ?? undefined,
  status: data.status ?? 1,
  createdAt: data.createdAt ?? data.created_at ?? "",
  updatedAt: data.updatedAt ?? data.updated_at ?? "",
});

/**
 * Normaliza los datos al formato que espera la API.
 */
const mapToApi = (data: CreatePersonaPayload | UpdatePersonaPayload): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if ("ci" in data) result.ci = data.ci;
  if (data.firstName !== undefined) result.firstName = data.firstName;
  if (data.middleName !== undefined) result.middleName = data.middleName;
  if (data.lastName !== undefined) result.lastName = data.lastName;
  if (data.secondLastName !== undefined) result.secondLastName = data.secondLastName;
  if (data.email !== undefined) result.email = data.email;
  if (data.phone !== undefined) result.phone = data.phone;
  if (data.gender !== undefined) result.gender = data.gender;
  if (data.birthDate !== undefined) result.birthDate = data.birthDate;
  if (data.address !== undefined) result.address = data.address;
  if (data.maritalStatus !== undefined) result.maritalStatus = data.maritalStatus;
  if (data.status !== undefined) result.status = data.status;

  return result;
};

/**
 * Obtiene la lista paginada de personas.
 */
export const getPersons = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}): Promise<{ data: Persona[]; total: number; page: number; limit: number; totalPages: number }> => {
  try {
    const response = await apiClient.get(API_URL, { params });
    return {
      data: (response.data?.data || []).map(mapFromApi),
      total: response.data?.total ?? 0,
      page: response.data?.page ?? 1,
      limit: response.data?.limit ?? 50,
      totalPages: response.data?.totalPages ?? 0,
    };
  } catch (error) {
    console.error("[personService] Error al obtener personas:", error);
    throw error;
  }
};

/**
 * Obtiene una persona por su ID.
 */
export const getPersonById = async (personId: number): Promise<Persona | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/${personId}`);
    return mapFromApi(response.data);
  } catch (error) {
    console.error("[personService] Error al obtener persona:", error);
    return null;
  }
};

/**
 * Obtiene una persona por su cédula.
 */
export const getPersonByCi = async (ci: string): Promise<Persona | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/by-ci/${encodeURIComponent(ci)}`);
    return mapFromApi(response.data);
  } catch (error) {
    console.error("[personService] Error al obtener persona por CI:", error);
    return null;
  }
};

/**
 * Busca personas globalmente (por nombre, apellido o CI).
 */
export const searchPersons = async (query: string): Promise<Persona[]> => {
  try {
    const response = await apiClient.get(`${API_URL}/search`, { params: { q: query } });
    return (response.data?.data || []).map(mapFromApi);
  } catch (error) {
    console.error("[personService] Error al buscar personas:", error);
    return [];
  }
};

/**
 * Crea una nueva persona.
 */
export const createPerson = async (data: CreatePersonaPayload): Promise<Persona> => {
  try {
    const response = await apiClient.post(API_URL, mapToApi(data));
    return mapFromApi(response.data);
  } catch (error) {
    console.error("[personService] Error al crear persona:", error);
    throw error;
  }
};

/**
 * Actualiza una persona existente.
 */
export const updatePerson = async (personId: number, data: UpdatePersonaPayload): Promise<Persona> => {
  try {
    const response = await apiClient.put(`${API_URL}/${personId}`, mapToApi(data));
    return mapFromApi(response.data);
  } catch (error) {
    console.error("[personService] Error al actualizar persona:", error);
    throw error;
  }
};

/**
 * Cambia el estado (activo/inactivo) de una persona.
 */
export const togglePersonStatus = async (personId: number, status: boolean): Promise<Persona> => {
  try {
    const response = await apiClient.patch(`${API_URL}/${personId}/status`, { status });
    return mapFromApi(response.data);
  } catch (error) {
    console.error("[personService] Error al cambiar estado:", error);
    throw error;
  }
};

/**
 * Verifica disponibilidad de CI o Email.
 */
export const checkAvailability = async (
  type: "ci" | "email",
  value: string,
  excludeId?: number
): Promise<CheckAvailabilityResult> => {
  try {
    const response = await apiClient.get(`${API_URL}/check/${type}/${encodeURIComponent(value)}`, {
      params: excludeId ? { excludeId } : undefined,
    });
    return response.data;
  } catch (error) {
    console.error(`[personService] Error al verificar ${type}:`, error);
    throw error;
  }
};
