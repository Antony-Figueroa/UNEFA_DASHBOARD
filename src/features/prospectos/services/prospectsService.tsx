import apiClient from "../../../api/apiClient";
import { ProspectList, ProspectListItem, EligibleStudent, CreateProspectListPayload, UpdateProspectListPayload, AddListItemPayload } from "../types";

const API_URL = "/prospects";

/** Unwrap backend envelope: { success, data, message } → data */
const unwrap = <T,>(response: { data: { success?: boolean; data?: T; message?: string } }): T => {
  return response.data?.data ?? response.data as unknown as T;
};

export const prospectsService = {
  getLists: async (): Promise<ProspectList[]> => {
    const response = await apiClient.get(`${API_URL}/lists`);
    return unwrap<ProspectList[]>(response);
  },

  getListById: async (id: number): Promise<ProspectList> => {
    const response = await apiClient.get(`${API_URL}/lists/${id}`);
    return unwrap<ProspectList>(response);
  },

  createList: async (data: CreateProspectListPayload): Promise<ProspectList> => {
    const response = await apiClient.post(`${API_URL}/lists`, data);
    return unwrap<ProspectList>(response);
  },

  updateList: async (id: number, data: UpdateProspectListPayload): Promise<ProspectList> => {
    const response = await apiClient.put(`${API_URL}/lists/${id}`, data);
    return unwrap<ProspectList>(response);
  },

  deleteList: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_URL}/lists/${id}`);
  },

  getListItems: async (id: number): Promise<ProspectListItem[]> => {
    const response = await apiClient.get(`${API_URL}/lists/${id}/items`);
    return unwrap<ProspectListItem[]>(response);
  },

  addListItem: async (listId: number, data: AddListItemPayload): Promise<ProspectListItem> => {
    const response = await apiClient.post(`${API_URL}/lists/${listId}/items`, data);
    return unwrap<ProspectListItem>(response);
  },

  bulkAddListItems: async (listId: number, studentIds: number[], addedBy?: number): Promise<{ addedCount: number }> => {
    const response = await apiClient.post(`${API_URL}/lists/${listId}/items/bulk`, { studentIds, addedBy });
    return unwrap<{ addedCount: number }>(response);
  },

  removeListItem: async (listId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`${API_URL}/lists/${listId}/items/${itemId}`);
  },

  toggleEnrolled: async (listId: number, itemId: number): Promise<ProspectListItem> => {
    const response = await apiClient.patch(`${API_URL}/lists/${listId}/items/${itemId}`);
    return unwrap<ProspectListItem>(response);
  },

  getEligibleStudents: async (params?: { search?: string; careerId?: number; periodId?: number; page?: number; limit?: number }): Promise<{ data: EligibleStudent[]; total: number }> => {
    const response = await apiClient.get(`${API_URL}/eligible-students`, { params });
    const body = response.data;
    // Backend returns { success, data: [], meta: { total } }
    const students: EligibleStudent[] = body?.data ?? [];
    const total: number = body?.meta?.total ?? students.length;
    return { data: students, total };
  },
};
