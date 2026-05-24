/**
 * @file userService.ts
 * @description Servicio para la gestión de usuarios mediante la factoría CRUD.
 */

import { createCrudService } from "../../../api/crudServiceFactory";
import { User, CreateUserPayload, UpdateUserPayload } from "../types";

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
  status: number;
  creationDate: string;
  isInUse?: boolean;
  personId?: number;
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
  status: dto.status,
  creationDate: dto.creationDate,
  isInUse: dto.isInUse,
  personId: dto.personId
});

/**
 * Servicio de usuarios que proporciona métodos estandarizados para operaciones CRUD.
 */
export const userService = createCrudService<User, CreateUserPayload, UpdateUserPayload, UserDTO>({
  endpoint: "/users",
  mapFromApi
});
