/**
 * @file Define la estructura de datos para un periodo académico.
 * @description Este archivo centraliza las interfaces para asegurar consistencia en todo el módulo.
 */

/**
 * Representa fechas personalizadas por tipo de pasantía dentro de un periodo.
 */
export interface PeriodTypeDate {
    id?: number;
    periodId: number;
    internshipTypeId: number;
    startDate: string | null;
    endDate: string | null;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Representa un periodo académico en el sistema (Modelo de Dominio).
 */
export interface Periodo {
    /** Identificador único del periodo */
    periodId: string;
    /** Descripción o nombre del periodo (ej. 2024-I) */
    description: string;
    /** Fecha de inicio del periodo */
    startDate: Date;
    /** Fecha de culminación del periodo */
    endDate: Date;
    /** Fecha de creación del registro */
    creationDate: Date;
    /** Estado del periodo (1: Pendiente, 2: En Curso, 3: Culminado) */
    periodStatus: 1 | 2 | 3;
    /** Estado lógico del registro (true: Activo, false: Inactivo/Eliminado) */
    status: boolean;
    /** Código único del periodo */
    code: string;
    /** Indica si el periodo está siendo utilizado por otros registros */
    isInUse?: boolean;
    /** Días de holgura para inscripciones */
    enrollmentGraceDays?: number;
    /** Días de holgura para evaluaciones */
    evaluationGraceDays?: number;
    /** Fecha límite extendida para inscripciones (calculada) */
    graceEndDate?: string;
    /** Fecha límite extendida para evaluaciones (calculada) */
    evaluationGraceEndDate?: string;
    /** Fechas personalizadas por tipo de pasantía */
    typeDates?: PeriodTypeDate[];
}

/**
 * Datos necesarios para crear un nuevo periodo académico.
 */
export interface CreatePeriodPayload extends Omit<Periodo, 'periodId' | 'creationDate' | 'isInUse'> {}

/**
 * Datos necesarios para actualizar un periodo académico existente.
 */
export interface UpdatePeriodPayload extends Partial<CreatePeriodPayload> {
    /** Identificador único del periodo a actualizar (requerido) */
    periodId: string;
}

/**
 * Configuración de holgura para un periodo académico.
 */
export interface GraceConfig {
    enrollmentGraceDays: number;
    evaluationGraceDays: number;
}

/**
 * Valores por defecto globales de holgura.
 */
export interface GraceDefaults {
    defaultEnrollmentGraceDays: number;
    defaultEvaluationGraceDays: number;
    lockApiLoadedFields?: boolean;
    allowMultipleVisitsPerDay: boolean;
    maxVisitsPerDay: number | null;
    enforceSequentialOrder: boolean;
    updatedAt?: string;
    updatedBy?: string;
}

/**
 * Práctica pendiente de decisión antes de cerrar un período.
 * Devuelta por GET /api/periods/:id/pending-practices.
 */
export interface PendingPractice {
    practiceId: number;
    studentName: string;
    studentCi: string;
    careerName: string;
    status: number;
    statusLabel: string;
    pendingIssue: string;
    hasEvaluations: boolean;
    evaluationCount: number;
}

/**
 * Decisión del admin para una práctica pendiente.
 */
export type ClosureDecision = 'extend' | 'enroll' | 'retiro_justificado' | 'abandono';

/**
 * Asociación práctica → decisión.
 */
export interface PracticeDecision {
    practiceId: number;
    decision: ClosureDecision;
}

/**
 * Respuesta del endpoint GET /api/periods/:id/pending-practices.
 */
export interface PendingPracticesResponse {
    pendingPractices: PendingPractice[];
    totalPractices: number;
}

/**
 * Estructura de datos para la visualización en tablas y componentes de UI.
 * Incluye campos pre-formateados y cálculos de progreso.
 */
export interface PeriodoRowData extends Omit<Periodo, 'startDate' | 'endDate' | 'creationDate'> {
    /** Fecha de inicio formateada como string legible */
    startDate: string;
    /** Fecha de fin formateada como string legible */
    endDate: string;
    /** Fecha de inicio original para ordenamiento y cálculos */
    rawStartDate: Date;
    /** Fecha de fin original para ordenamiento y cálculos */
    rawEndDate: Date;
    /** Porcentaje de progreso del periodo (0-100) o null si no ha iniciado */
    progress: number | null;
    /** Días transcurridos desde el inicio */
    daysPassed?: number;
    /** Días restantes hasta el fin */
    daysRemaining?: number;
    /** Semanas restantes hasta el fin */
    weeksRemaining?: number;
}