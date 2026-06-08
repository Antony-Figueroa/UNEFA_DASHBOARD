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

/**
 * Detalle completo de un usuario (para el modal de detalle).
 */
export interface UserDetail extends User {
    /** Login del usuario */
    user?: string;
    /** ID de la persona asociada (t_persons) */
    personId?: number;
    /** Segundo nombre */
    secondName?: string;
    /** Segundo apellido */
    secondSurname?: string;
    /** Número de teléfono */
    phoneNumber?: string;
    /** Estado de sesión (0: offline, 1: online) */
    statusSession?: number;
    /** Intentos de inicio de sesión fallidos */
    failedAttempts?: number;
    /** Fecha de bloqueo de cuenta */
    lockDate?: string | null;
    /** Si debe forzar cambio de contraseña */
    forcePasswordChange?: boolean;
    /** Número de inicios de sesión */
    loginCount?: number;
    /** Estado de términos y condiciones ('ACEPTADO' | '0' | etc) */
    termsConditions?: string;
    /** Información de la clave activa */
    key?: UserKeyInfo | null;
}

/**
 * Información de la clave/contraseña activa del usuario.
 */
export interface UserKeyInfo {
    /** Si la clave es temporal */
    isTemporary: boolean;
    /** Fecha de inicio de vigencia */
    startDate: string;
    /** Fecha de fin de vigencia */
    endDate: string;
    /** Estado de la clave (1: activa) */
    status: number;
}

/**
 * Registro del historial de autenticación.
 */
export interface AuthLog {
    /** ID del registro */
    id: number;
    /** ID del usuario */
    userId: number;
    /** Cédula del usuario */
    userCi: string;
    /** Acción realizada */
    action: AuthAction;
    /** Dirección IP desde donde se realizó */
    ipAddress: string;
    /** User-Agent del navegador */
    userAgent: string;
    /** Descripción del evento */
    details: string;
    /** Fecha del evento */
    createdAt: string;
}

/**
 * Tipos de acciones de autenticación registradas en t_auth_log.
 */
export type AuthAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'ACCOUNT_LOCKED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'RESET_PASSWORD';
