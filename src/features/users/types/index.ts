/**
 * @file index.ts
 * @description Definiciones de tipos para el módulo de Usuarios.
 */

/**
 * Representa un usuario del sistema.
 */
export interface User {
    /** Identificador único del usuario */
    id: number;
    /** Cédula de identidad del usuario */
    userCi: string;
    /** Nombre del usuario */
    name: string;
    /** Apellido del usuario */
    surname: string;
    /** Correo electrónico institucional */
    email: string;
    /** Rol del usuario (0: MAESTRO, 1: ADMIN, 2: ASISTENTE) */
    role: number;
    /** Estado del usuario (1: Activo, 0: Inactivo) */
    status: number;
    /** Fecha de creación del registro */
    creationDate: string;
    /** Indica si el usuario tiene registros asociados que impiden su eliminación */
    isInUse?: boolean;
    /** Indica si el usuario fue creado a partir de un registro existente (estudiante/tutor) */
    isImported?: boolean;
    /** Nombre del rol (desde t_roles en BD) */
    roleName?: string;
}

/**
 * Payload para la creación de un nuevo usuario.
 */
export interface CreateUserPayload {
    /** Cédula de identidad */
    userCi: string;
    /** Nombre */
    name: string;
    /** Apellido */
    surname: string;
    /** Correo electrónico */
    email: string;
    /** Rol asignado */
    role: number;
}

/**
 * Payload para la actualización de un usuario existente.
 */
export interface UpdateUserPayload extends Partial<CreateUserPayload> {
    /** Identificador único del usuario a actualizar */
    id: number;
    /** Nuevo estado del usuario */
    status?: number;
}

/**
 * Representa los datos de un usuario para visualización en tablas.
 */
export interface UserRowData extends User {
    // Campos adicionales para la vista si fueran necesarios
}
