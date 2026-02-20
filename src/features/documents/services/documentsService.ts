import apiClient from '../../../api/apiClient';

export interface Document {
  id: number;
  type: string;
  title: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  fileType: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
}

export interface DocumentType {
  value: string;
  label: string;
}

const API_URL = '/documents';

export const documentsService = {
  getAll: async (): Promise<Document[]> => {
    const response = await apiClient.get(API_URL);
    return response.data.data;
  },

  getTypes: async (): Promise<DocumentType[]> => {
    const response = await apiClient.get(`${API_URL}/types`);
    return response.data.data;
  },

  upload: async (data: { 
    documentType: string; 
    title: string; 
    description?: string;
    file: File 
  }): Promise<{ id: number }> => {
    const formData = new FormData();
    formData.append('documentType', data.documentType);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('file', data.file);

    const response = await apiClient.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_URL}/${id}`);
  }
};

export default documentsService;
