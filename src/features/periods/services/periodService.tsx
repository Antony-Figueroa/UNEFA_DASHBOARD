/**
 * @file Servicio para la gestión de periodos académicos (API).
 * @description Encapsula la lógica de comunicación con la API para las operaciones CRUD.
 */

import { Periodo, CreatePeriodPayload, UpdatePeriodPayload, GraceDefaults, PeriodTypeDate, PendingPracticesResponse, PracticeDecision } from "../types";
import apiClient from "../../../api/apiClient";

/**
 * URL base para el recurso de periodos.
 */
const API_URL = "/periodos";

// --- API Data Transformation ---

/**
 * DTO (Data Transfer Object) que representa la estructura del periodo en la API.
 * Incluye múltiples variantes de nombres para asegurar compatibilidad.
 */
interface PeriodoApiDTO {
  periodId?: string;
  PERIOD_ID?: string | number;
  id?: string;
  ID?: string;
  _id?: string;
  startDate?: number | string;
  fechaInicio?: number | string;
  start_date?: number | string;
  START_DATE?: number | string;
  endDate?: number | string;
  fechaFin?: number | string;
  end_date?: number | string;
  END_DATE?: number | string;
  creationDate?: number | string;
  createdAt?: number | string;
  fechaCreacion?: number | string;
  description?: string;
  DESCRIPTION?: string;
  nombre?: string;
  name?: string;
  title?: string;
  periodo?: string;
  periodStatus?: number | string;
  PERIOD_STATUS?: number | string;
  estadoPeriodo?: number | string;
  period_status?: number | string;
  status?: boolean | number;
  STATUS?: boolean | number;
  activo?: boolean | number;
  enabled?: boolean | number;
  T_INTERNSHIPS_CODE?: string;
  code?: string;
  codigo?: string;
  isInUse?: boolean | number;
  IS_IN_USE?: boolean | number;
  is_in_use?: boolean | number;
  enrollmentGraceDays?: number;
  ENROLLMENT_GRACE_DAYS?: number;
  evaluationGraceDays?: number;
  EVALUATION_GRACE_DAYS?: number;
  graceEndDate?: string;
  GRACE_END_DATE?: string;
  evaluationGraceEndDate?: string;
  EVALUATION_GRACE_END_DATE?: string;
  typeDates?: Array<{
    id?: number;
    periodId?: number;
    internshipTypeId?: number;
    startDate?: string | null;
    endDate?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  [key: string]: unknown;
}

/**
 * Parsea un valor de fecha (string o timestamp) a un objeto Date.
 * Maneja formatos ISO y timestamps.
 * 
 * @param value - Valor a parsear.
 * @returns Objeto Date (puede ser inválido si el input es incorrecto).
 */
const parseDate = (value: number | string | undefined): Date => {
  if (!value) {
    // Retornar una fecha inválida para que la UI lo detecte
    return new Date("Invalid Date"); 
  }
  
  if (typeof value === "number") {
    // Unix timestamp en ms o segundos
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }

  // Manejo especial para fechas YYYY-MM-DD para evitar desplazamiento de zona horaria
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      // Crear fecha local a mediodía para evitar problemas de bordes de zona horaria
      return new Date(year, month - 1, day, 12, 0, 0);
  }
  
  return new Date(value);
};

/**
 * Mapea un DTO de la API al modelo de dominio Periodo.
 * 
 * @param dto - Objeto proveniente de la API.
 * @returns Objeto de tipo Periodo.
 */
