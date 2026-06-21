import apiClient from '../../../api/apiClient';
import type { PreviewResponse, ExecutePayload, ExecuteResponse } from '../types';

export const bulkImportService = {
  downloadTemplate: async (type: 'students' | 'enrollments'): Promise<void> => {
    const response = await apiClient.get(`/bulk-import/template/${type}`, {
      responseType: 'blob'
    });
    // ponytail: direct DOM download, no lib needed
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plantilla-${type}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  previewImport: async (file: File): Promise<PreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/bulk-import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  executeImport: async (payload: ExecutePayload): Promise<ExecuteResponse> => {
    const response = await apiClient.post('/bulk-import/execute', payload);
    return response.data;
  }
};
