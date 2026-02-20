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
  format: 'json' | 'sql';
  data?: any;
}

class BackupService {
  private readonly TABLES_TO_BACKUP = [
    't_activity_log',
    't_activity_logs',
    't_auth_log',
    't_backups',
    't_career',
    't_career_internship_type',
    't_change_log',
    't_chat_sessions',
    't_columns',
    't_config',
    't_evaluation',
    't_evaluation_criteria',
    't_evaluation_detail',
    't_institution',
    't_institution_career',
    't_institution_internship_type',
    't_institution_manager',
    't_internships_period',
    't_internship_type',
    't_key_history',
    't_list',
    't_notifications',
    't_operation',
    't_password_history',
    't_permissions',
    't_preset_questions',
    't_practice_visits',
    't_professional_practices',
    't_professional_practices_tutor',
    't_recovery_tokens',
    't_request_types',
    't_roles',
    't_roles_permissions',
    't_security_questions',
    't_session',
    't_session_attempts',
    't_session_history',
    't_student_documents',
    't_student_requests',
    't_students',
    't_tables',
    't_tutor_career',
    't_tutors',
    't_user',
    't_user_key',
    't_user_questions',
    't_user_roles',
    't_user_theme',
    't_value_list',
    't_visit'
  ];

  async createBackup(userId: string, name?: string, description?: string, format: 'json' | 'sql' = 'sql'): Promise<BackupRecord> {
    const supabaseClient = dbManager.getConnection();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    
    const tablesData: Record<string, any[]> = {};
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

        if (data && data.length > 0) {
          tablesData[tableName] = data;
        }
        backedUpTables.push(tableName);
      } catch (error) {
        console.warn(`[Backup] Error procesando ${tableName}:`, error);
        failedTables.push(tableName);
      }
    }

    let fileContent: string;
    let fileName: string;

    if (format === 'sql') {
      fileContent = this.generateSQL(backupName, tablesData, backedUpTables, failedTables);
      fileName = `${backupName}.sql`;
    } else {
      const jsonData = {
        metadata: {
          name: backupName,
          description: description || '',
          createdAt: new Date().toISOString(),
          createdBy: userId,
          version: '3.0',
          format: 'json',
          totalTables: this.TABLES_TO_BACKUP.length,
          successfulTables: backedUpTables.length,
          failedTables
        },
        tables: tablesData
      };
      fileContent = JSON.stringify(jsonData, null, 2);
      fileName = `${backupName}.json`;
    }

    const size = Buffer.byteLength(fileContent, 'utf8');

    const { data: backupRecord, error: insertError } = await supabaseClient
      .from('t_backups')
      .insert({
        name: backupName,
        description: description || '',
        file_name: fileName,
        size: size,
        tables: backedUpTables,
        created_by: parseInt(userId),
        data: format === 'json' ? JSON.parse(fileContent) : { sql: fileContent.substring(0, 10000) }
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
      createdAt: new Date(backupRecord.created_at),
      format
    };
  }

  private generateSQL(backupName: string, tablesData: Record<string, any[]>, backedUpTables: string[], failedTables: string[]): string {
    const lines: string[] = [];
    
    lines.push('-- ================================================================================');
    lines.push(`-- UNEFA Dashboard - Respaldo de Base de Datos`);
    lines.push(`-- Nombre: ${backupName}`);
    lines.push(`-- Fecha: ${new Date().toISOString()}`);
    lines.push(`-- Tablas respaldadas: ${backedUpTables.length}/${this.TABLES_TO_BACKUP.length}`);
    lines.push('-- ================================================================================');
    lines.push('');
    lines.push('BEGIN;');
    lines.push('');

    for (const [tableName, rows] of Object.entries(tablesData)) {
      if (rows.length === 0) continue;

      lines.push(`-- --------------------------------------------------------`);
      lines.push(`-- Tabla: ${tableName} (${rows.length} registros)`);
      lines.push(`-- --------------------------------------------------------`);

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => this.formatSQLValue(row[col]));
        
        lines.push(`INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')});`);
      }
      lines.push('');
    }

    lines.push('-- --------------------------------------------------------');
    lines.push('-- Resumen del respaldo');
    lines.push('-- --------------------------------------------------------');
    lines.push(`-- Tablas exitosas: ${backedUpTables.length}`);
    lines.push(`-- Tablas fallidas: ${failedTables.length}`);
    if (failedTables.length > 0) {
      lines.push(`-- Fallidas: ${failedTables.join(', ')}`);
    }
    lines.push('');
    lines.push('COMMIT;');
    lines.push('-- ================================================================================');

    return lines.join('\n');
  }

  private formatSQLValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
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
      createdAt: new Date(record.created_at),
      format: record.file_name?.endsWith('.sql') ? 'sql' : 'json'
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
      format: data.file_name?.endsWith('.sql') ? 'sql' : 'json',
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
