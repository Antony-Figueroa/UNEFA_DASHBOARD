import apiClient from '../../../api/apiClient';

export interface BackupRecord {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  size: number;
  tables: string[];
  createdBy: string;
  createdAt: string;
}

export interface CreateBackupRequest {
  name?: string;
  description?: string;
}

export const backupService = {
  getBackups: async (): Promise<BackupRecord[]> => {
    const response = await apiClient.get<{ backups: BackupRecord[] }>('/backups');
    return response.data.backups;
  },

  createBackup: async (data: CreateBackupRequest): Promise<BackupRecord> => {
    const response = await apiClient.post<{ backup: BackupRecord }>('/backups', data);
    return response.data.backup;
  },

  downloadBackup: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/backups/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteBackup: async (id: string): Promise<void> => {
    await apiClient.delete(`/backups/${id}`);
  },
};
