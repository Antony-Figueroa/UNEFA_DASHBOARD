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
    't_user_key',
    't_user_roles',
    't_user_questions',
    't_roles',
    't_roles_permissions',
    't_permissions',
    't_config',
    't_list',
    't_value_list',
    't_preset_questions',
    't_security_questions',
    't_career',
    't_career_internship_type',
    't_internship_type',
    't_internships_period',
    't_students',
    't_tutors',
    't_tutor_career',
    't_institution',
    't_institution_career',
    't_institution_internship_type',
    't_institution_manager',
    't_professional_practices',
    't_professional_practices_tutor',
    't_visit',
    't_activity_logs',
    't_evaluation',
    't_evaluation_criteria',
    't_evaluation_detail',
    't_request_types',
    't_student_requests',
    't_recovery_tokens',
    't_auth_log',
    't_session',
    't_session_attempts',
    't_session_history',
    't_key_history',
    't_password_history',
    't_chat_sessions',
    't_notifications',
    't_documents'
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
        version: '2.0'
      },
      tables: {}
    };

    const backedUpTables: string[] = [];
    const failedTables: string[] = [];

    for (const tableName of this.TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('*');

        if (error) {
          console.warn(`[Backup] Tabla ${tableName} no disponible:`, error.message);
          failedTables.push(tableName);
          continue;
        }

        backupData.tables[tableName] = data || [];
        backedUpTables.push(tableName);
      } catch (error) {
        console.warn(`[Backup] Error procesando ${tableName}:`, error);
        failedTables.push(tableName);
      }
    }

    backupData.metadata.totalTables = this.TABLES_TO_BACKUP.length;
    backupData.metadata.successfulTables = backedUpTables.length;
    backupData.metadata.failedTables = failedTables;

    const jsonData = JSON.stringify(backupData, null, 2);
    const size = Buffer.byteLength(jsonData, 'utf8');

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