const fromApi = (dto: PeriodoApiDTO): Periodo => {
  const periodId = dto.PERIOD_ID ?? dto.periodId ?? dto.id ?? dto.ID ?? dto._id ?? "";
  const description = dto.DESCRIPTION ?? dto.description ?? dto.nombre ?? dto.name ?? dto.title ?? dto.periodo ?? "";
  const startDateRaw = dto.START_DATE ?? dto.startDate ?? dto.fechaInicio ?? dto.start_date;
  const endDateRaw = dto.END_DATE ?? dto.endDate ?? dto.fechaFin ?? dto.end_date;
  const creationDateRaw = dto.creationDate ?? dto.createdAt ?? dto.fechaCreacion ?? Date.now();
  const periodStatusRaw = dto.PERIOD_STATUS ?? dto.periodStatus ?? dto.estadoPeriodo ?? dto.period_status ?? 1;
  const statusRaw = dto.STATUS ?? dto.status ?? dto.activo ?? dto.enabled ?? true;
  const code = dto.T_INTERNSHIPS_CODE ?? dto.code ?? dto.codigo ?? "";
  const isInUseRaw = dto.isInUse ?? dto.IS_IN_USE ?? dto.is_in_use ?? false;
  const enrollmentGraceDaysRaw = dto.enrollmentGraceDays ?? dto.ENROLLMENT_GRACE_DAYS ?? 0;
  const evaluationGraceDaysRaw = dto.evaluationGraceDays ?? dto.EVALUATION_GRACE_DAYS ?? 0;
  const graceEndDateRaw = dto.graceEndDate ?? dto.GRACE_END_DATE;
  const evaluationGraceEndDateRaw = dto.evaluationGraceEndDate ?? dto.EVALUATION_GRACE_END_DATE;
  const typeDatesRaw = dto.typeDates;

  return {
    periodId: String(periodId),
    description: String(description),
    startDate: parseDate(startDateRaw as number | string),
    endDate: parseDate(endDateRaw as number | string),
    creationDate: parseDate(creationDateRaw as number | string),
    periodStatus: (Number(periodStatusRaw) || 1) as 1 | 2 | 3,
    status: typeof statusRaw === 'number' ? statusRaw === 1 : !!statusRaw,
    code: String(code),
    isInUse: typeof isInUseRaw === 'number' ? isInUseRaw === 1 : !!isInUseRaw,
    enrollmentGraceDays: Number(enrollmentGraceDaysRaw),
    evaluationGraceDays: Number(evaluationGraceDaysRaw),
    graceEndDate: graceEndDateRaw ? String(graceEndDateRaw) : undefined,
    evaluationGraceEndDate: evaluationGraceEndDateRaw ? String(evaluationGraceEndDateRaw) : undefined,
    typeDates: typeDatesRaw ? (Array.isArray(typeDatesRaw) ? (typeDatesRaw as PeriodTypeDate[]) : undefined) : undefined,
  };
};

/**
 * Mapea el modelo de dominio o payloads al formato esperado por la API.
 * 
 * @param periodo - Datos del periodo a enviar.
 * @returns DTO parcial para la API.
 */
const toApi = (periodo: Partial<Periodo>): Partial<PeriodoApiDTO> => {
  const dto: Partial<PeriodoApiDTO> = {};
  if (periodo.description) dto.description = periodo.description;
  if (periodo.startDate) dto.startDate = Math.floor(periodo.startDate.getTime() / 1000);
  if (periodo.endDate) dto.endDate = Math.floor(periodo.endDate.getTime() / 1000);
  if (periodo.periodStatus) dto.periodStatus = periodo.periodStatus;
  if (typeof periodo.status === 'boolean') dto.status = periodo.status;
  if (periodo.periodId) dto.id = periodo.periodId; 
  if (periodo.code) dto.code = periodo.code;
  if (periodo.enrollmentGraceDays !== undefined) dto.enrollmentGraceDays = periodo.enrollmentGraceDays;
  if (periodo.evaluationGraceDays !== undefined) dto.evaluationGraceDays = periodo.evaluationGraceDays;
  return dto;
};

// ponytail: cache simple para evitar N fetches cuando usePeriods se usa en header + sidebar
let _periodsCache: Periodo[] | null = null;
let _periodsPromise: Promise<Periodo[]> | null = null;

/**
 * Obtiene todos los periodos académicos con cache de 30s.
 * 
 * @returns Promesa con la lista de periodos.
 */
