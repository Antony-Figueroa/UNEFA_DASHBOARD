/**
 * @file emailTemplatesService.ts
 * @description API service for email template CRUD operations
 */

import apiClient from './apiClient';

export interface EmailTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  body_html: string;
  created_at: string;
  updated_at: string;
}

export type CreateEmailTemplate = Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>;
export type UpdateEmailTemplate = Partial<CreateEmailTemplate>;

const BASE_URL = '/email-templates';

export const emailTemplatesService = {
  /** Lista todas las plantillas */
  async getAll(): Promise<EmailTemplate[]> {
    const { data } = await apiClient.get(BASE_URL);
    return data.data;
  },

  /** Obtiene una plantilla por ID */
  async getById(id: number): Promise<EmailTemplate> {
    const { data } = await apiClient.get(`${BASE_URL}/${id}`);
    return data.data;
  },

  /** Crea una nueva plantilla */
  async create(input: CreateEmailTemplate): Promise<EmailTemplate> {
    const { data } = await apiClient.post(BASE_URL, input);
    return data.data;
  },

  /** Actualiza una plantilla existente */
  async update(id: number, input: UpdateEmailTemplate): Promise<EmailTemplate> {
    const { data } = await apiClient.put(`${BASE_URL}/${id}`, input);
    return data.data;
  },

  /** Elimina una plantilla */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },
};

export default emailTemplatesService;
