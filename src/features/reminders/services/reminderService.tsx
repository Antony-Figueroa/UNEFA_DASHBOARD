import apiClient from '../../../api/apiClient';
import { ReminderRule } from '../types';

const BASE_URL = '/api/reminder-config';

export const reminderService = {
  getAll: async (): Promise<ReminderRule[]> => {
    const { data } = await apiClient.get(BASE_URL);
    return data.data;
  },

  create: async (rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReminderRule[]> => {
    const { data } = await apiClient.post(BASE_URL, rule);
    return data.data;
  },

  update: async (id: string, updates: Partial<ReminderRule>): Promise<ReminderRule[]> => {
    const { data } = await apiClient.put(`${BASE_URL}/${id}`, updates);
    return data.data;
  },

  toggle: async (id: string): Promise<ReminderRule[]> => {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}/toggle`);
    return data.data;
  },

  remove: async (id: string): Promise<ReminderRule[]> => {
    const { data } = await apiClient.delete(`${BASE_URL}/${id}`);
    return data.data;
  },
};
