/**
 * @file userService.ts
 * @description Servicio para la gestión de usuarios mediante la factoría CRUD.
 */

import { createCrudService } from "../../../api/crudServiceFactory";
import apiClient from "../../../api/apiClient";
import { User, UserDetail, AuthLog, CreateUserPayload, UpdateUserPayload } from "../types";

/**
 * Interface para el Objeto de Transferencia de Datos (DTO) de Usuario de la API.
 */
interface UserDTO {
  id: number;
  userCi: string;
  name: string;
  surname: string;
  email: string;
  role: number;
  roleName?: string;
  status: number;
  creationDate: string;
  isInUse?: boolean;
  isImported?: boolean;
}

/**
 * Mapea un DTO de la API a la entidad de dominio User.
 */
const mapFromApi = (dto: UserDTO): User => ({
  id: dto.id,
  userCi: dto.userCi,
  name: dto.name,
  surname: dto.surname,
  email: dto.email,
  role: dto.role,
  roleName: dto.roleName,
  status: dto.status,
  creationDate: dto.creationDate,
  isInUse: dto.isInUse,
  isImported: dto.isImported
});

/**
 * Servicio de usuarios que proporciona métodos estandarizados para operaciones CRUD.
 * Sobrescribe getAll porque el backend devuelve paginado: { users, totalCount, totalPages }
 */
const crudBase = createCrudService<User, CreateUserPayload, UpdateUserPayload, UserDTO>({
  endpoint: "/users",
  mapFromApi
});

export const userService = {
  ...crudBase,
  getAll: async () => {
    const response = await apiClient.get("/users");
    return (response.data.users || []).map(mapFromApi);
  },
};

/**
 * Verifica si una cédula ya existe en el sistema (como usuario o como persona).
 * Retorna datos de la persona si existe pero no es usuario aún.
 */
export const checkUserCi = async (ci: string): Promise<UserCiCheckResult> => {
  const response = await apiClient.get(`/users/check-ci/${encodeURIComponent(ci)}`, { silent: true } as any);
  return response.data;
};

/**
 * Resetea la clave de un usuario (genera clave temporal y envía por email).
 */
export const resetUserPassword = async (userId: number): Promise<void> => {
  await apiClient.post(`/users/${userId}/reset-password`);
};

/**
 * Obtiene el detalle completo de un usuario por su ID.
 */
export const getUserById = async (id: number): Promise<UserDetail> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

/**
 * Obtiene el historial de login de un usuario específico.
 */
export const getLoginHistory = async (userId: number, limit: number = 20): Promise<{ logs: AuthLog[]; totalCount: number }> => {
  const response = await apiClient.get(`/users/${userId}/login-history`, { params: { limit } });
  return response.data;
};

export interface PersonCheckData {
  personId: number;
  ci: string;
  prefixCi: string;
  identificationNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  address: string | null;
  maritalStatus: string | null;
}

interface UserCiCheckResult {
  exists: boolean;
  asUser?: boolean;
  person?: PersonCheckData;
}
