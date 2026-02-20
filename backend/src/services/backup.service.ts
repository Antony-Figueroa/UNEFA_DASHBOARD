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

interface TableDefinition {
  table_name: string;
  definition: string;
  has_data: boolean;
}

class BackupService {
  private readonly EXCLUDED_TABLES = ['t_backups'];

  async getTableDefinitions(): Promise<TableDefinition[]> {
    const supabaseClient = dbManager.getConnection();
    
    try {
      const { data, error } = await supabaseClient.rpc('get_all_table_definitions');
      
      if (error) {
        console.warn('[Backup] RPC get_all_table_definitions no disponible:', error.message);
        return [];
      }
      
      return (data || []).filter((row: TableDefinition) => !this.EXCLUDED_TABLES.includes(row.table_name));
    } catch (error) {
      console.warn('[Backup] Error obteniendo definiciones:', error);
      return [];
    }
  }

  async getAllTables(): Promise<string[]> {
    const supabaseClient = dbManager.getConnection();
    
    try {
      const { data, error } = await supabaseClient.rpc('get_all_tables');
      
      if (error) {
        console.warn('[Backup] RPC get_all_tables no disponible, usando lista por defecto');
        return this.getDefaultTables();
      }
      
      return (data || [])
        .map((row: any) => row.table_name || row)
        .filter((name: string) => Boolean(name) && !this.EXCLUDED_TABLES.includes(name));
    } catch (error) {
      console.warn('[Backup] Error obteniendo tablas:', error);
      return this.getDefaultTables();
    }
  }

  private getDefaultTables(): string[] {
    return [
      't_activity_log', 't_activity_logs', 't_auth_log', 't_career',
      't_career_internship_type', 't_change_log', 't_chat_sessions', 't_columns',
      't_config', 't_evaluation', 't_evaluation_criteria', 't_evaluation_detail',
      't_institution', 't_institution_career', 't_institution_internship_type',
      't_institution_manager', 't_internship_type', 't_internships_period',
      't_key_history', 't_list', 't_notifications', 't_operation',
      't_password_history', 't_permissions', 't_preset_questions', 't_practice_visits',
      't_professional_practices', 't_professional_practices_tutor', 't_recovery_tokens',
      't_request_types', 't_roles', 't_roles_permissions', 't_security_questions',
      't_session', 't_session_attempts', 't_session_history', 't_student_documents',
      't_student_requests', 't_students', 't_tables', 't_tutor_career', 't_tutors',
      't_user', 't_user_key', 't_user_questions', 't_user_roles', 't_user_theme',
      't_value_list', 't_visit'
    ];
  }

  async createBackup(userId: string, name?: string, description?: string, format: 'json' | 'sql' = 'sql'): Promise<BackupRecord> {
    const supabaseClient = dbManager.getConnection();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    
    const tableDefinitions = await this.getTableDefinitions();
    const allTables = tableDefinitions.length > 0 
      ? tableDefinitions.map(t => t.table_name)
      : await this.getAllTables();
    
    const totalTablesDetected = allTables.length;
    
    const tablesData: Record<string, any[]> = {};
    const backedUpTables: string[] = [];
    const failedTables: string[] = [];

    const batchSize = 10;
    for (let i = 0; i < allTables.length; i += batchSize) {
      const batch = allTables.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (tableName) => {
          try {
            const { data, error } = await supabaseClient
              .from(tableName)
              .select('*')
              .limit(10000);

            if (error) {
              return { tableName, success: false, error: error.message };
            }

            return { tableName, success: true, data: data || [] };
          } catch (error: any) {
            return { tableName, success: false, error: error?.message };
          }
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { tableName, success, data } = result.value as any;
          if (success) {
            tablesData[tableName] = data || [];
            backedUpTables.push(tableName);
          } else {
            failedTables.push(tableName);
          }
        }
      }
    }

    let fileContent: string;
    let fileName: string;
    const tablesWithData = Object.entries(tablesData).filter(([, rows]) => rows.length > 0).length;
    const totalRecords = Object.values(tablesData).reduce((sum: number, arr) => sum + arr.length, 0);

