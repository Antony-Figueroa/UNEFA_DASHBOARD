/**
 * @file trackingService.ts
 * @description Servicio para la gestión de seguimientos de estudiantes.
 */

import { Tracking } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/tracking";

// DTO para la API
interface TrackingApiDTO {
    id?: string;
    studentIdNumber: string;
    studentName: string;
    reportTitle: string;
    transfer: boolean;
    route: string;
    observations: string;
    status: boolean;
    creationDate?: string | number;
}

const fromApi = (dto: TrackingApiDTO): Tracking => ({
    trackingId: dto.id || "",
    studentIdNumber: dto.studentIdNumber,
    studentName: dto.studentName,
    reportTitle: dto.reportTitle,
    transfer: dto.transfer,
    route: dto.route,
    observations: dto.observations,
    status: dto.status,
    creationDate: dto.creationDate ? new Date(dto.creationDate) : new Date(),
});

const toApi = (tracking: Partial<Tracking>): Partial<TrackingApiDTO> => {
    const dto: Partial<TrackingApiDTO> = {
        studentIdNumber: tracking.studentIdNumber,
        studentName: tracking.studentName,
        reportTitle: tracking.reportTitle,
        transfer: tracking.transfer,
        route: tracking.route,
        observations: tracking.observations,
        status: tracking.status,
        creationDate: tracking.creationDate instanceof Date 
            ? tracking.creationDate.toISOString() 
            : tracking.creationDate
    };
    if (tracking.trackingId) dto.id = tracking.trackingId;
    return dto;
};

export const getTrackings = async (): Promise<Tracking[]> => {
    try {
        const response = await apiClient.get<TrackingApiDTO[]>(API_URL);
        return response.data.map(fromApi);
    } catch (error) {
        console.error("[trackingService] Error fetching trackings:", error);
        // Fallback for demo if API fails
        return [];
    }
};

export const createTracking = async (tracking: Omit<Tracking, "trackingId" | "creationDate">): Promise<Tracking> => {
    const response = await apiClient.post<TrackingApiDTO>(API_URL, toApi(tracking));
    return fromApi(response.data);
};

export const updateTracking = async (tracking: Tracking): Promise<Tracking> => {
    const response = await apiClient.put<TrackingApiDTO>(`${API_URL}/${tracking.trackingId}`, toApi(tracking));
    return fromApi(response.data);
};

export const deleteTracking = async (id: string): Promise<void> => {
    await apiClient.delete(`${API_URL}/${id}`);
};