export const getPeriods = async (): Promise<Periodo[]> => {
  if (_periodsCache) return _periodsCache;
  if (_periodsPromise) return _periodsPromise;

  _periodsPromise = (async () => {
    try {
      const response = await apiClient.get<PeriodoApiDTO[]>(API_URL);
      _periodsCache = response.data.map(fromApi);
      setTimeout(() => { _periodsCache = null; _periodsPromise = null; }, 30000);
      return _periodsCache;
    } catch (error) {
      _periodsPromise = null; // reset para reintentar en next fetch
      console.error(`[periodService] Error al obtener periodos:`, error);
      throw error;
    }
  })();

  return _periodsPromise;
};

// ponytail: invalidar cache tras mutaciones para que refresh() traiga datos frescos
const invalidateCache = () => { _periodsCache = null; _periodsPromise = null; };

/**
 * Crea un nuevo periodo académico.
 * 
 * @param payload - Datos del nuevo periodo.
 * @returns Promesa con el periodo creado.
 */
export const createPeriod = async (payload: CreatePeriodPayload): Promise<Periodo> => {
  invalidateCache();
  try {
    const response = await apiClient.post<PeriodoApiDTO>(API_URL, toApi(payload));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error al crear periodo:`, error);
    throw error;
  }
};

/**
 * Actualiza un periodo académico existente.
 * 
 * @param payload - Datos actualizados del periodo.
 * @returns Promesa con el periodo actualizado.
 */
export const updatePeriod = async (payload: UpdatePeriodPayload): Promise<Periodo> => {
  invalidateCache();
  if (!payload.periodId) throw new Error("ID de periodo requerido para actualizar");
  try {
    const response = await apiClient.put<PeriodoApiDTO>(`${API_URL}/${payload.periodId}`, toApi(payload));
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error al actualizar periodo:`, error);
    throw error;
  }
};

/**
 * Elimina (físicamente) un periodo académico.
 * 
 * @param id - Identificador del periodo a eliminar.
 */
export const deletePeriod = async (id: string): Promise<void> => {
  invalidateCache();
  try {
    await apiClient.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`[periodService] Error al eliminar periodo:`, error);
    throw error;
  }
};

/**
 * Cambia el estado (activo/inactivo) de un periodo académico.
 * 
 * @param id - Identificador del periodo.
 * @param status - Nuevo estado.
 */
export const toggleStatus = async (id: string | number, status: boolean): Promise<void> => {
  invalidateCache();
  try {
    await apiClient.patch(`${API_URL}/${id}/toggle-status`, { status });
  } catch (error) {
    console.error(`[periodService] Error al cambiar estado de periodo:`, error);
    throw error;
  }
};

/**
 * Realiza la eliminación masiva de periodos.
 * 
 * @param ids - Arreglo de identificadores.
 */
export const bulkDelete = async (ids: (string | number)[]): Promise<void> => {
  invalidateCache();
  try {
    await apiClient.post(`${API_URL}/bulk-delete`, { ids });
  } catch (error) {
    console.error(`[periodService] Error en eliminación masiva de periodos:`, error);
    throw error;
  }
};

/**
 * Realiza la restauración masiva de periodos.
 * 
 * @param ids - Arreglo de identificadores.
 */
export const bulkRestore = async (ids: (string | number)[]): Promise<void> => {
  invalidateCache();
  try {
    await apiClient.post(`${API_URL}/bulk-restore`, { ids });
  } catch (error) {
    console.error(`[periodService] Error en restauración masiva de periodos:`, error);
    throw error;
  }
};

/**
 * Actualiza la configuración de holgura de un periodo.
 *
 * @param id - Identificador del periodo.
 * @param data - Días de holgura para inscripciones y evaluaciones.
 * @returns Promesa con el periodo actualizado.
 */
export const updateGraceConfig = async (
  id: string,
  data: { enrollmentGraceDays: number; evaluationGraceDays: number }
): Promise<Periodo> => {
  try {
    const response = await apiClient.patch<PeriodoApiDTO>(`${API_URL}/${id}/grace-config`, data);
    return fromApi(response.data);
  } catch (error) {
    console.error(`[periodService] Error al actualizar configuración de holgura:`, error);
    throw error;
  }
};

/**
 * Obtiene los valores por defecto globales de holgura.
 *
 * @returns Promesa con los valores por defecto.
 */