    if (format === 'sql') {
      fileContent = this.generateFullSQL(
        backupName, 
        tableDefinitions, 
        tablesData, 
        backedUpTables, 
        failedTables, 
        totalTablesDetected
      );
      fileName = `${backupName}.sql`;
    } else {
      const jsonData = {
        metadata: {
          name: backupName,
          description: description || '',
          createdAt: new Date().toISOString(),
          createdBy: userId,
          version: '5.0',
          format: 'json',
          includesStructure: tableDefinitions.length > 0,
          totalTablesDetected,
          tablesConsulted: backedUpTables.length,
          tablesWithData,
          totalRecords,
          failedTables
        },
        structure: tableDefinitions.length > 0 ? tableDefinitions : undefined,
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
        data: { 
          sqlPreview: fileContent.substring(0, 5000),
          includesStructure: tableDefinitions.length > 0,
          tablesWithData,
          totalRecords,
          allTablesList: allTables
        }
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

  private generateFullSQL(
    backupName: string, 
    tableDefinitions: TableDefinition[],
    tablesData: Record<string, any[]>, 
    backedUpTables: string[], 
    failedTables: string[],
    totalTablesDetected: number
  ): string {
    const lines: string[] = [];
    const tablesWithData = Object.entries(tablesData).filter(([, rows]) => rows.length > 0).length;
    const totalRecords = Object.values(tablesData).reduce((sum: number, arr) => sum + arr.length, 0);
    
    lines.push('-- ================================================================================');
    lines.push(`-- UNEFA Dashboard - Respaldo COMPLETO de Base de Datos`);
    lines.push(`-- Nombre: ${backupName}`);
    lines.push(`-- Fecha: ${new Date().toISOString()}`);
    lines.push(`-- Incluye: Estructura (CREATE TABLE) + Datos (INSERT)`);
    lines.push('-- ================================================================================');
    lines.push(`-- Tablas detectadas: ${totalTablesDetected}`);
    lines.push(`-- Tablas con datos: ${tablesWithData}`);
    lines.push(`-- Tablas vacías: ${totalTablesDetected - tablesWithData}`);
    lines.push(`-- Total de registros: ${totalRecords}`);
    lines.push('-- ================================================================================');
    lines.push('');
    lines.push('-- Desactivar verificación de foreign keys temporalmente');
    lines.push('SET session_replication_role = replica;');
    lines.push('');

    // Sección 1: Estructura de tablas
    lines.push('-- ============================================================');
    lines.push('-- SECCIÓN 1: ESTRUCTURA DE TABLAS (CREATE TABLE)');
    lines.push('-- ============================================================');
    lines.push('');

    if (tableDefinitions.length > 0) {
      for (const tableDef of tableDefinitions) {
        lines.push(`-- Tabla: ${tableDef.table_name}`);
        lines.push(tableDef.definition);
        lines.push('');
      }
    } else {
      lines.push('-- Nota: Las definiciones de estructura no están disponibles.');
      lines.push('-- Ejecute la migración create_table_definitions_function.sql');
      lines.push('');
    }

    // Sección 2: Datos
    lines.push('-- ============================================================');
    lines.push('-- SECCIÓN 2: DATOS (INSERT)');
    lines.push('-- ============================================================');
    lines.push('');

    const sortedTables = Object.entries(tablesData)
      .filter(([, rows]) => rows.length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [tableName, rows] of sortedTables) {
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

    // Sección 3: Tablas vacías (referencia)
    lines.push('-- ============================================================');
    lines.push('-- SECCIÓN 3: TABLAS SIN DATOS (vacías)');
    lines.push('-- ============================================================');
    
    const emptyTables = backedUpTables.filter(t => !tablesData[t] || tablesData[t].length === 0);
    for (const tableName of emptyTables.sort()) {
      lines.push(`-- ${tableName} (0 registros)`);
    }
    lines.push('');

    // Resumen final
    lines.push('-- ============================================================');
    lines.push('-- RESUMEN DEL RESPALDO');
    lines.push('-- ============================================================');
    lines.push(`-- Total de tablas: ${totalTablesDetected}`);
    lines.push(`-- Tablas con datos: ${tablesWithData}`);
    lines.push(`-- Tablas vacías: ${emptyTables.length}`);
    lines.push(`-- Total de registros: ${totalRecords}`);
    lines.push(`-- Tablas con error: ${failedTables.length}`);
    if (failedTables.length > 0) {
      lines.push(`-- Errores en: ${failedTables.slice(0, 10).join(', ')}${failedTables.length > 10 ? '...' : ''}`);
    }
    lines.push('');
    lines.push('-- Reactivar verificación de foreign keys');
    lines.push('SET session_replication_role = DEFAULT;');
    lines.push('-- ================================================================================');
    lines.push('-- FIN DEL RESPALDO');
    lines.push('-- ================================================================================');

    return lines.join('\n');
  }

  private formatSQLValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  async getBackups(): Promise<BackupRecord[]> {
    const supabaseClient = dbManager.getConnection();
    const { data, error } = await supabaseClient
      .from('t_backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error al obtener backups: ${error.message}`);

    return (data || []).map((record: any) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      fileName: record.file_name,
      size: record.size,
      tables: record.tables,
      createdBy: record.created_by,
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

    if (error || !data) return null;

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

    if (error) throw new Error(`Error al eliminar backup: ${error.message}`);
  }
}

export const backupService = new BackupService();
