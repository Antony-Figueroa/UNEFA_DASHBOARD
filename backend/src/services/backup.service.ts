import { dbManager } from '../lib/db-manager.js';

export interface BackupRecord {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  size: number;
  tables: string[];
  createdBy: number;
  createdAt: Date;
  data?: any;
}

class BackupService {
  private readonly TABLES_TO_BACKUP = [
    't_user',
    't_career',
    't_institution',
    't_internships_period',
    't_students',
    't_tutors',
    't_enrollment',
    't_tracking',
    't_evaluation',
    't_list',
    't_roles',
    't_config',
    't_notification',
    't_chat_session',
    't_visit',
    't_internship_type',
    't_professional_practice'
  ];

  async createBackup(userId: string, name?: string, description?: string): Promise<BackupRecord> {
    const supabaseClient = dbManager.getConnection();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    const fileName = `${backupName}.json`;

    const backupData: any = {
      metadata: {
        name: backupName,
        description: description || '',
        createdAt: new Date().toISOString(),
        createdBy: userId,
        version: '1.0'
      },
      tables: {}
    };

    const backedUpTables: string[] = [];

    // Exportar cada tabla
    for (const tableName of this.TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('*');

        if (error) {
          console.warn(`Error al exportar tabla ${tableName}:`, error);
          continue;
        }

        backupData.tables[tableName] = data || [];
        backedUpTables.push(tableName);
      } catch (error) {
        console.warn(`Error al procesar tabla ${tableName}:`, error);
      }
    }

    // Calcular tamaño
    const jsonData = JSON.stringify(backupData, null, 2);
    const size = Buffer.byteLength(jsonData, 'utf8');

    // Guardar en la tabla de backups
    const { data: backupRecord, error: insertError } = await supabaseClient
      .from('t_backups')
      .insert({
        name: backupName,
        description: description || '',
        file_name: fileName,
        size: size,
        tables: backedUpTables,
        created_by: parseInt(userId),
        data: backupData
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al guardar el backup: ${insertError.message}`);
    }

    return {
      id: backupRecord.id,
      name: backupRecord.name,
      description: backupRecord.description,
      fileName: backupRecord.file_name,
      size: backupRecord.size,
      tables: backupRecord.tables,
      createdBy: backupRecord.created_by,
      createdAt: new Date(backupRecord.created_at)
    };
  }

  async getBackups(): Promise<BackupRecord[]> {
    const supabaseClient = dbManager.getConnection();

    const { data, error } = await supabaseClient
      .from('t_backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener backups: ${error.message}`);
    }

    return (data || []).map((record: any) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      fileName: record.file_name,
      size: record.size,
      tables: record.tables,
      createdBy: parseInt(record.created_by),
      createdAt: new Date(record.created_at)
    }));
  }

  async getBackupById(id: string): Promise<BackupRecord | null> {
    const supabaseClient = dbManager.getConnection();

    const { data, error } = await supabaseClient
      .from('t_backups')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      fileName: data.file_name,
      size: data.size,
      tables: data.tables,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      data: data.data
    };
  }

  async deleteBackup(id: string): Promise<void> {
    const supabaseClient = dbManager.getConnection();

    const { error } = await supabaseClient
      .from('t_backups')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar backup: ${error.message}`);
    }
  }
}

export const backupService = new BackupService();
