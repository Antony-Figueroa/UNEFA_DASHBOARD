import apiClient from '../../../api/apiClient';
import {
  Evaluation,
  EvaluationWithDetails,
  EvaluationCriteria,
  EvaluationStatus,
  CreateEvaluationPayload,
  UpdateEvaluationPayload,
  EvaluatorType,
  CommitteeAssignment,
  PendingPracticesReport
} from '../types';

const API_URL = '/evaluations';

export interface AuditEntry {
  auditId: number;
  professionalPracticeId: number;
  evaluationId?: number;
  action: string;
  user: string;
  userId?: number;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

interface ApiEvaluation {
  evaluationId: number;
  professionalPracticeId: number;
  evaluatorType: EvaluatorType;
  comiteMemberIndex?: number;
  evaluatorId?: number;
  evaluatorName: string;
  evaluatorCi?: string;
  totalScore: number;
  observations?: string;
  evaluationDate: string;
  registeredBy: number;
  weight: number;
  items?: {
    detailId: number;
    criteriaId: number;
    itemNumber: number;
    score: number;
  }[];
}

const fromApi = (data: ApiEvaluation): Evaluation => ({
  evaluationId: data.evaluationId,
  professionalPracticeId: data.professionalPracticeId,
  evaluatorType: data.evaluatorType,
  comiteMemberIndex: data.comiteMemberIndex,
  evaluatorId: data.evaluatorId,
  evaluatorName: data.evaluatorName,
  evaluatorCi: data.evaluatorCi,
  totalScore: data.totalScore,
  observations: data.observations,
  evaluationDate: data.evaluationDate,
  registeredBy: data.registeredBy,
  weight: data.weight
});

const fromApiWithDetails = (data: ApiEvaluation): EvaluationWithDetails => ({
  ...fromApi(data),
  items: data.items || []
});

export const evaluationService = {
  createCriteria: async (data: { description: string; evaluatorType: string }): Promise<EvaluationCriteria> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: EvaluationCriteria }>(`${API_URL}/criteria`, data);
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error creating criteria:', error);
      throw error;
    }
  },

  deleteCriteria: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${API_URL}/criteria/${id}`);
    } catch (error) {
      console.error('[evaluationService] Error deleting criteria:', error);
      throw error;
    }
  },

  updateCriteria: async (criteria: { criteriaId: number; description: string }[]): Promise<void> => {
    try {
      await apiClient.put(`${API_URL}/criteria`, { criteria });
    } catch (error) {
      console.error('[evaluationService] Error updating criteria:', error);
      throw error;
    }
  },

  getCriteria: async (type?: EvaluatorType): Promise<EvaluationCriteria[]> => {
    try {
      const params = type ? { type } : {};
      const response = await apiClient.get<{ success: boolean; data: EvaluationCriteria[] }>(
        `${API_URL}/criteria`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('[evaluationService] Error getting criteria:', error);
      throw error;
    }
  },

  getEvaluations: async (practiceId?: number): Promise<Evaluation[]> => {
    try {
      const params = practiceId ? { practiceId } : {};
      const response = await apiClient.get<{ success: boolean; data: ApiEvaluation[] }>(
        API_URL,
        { params }
      );
      return (response.data.data || []).map(fromApi);
    } catch (error) {
      console.error('[evaluationService] Error getting evaluations:', error);
      throw error;
    }
  },

  getEvaluationById: async (id: number): Promise<EvaluationWithDetails> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: ApiEvaluation }>(
        `${API_URL}/${id}`
      );
      return fromApiWithDetails(response.data.data);
    } catch (error) {
      console.error('[evaluationService] Error getting evaluation:', error);
      throw error;
    }
  },

  createEvaluation: async (payload: CreateEvaluationPayload): Promise<{ evaluationId: number; totalScore: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: { evaluationId: number; totalScore: number } }>(
        API_URL,
        payload
      );
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error creating evaluation:', error);
      throw error;
    }
  },

  updateEvaluation: async (id: number, payload: UpdateEvaluationPayload): Promise<void> => {
    try {
      await apiClient.put(`${API_URL}/${id}`, payload);
    } catch (error) {
      console.error('[evaluationService] Error updating evaluation:', error);
      throw error;
    }
  },

  deleteEvaluation: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error('[evaluationService] Error deleting evaluation:', error);
      throw error;
    }
  },

  getPracticeTutorInfo: async (practiceId: number, type: string): Promise<{ name: string; ci: string } | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { name: string; ci: string } | null }>(
        `${API_URL}/practice/${practiceId}/tutor-info`,
        { params: { type } }
      );
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error getting practice tutor info:', error);
      return null;
    }
  },

  getPracticeEvaluationStatus: async (practiceId: number): Promise<EvaluationStatus> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: EvaluationStatus }>(
        `${API_URL}/practice/${practiceId}/status`
      );
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error getting evaluation status:', error);
      throw error;
    }
  },

  getBatchPracticeStatus: async (practiceIds: number[]): Promise<Record<number, EvaluationStatus>> => {
    try {
      const ids = practiceIds.join(',');
      const response = await apiClient.get<{ success: boolean; data: Record<number, EvaluationStatus> }>(
        `${API_URL}/batch-status`,
        { params: { ids } }
      );
      return response.data.data || {};
    } catch (error) {
      console.error('[evaluationService] Error getting batch status:', error);
      throw error;
    }
  },

  freezeBatch: async (practiceIds: number[]): Promise<{ frozenCount: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: { frozenCount: number }; message?: string }>(
        `${API_URL}/freeze`,
        { practiceIds }
      );
      return response.data.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al congelar evaluaciones';
      console.error('[evaluationService] Error freezing evaluations:', msg);
      throw new Error(msg);
    }
  },

  unfreeze: async (evaluationId: number, reason: string): Promise<void> => {
    try {
      await apiClient.post(`${API_URL}/${evaluationId}/unfreeze`, { reason });
    } catch (error) {
      console.error('[evaluationService] Error unfreezing evaluation:', error);
      throw error;
    }
  },

  unfreezePractice: async (practiceId: number, reason: string): Promise<void> => {
    try {
      await apiClient.post(`${API_URL}/unfreeze-practice`, { practiceId, reason });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al descongelar evaluaciones';
      console.error('[evaluationService] Error unfreezing practice:', msg);
      throw new Error(msg);
    }
  },

  grantExtension: async (practiceId: number, reason: string): Promise<void> => {
    await apiClient.post(`${API_URL}/${practiceId}/grant-extension`, { reason });
  },

  bulkGrantExtension: async (data: { practiceIds: (number | string)[]; reason: string }): Promise<{ grantedCount: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: { grantedCount: number } }>(
        `${API_URL}/bulk-grant-extension`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error bulk granting extension:', error);
      throw error;
    }
  },

  revokeExtension: async (practiceId: number, reason: string): Promise<void> => {
    await apiClient.post(`${API_URL}/${practiceId}/revoke-extension`, { reason });
  },

  getPendingPracticesReport: async (periodId: number): Promise<PendingPracticesReport> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: PendingPracticesReport }>(
        `${API_URL}/pending-report/${periodId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error getting pending practices report:', error);
      throw error;
    }
  },

  /**
   * Marca una práctica como reprobada
   * POST /evaluations/:practiceId/mark-failed
   */
  markFailed: async (practiceId: number): Promise<void> => {
    try {
      await apiClient.post(`${API_URL}/${practiceId}/mark-failed`);
    } catch (error) {
      console.error('[evaluationService] Error marking practice as failed:', error);
      throw error;
    }
  },

  getCommitteeAssignments: async (practiceId: number): Promise<CommitteeAssignment[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: CommitteeAssignment[] }>(
        `/committee-assignments/${practiceId}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('[evaluationService] Error getting committee assignments:', error);
      throw error;
    }
  },

  upsertCommitteeAssignments: async (
    practiceId: number,
    members: { memberIndex: number; evaluatorName: string; evaluatorCi?: string }[]
  ): Promise<void> => {
    try {
      await apiClient.post('/committee-assignments', { practiceId, members });
    } catch (error) {
      console.error('[evaluationService] Error upserting committee assignments:', error);
      throw error;
    }
  },

  exportEvaluationsExcel: async (periodId: number | string): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/evaluations/export/${periodId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('[evaluationService] Error exporting evaluations:', error);
      throw error;
    }
  },

  getAuditHistory: async (practiceId: number | string): Promise<AuditEntry[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: AuditEntry[] }>(
        `/evaluations/audit/${practiceId}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('[evaluationService] Error getting audit history:', error);
      throw error;
    }
  },

  /**
   * Get detailed practice evaluation status including per-type completion info.
   * Used to determine whether to show the completion/freeze dialog after a save.
   */
  getDetailedPracticeStatus: async (practiceId: number) => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          practiceId: string;
          evaluationStatus: 'pending' | 'partial' | 'completed';
          evaluations: Record<string, {
            completed: boolean;
            score: number;
            evaluatorName: string;
            evaluationId?: number;
            members?: Array<{
              memberIndex: number;
              score: number;
              evaluatorName: string;
              evaluationId: number;
            }>;
            completedCount?: string;
          }>;
          finalGrade: string;
          completedCount: number;
          canEvaluate: boolean;
          periodMessage: string;
        }
      }>(`${API_URL}/practice/${practiceId}/status`);
      return response.data.data;
    } catch (error) {
      console.error('[evaluationService] Error getting detailed practice status:', error);
      throw error;
    }
  },

};

export default evaluationService;
