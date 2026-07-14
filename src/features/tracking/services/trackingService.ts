/**
 * @file trackingService.ts
 * @description Servicio para la gestión de seguimientos de estudiantes.
 * Proporciona métodos para interactuar con la API de seguimiento y manejar DTOs.
 */

import { Tracking, CreateTrackingPayload, UpdateTrackingPayload } from "../types";
import apiClient from "../../../api/apiClient";

/** URL base para los endpoints de seguimiento */
const API_URL = "/tracking";

/**
 * Interface que representa la estructura de datos recibida desde la API.
 */
interface TrackingApiDTO {
    /** Identificador único del seguimiento */
    trackingId?: string;
    /** Número de cédula/identificación del estudiante */
    studentIdNumber: string;
    /** Nombre completo del estudiante */
    studentName: string;
    /** Título del reporte o actividad de seguimiento */
    reportTitle: string;
    /** Indica si hubo traslado/transferencia */
    transfer: boolean;
    /** Ruta o ubicación relacionada con el seguimiento */
    route: string;
    /** Observaciones adicionales */
    observations: string;
    /** Estado del registro */
    status: boolean;
    /** Fecha de creación (ISO string o timestamp) */
    creationDate?: string | number;
    /** Nombre de la carrera del estudiante */
    careerName?: string;
    /** Descripción del período académico */
    periodDescription?: string | null;
    /** ID del período académico */
    periodId?: number | null;
}

/**
 * Convierte un DTO de la API al modelo de dominio `Tracking`.
 * 
 * @param dto - Datos recibidos de la API.
 * @returns Objeto `Tracking` normalizado.
 */
const fromApi = (dto: TrackingApiDTO): Tracking => ({
    trackingId: dto.trackingId || "",
    studentIdNumber: dto.studentIdNumber,
    studentName: dto.studentName,
    reportTitle: dto.reportTitle,
    transfer: dto.transfer,
    route: dto.route,
    observations: dto.observations,
    status: dto.status,
    creationDate: dto.creationDate ? new Date(dto.creationDate) : new Date(),
    careerName: dto.careerName,
    periodDescription: dto.periodDescription,
    periodId: dto.periodId,
});

/**
 * Convierte un objeto parcial de `Tracking` o un payload al formato de la API.
 * 
 * @param tracking - Datos a enviar a la API.
 * @returns DTO preparado para la API.
 */
const toApi = (tracking: Partial<Tracking> | CreateTrackingPayload | UpdateTrackingPayload): Partial<TrackingApiDTO> => {
    const dto: Partial<TrackingApiDTO> = {
        studentIdNumber: tracking.studentIdNumber,
        studentName: tracking.studentName,
        reportTitle: tracking.reportTitle,
        transfer: tracking.transfer,
        route: tracking.route,
        observations: tracking.observations,
    };

    if ('status' in tracking) {
        dto.status = tracking.status;
    }

    if ('creationDate' in tracking && tracking.creationDate instanceof Date) {
        dto.creationDate = tracking.creationDate.toISOString();
    }

    if ('trackingId' in tracking) {
        dto.trackingId = tracking.trackingId;
    }

    return dto;
};

/**
 * Obtiene la lista completa de registros de seguimiento.
 * 
 * @returns Promesa con el arreglo de seguimientos.
 */
export const getTrackings = async (): Promise<Tracking[]> => {
    const response = await apiClient.get<TrackingApiDTO[]>(API_URL);
    return response.data.map(fromApi);
};

/**
 * Crea un nuevo registro de seguimiento.
 * 
 * @param tracking - Datos del nuevo seguimiento (CreateTrackingPayload).
 * @returns Promesa con el seguimiento creado.
 */
export const createTracking = async (tracking: CreateTrackingPayload): Promise<Tracking> => {
    try {
        const response = await apiClient.post<TrackingApiDTO>(API_URL, toApi(tracking));
        return fromApi(response.data);
    } catch (error) {
        console.error("[trackingService] Error al crear seguimiento:", error);
        throw error;
    }
};

/**
 * Actualiza un registro de seguimiento existente.
 * 
 * @param tracking - Datos actualizados del seguimiento (UpdateTrackingPayload).
 * @returns Promesa con el seguimiento actualizado.
 */