export const getGraceDefaults = async (): Promise<GraceDefaults> => {
  try {
    const response = await apiClient.get<GraceDefaults>("/academic-config/defaults");
    return response.data;
  } catch (error) {
    console.error(`[periodService] Error al obtener valores por defecto de holgura:`, error);
    throw error;
  }
};

/**
 * Actualiza los valores por defecto globales de holgura.
 *
 * @param data - Nuevos valores por defecto.
 * @returns Promesa con los valores actualizados.
 */
export const updateGraceDefaults = async (
  data: { defaultEnrollmentGraceDays?: number; defaultEvaluationGraceDays?: number; lockApiLoadedFields?: boolean; allowMultipleVisitsPerDay?: boolean; maxVisitsPerDay?: number | null }
): Promise<GraceDefaults> => {
  try {
    const response = await apiClient.patch<GraceDefaults>("/academic-config/defaults", data);
    return response.data;
  } catch (error) {
    console.error(`[periodService] Error al actualizar valores por defecto de holgura:`, error);
    throw error;
  }
};

/**
 * Obtiene las prácticas pendientes de decisión para el cierre de un período.
 *
 * @param periodId - Identificador del período.
 * @returns Respuesta con la lista de prácticas pendientes.
 */
export const getPendingPractices = async (periodId: string): Promise<PendingPracticesResponse> => {
  try {
    const response = await apiClient.get<PendingPracticesResponse>(`${API_URL}/${periodId}/pending-practices`);
    return response.data;
  } catch (error) {
    console.error(`[periodService] Error al obtener prácticas pendientes:`, error);
    throw error;
  }
};

/**
 * Cierra un período aplicando las decisiones del admin para cada práctica pendiente.
 *
 * @param periodId - Identificador del período a cerrar.
 * @param decisions - Arreglo de decisiones (practiceId + decision).
 * @returns Respuesta del cierre con resumen de decisiones aplicadas.
 */
export const closePeriodWithDecisions = async (
  periodId: string,
  decisions?: PracticeDecision[]
): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
  invalidateCache();
  try {
    const response = await apiClient.post<{ success: boolean; message: string; data: Record<string, unknown> }>(
      `${API_URL}/${periodId}/close`,
      { decisions }
    );
    return response.data;
  } catch (error) {
    console.error(`[periodService] Error al cerrar período con decisiones:`, error);
    throw error;
  }
};

// --- CRUD Adapter ---
export const getAll = getPeriods;
export const create = createPeriod;
export const update = updatePeriod;
export { deletePeriod as delete };

// --- Pre-enrollment Timeout (D-03) ---

export interface TimeoutPreviewPractice {
  practiceId: number;
  studentName: string;
  studentCi: string;
  careerName: string;
  createdAt: string;
  daysSinceCreation: number;
}

export interface TimeoutPreviewResult {
  wouldCancel: number;
  practices: TimeoutPreviewPractice[];
}

export interface TimeoutCheckResult {
  cancelled: number;
  practices: TimeoutPreviewPractice[];
  /** Mensaje descriptivo del backend (opcional) */
  message?: string;
}

/**
 * Preview which PRE_INSCRITO practices would be auto-cancelled by timeout (read-only).
 */
export const getTimeoutPreview = async (timeoutDays: number = 30): Promise<TimeoutPreviewResult> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: TimeoutPreviewResult }>('/periodos/timeout-preview', {
      params: { timeoutDays },
    });
    return response.data.data;
  } catch (error) {
    console.error('[periodService] Error fetching timeout preview:', error);
    throw error;
  }
};

/**
 * Execute timeout check: cancel stale PRE_INSCRITO practices.
 */
export const executeTimeoutCheck = async (timeoutDays: number = 30): Promise<TimeoutCheckResult> => {
  try {
    const response = await apiClient.post<{ success: boolean; message?: string; data: TimeoutCheckResult }>('/periodos/check-timeouts', { timeoutDays });
    const result = response.data.data;
    // The backend message sits at the envelope level
    if (response.data.message && !result.message) {
      result.message = response.data.message;
    }
    return result;
  } catch (error) {
    console.error('[periodService] Error executing timeout check:', error);
    throw error;
  }
};