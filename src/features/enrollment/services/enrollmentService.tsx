/**
 * @file enrollmentService.tsx
 * @description Service for managing student enrollments via the API.
 * Handles CRUD operations and data normalization.
 */

import { Enrollment, CreateEnrollmentPayload, UpdateEnrollmentPayload } from "../types";
import apiClient from "../../../api/apiClient";

const API_URL = "/enrollments";

/**
 * Normalizes an enrollment object from the API response.
 * Converts string dates to Date objects.
 * 
 * @param data - The raw enrollment data from the API.
 * @returns The normalized Enrollment object.
 */
const mapToEnrollment = (data: any): Enrollment => ({
  ...data,
  enrollmentDate: new Date(data.enrollmentDate),
});

/**
 * Retrieves the complete list of enrollments.
 * 
 * @returns A promise with an array of normalized enrollments.
 */
export const getEnrollments = async (): Promise<Enrollment[]> => {
  const response = await apiClient.get<any[]>(API_URL);
  return response.data.map(mapToEnrollment);
};

/**
 * Creates a new enrollment record.
 * 
 * @param payload - The enrollment data to create.
 * @returns A promise with the newly created normalized enrollment.
 */
export const createEnrollment = async (payload: CreateEnrollmentPayload): Promise<Enrollment> => {
  const response = await apiClient.post<any>(API_URL, payload);
  return mapToEnrollment(response.data);
};

/**
 * Updates an existing enrollment record.
 * 
 * @param payload - The enrollment data to update (must include enrollmentId).
 * @returns A promise with the updated normalized enrollment.
 */
export const updateEnrollment = async (payload: UpdateEnrollmentPayload): Promise<Enrollment> => {
  const { enrollmentId, ...updates } = payload;
  const response = await apiClient.put<any>(`${API_URL}/${enrollmentId}`, updates);
  return mapToEnrollment(response.data);
};

/**
 * Withdraws (retira/abandona) a practice with a given type and justification.
 *
 * @param practiceId - The practice ID.
 * @param withdrawalType - 'justified' for retiro justificado, 'unjustified' for abandono.
 * @param justificationReason - Required reason (min 10 chars for justified).
 * @returns A promise that resolves when the operation is complete.
 */
export const withdrawPractice = async (
  practiceId: string,
  withdrawalType: 'justified' | 'unjustified',
  justificationReason: string,
  withdrawComment?: string,
): Promise<void> => {
  await apiClient.patch(`${API_URL}/${practiceId}/withdraw`, {
    withdrawalType,
    justificationReason,
    withdrawComment,
  });
};

/**
 * Deletes (soft-deactivates) an enrollment record by its ID.
 * 
 * @param id - The unique identifier of the enrollment.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteEnrollment = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

// --- CRUD Adapter ---
export const getAll = getEnrollments;
export const create = createEnrollment;
export const update = updateEnrollment;
export { deleteEnrollment as delete };