export const updateTracking = async (tracking: UpdateTrackingPayload): Promise<Tracking> => {
    try {
        const response = await apiClient.put<TrackingApiDTO>(`${API_URL}/${tracking.trackingId}`, toApi(tracking));
        return fromApi(response.data);
    } catch (error) {
        console.error("[trackingService] Error al actualizar seguimiento:", error);
        throw error;
    }
};

/**
 * Elimina un registro de seguimiento por su ID.
 * 
 * @param id - Identificador del seguimiento a eliminar.
 */
export const deleteTracking = async (id: string): Promise<void> => {
    try {
        await apiClient.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("[trackingService] Error al eliminar seguimiento:", error);
        throw error;
    }
};

/**
 * Restaura un registro de seguimiento previamente eliminado (borrado lógico).
 * 
 * @param id - Identificador del seguimiento a restaurar.
 */
export const restoreTracking = async (id: string): Promise<void> => {
    try {
        await apiClient.patch(`${API_URL}/${id}/restore`);
    } catch (error) {
        console.error("[trackingService] Error al restaurar seguimiento:", error);
        throw error;
    }
};

/**
 * Estructura para las estadísticas de seguimiento.
 */
export interface TrackingStats {
    /** Tendencia histórica diaria (últimos 6 meses) */
    historicalTrend: { date: string; count: number; students: { name: string; ci: string }[] }[];
    /** Comparación entre periodos específicos */
    periodComparison: { label: string; count: number }[];
}

/**
 * Tutor asignado a una práctica profesional.
 */
export interface AssignedTutor {
    tutorId: number;
    tutorName: string;
    tutorType: string;
}

/**
 * Datos completos de un seguimiento individual.
 */
export interface TrackingDetailDTO {
    trackingId: string;
    studentIdNumber: string;
    studentName: string;
    careerName: string | null;
    institutionName: string;
    tutorName: string;
    tutorMethodologicalName: string;
    assignedTutors: AssignedTutor[];
    periodDescription: string | null;
    periodStartDate: string | null;
    periodEndDate: string | null;
    reportTitle: string;
    transfer: boolean;
    route: string;
    observations: string;
    status: boolean;
    creationDate: string;
    startDate: string | null;
    endDate: string | null;
}

/**
 * Respuesta de la API para obtener un seguimiento individual.
 */
interface GetTrackingByIdResponse {
    success: boolean;
    data: TrackingDetailDTO;
}

/**
 * Obtiene las estadísticas de seguimiento para visualizaciones.
 * 
 * @returns Promesa con las estadísticas.
 */
export const getTrackingStats = async (): Promise<TrackingStats> => {
    try {
        const response = await apiClient.get<TrackingStats>(`${API_URL}/stats`);
        return response.data;
    } catch (error) {
        console.error("[trackingService] Error al obtener estadísticas de seguimiento:", error);
        throw error;
    }
};

/**
 * Obtiene los detalles de un seguimiento específico por su ID.
 * 
 * @param id - ID del seguimiento.
 * @returns Promesa con los detalles del seguimiento.
 */
export const getTrackingById = async (id: string): Promise<TrackingDetailDTO> => {
    try {
        const response = await apiClient.get<GetTrackingByIdResponse>(`${API_URL}/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("[trackingService] Error al obtener seguimiento:", error);
        throw error;
    }
};

// ── Timeline ──────────────────────────────────────────────────────────────

export interface TimelineStage {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
  date?: string | null;
  count?: number;
  icon: string;
  metadata?: { status?: string; certificateNumber?: string } | null;
}

export interface PracticeTimelineData {
  practiceId: string;
  currentStatusCode: number;
  currentStatusLabel: string;
  stages: TimelineStage[];
}

/**
 * Obtiene la línea de tiempo de una práctica profesional.
 */
export const getPracticeTimeline = async (id: string): Promise<PracticeTimelineData> => {
  const response = await apiClient.get<PracticeTimelineData>(`${API_URL}/${id}/timeline`);
  return response.data;
};

// --- CRUD Adapter ---
export const getAll = getTrackings;
export const create = createTracking;
export const update = updateTracking;
export { deleteTracking as delete };
export { restoreTracking as bulkRestore }; // Map restore to bulkRestore if needed or just export directly

