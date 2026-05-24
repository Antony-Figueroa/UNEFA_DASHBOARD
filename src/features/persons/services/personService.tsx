import apiClient from '../../../api/apiClient';
import { Persona, PersonaDTO, mapPersonaFromDTO } from '../../types/person';
import { CreatePersonPayload } from '../types';

const API_URL = '/persons';

export const personService = {
  getAll: async (page = 1, limit = 20, filters?: { status?: number; search?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status !== undefined) params.append('status', String(filters.status));
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<{ persons: PersonaDTO[]; totalCount: number; totalPages: number }>(
      `${API_URL}?${params}`
    );
    return {
      persons: response.data.persons.map(mapPersonaFromDTO),
      totalCount: response.data.totalCount,
      totalPages: response.data.totalPages,
    };
  },

  getById: async (id: number) => {
    const response = await apiClient.get<PersonaDTO>(`${API_URL}/${id}`);
    return mapPersonaFromDTO(response.data);
  },

  search: async (query: string) => {
    const response = await apiClient.get<PersonaDTO[]>(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    return response.data.map(mapPersonaFromDTO);
  },

  getByCi: async (ci: string) => {
    const response = await apiClient.get<{ data: PersonaDTO | null }>(`${API_URL}/by-ci/${encodeURIComponent(ci)}`);
    return response.data.data ? mapPersonaFromDTO(response.data.data) : null;
  },

  create: async (data: CreatePersonPayload) => {
    const response = await apiClient.post<PersonaDTO>(API_URL, data);
    return mapPersonaFromDTO(response.data);
  },

  update: async (id: number, data: Partial<CreatePersonPayload & { status: number }>) => {
    const response = await apiClient.put<PersonaDTO>(`${API_URL}/${id}`, data);
    return mapPersonaFromDTO(response.data);
  },

  toggleStatus: async (id: number) => {
    const response = await apiClient.patch<PersonaDTO>(`${API_URL}/${id}/status`);
    return mapPersonaFromDTO(response.data);
  },

  checkCiAvailability: async (ci: string, excludeId?: number) => {
    const params = new URLSearchParams({ ci });
    if (excludeId) params.append('excludeId', String(excludeId));
    const response = await apiClient.get<{ available: boolean; message: string }>(
      `${API_URL}/check-ci?${params}`
    );
    return response.data;
  },

  checkEmailAvailability: async (email: string, excludeId?: number) => {
    const params = new URLSearchParams({ email });
    if (excludeId) params.append('excludeId', String(excludeId));
    const response = await apiClient.get<{ available: boolean; message: string }>(
      `${API_URL}/check-email?${params}`
    );
    return response.data;
  },

  splitCi: (ci: string) => {
    const match = ci.match(/^([VE]?)(-?)(\d+)$/i);
    if (!match) return { prefix: 'V', number: ci };
    return { prefix: (match[1] || 'V').toUpperCase(), number: match[3] };
  },

  joinCi: (prefix: string, number: string) => `${prefix}-${number}`,
};
