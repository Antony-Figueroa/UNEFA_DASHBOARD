import apiClient from '../../../api/apiClient';
import type { PendingWithdrawal, BatchActionPayload, BatchActionResult } from '../types';

const API_URL = '/justified-withdrawal';

/**
 * Obtiene la lista de retiros justificados pendientes.
 */
export const getPendingWithdrawals = async (): Promise<PendingWithdrawal[]> => {
  const response = await apiClient.get<{ success: boolean; data: PendingWithdrawal[] }>(
    `${API_URL}/pending`
  );
  return response.data.data;
};

/**
 * Extiende un retiro justificado.
 * @param practiceId - ID de la práctica
 * @param newEndDate - Nueva fecha de finalización (ISO string)
 * @param reason - Motivo de la extensión
 */
export const extendWithdrawal = async (
  practiceId: number,
  newEndDate: string,
  reason: string
): Promise<void> => {
  await apiClient.post(`${API_URL}/${practiceId}/extend`, { newEndDate, reason });
};

/**
 * Marca un retiro justificado como reprobado.
 * @param practiceId - ID de la práctica
 * @param reason - Motivo de la reprobación
 */
export const reprobarWithdrawal = async (
  practiceId: number,
  reason: string
): Promise<void> => {
  await apiClient.post(`${API_URL}/${practiceId}/reprobar`, { reason });
};

/**
 * Acción en lote: extiende o reprueba múltiples retiros justificados.
 */
export const batchWithdrawalAction = async (
  payload: BatchActionPayload
): Promise<BatchActionResult> => {
  const response = await apiClient.post<{ success: boolean; data: BatchActionResult }>(
    `${API_URL}/batch`,
    payload
  );
  return response.data.data;
};
