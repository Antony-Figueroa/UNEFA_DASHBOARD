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

interface SequenceInfo {
  seq_name: string;
  table_name: string;
  column_name: string;
  current_value: number;
}

interface IndexInfo {
  index_name: string;
  table_name: string;
  index_def: string;
  is_unique: boolean;
  is_primary: boolean;
}

interface ConstraintInfo {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  definition: string;
}

interface RlsPolicyInfo {
  table_name: string;
  definition: string;
}

interface FunctionInfo {
  function_name: string;
  definition: string;
}

interface TriggerInfo {
  table_name: string;
  trigger_name: string;
  definition: string;
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

  async getSequences(): Promise<SequenceInfo[]> {
    const supabaseClient = dbManager.getConnection();
    try {
      const { data, error } = await supabaseClient.rpc('get_all_sequences');
      if (error) {
        console.warn('[Backup] RPC get_all_sequences no disponible:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[Backup] Error obteniendo sequences:', error);
      return [];
    }
  }

  async getIndexes(): Promise<IndexInfo[]> {
    const supabaseClient = dbManager.getConnection();
    try {
      const { data, error } = await supabaseClient.rpc('get_all_indexes');
      if (error) {
        console.warn('[Backup] RPC get_all_indexes no disponible:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[Backup] Error obteniendo índices:', error);
      return [];
    }
  }

  async getConstraints(): Promise<ConstraintInfo[]> {
    const supabaseClient = dbManager.getConnection();
    try {
      const { data, error } = await supabaseClient.rpc('get_all_constraints');
      if (error) {
        console.warn('[Backup] RPC get_all_constraints no disponible:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[Backup] Error obteniendo constraints:', error);
      return [];
    }
  }

  async getRlsPolicies(): Promise<RlsPolicyInfo[]> {
    const supabaseClient = dbManager.getConnection();
    try {
      const { data, error } = await supabaseClient.rpc('get_rls_policies');
      if (error) {
        console.warn('[Backup] RPC get_rls_policies no disponible:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[Backup] Error obteniendo RLS policies:', error);
      return [];
    }
  }

  async getFunctions(): Promise<FunctionInfo[]> {
    const supabaseClient = dbManager.getConnection();
    try {
      const { data, error } = await supabaseClient.rpc('get_all_functions');
      if (error) {
        console.warn('[Backup] RPC get_all_functions no disponible:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[Backup] Error obteniendo funciones:', error);
      return [];
    }
  }

  async getTriggers(): Promise<TriggerInfo[]> {
    const supabaseClient = dbManager.getConnection();
    try {
      const { data, error } = await supabaseClient.rpc('get_all_triggers');
      if (error) {
        console.warn('[Backup] RPC get_all_triggers no disponible:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('[Backup] Error obteniendo triggers:', error);
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
      't_academic_config', 't_activity_logs', 't_address', 't_address_type',
      't_auth_log', 't_career', 't_career_internship_type', 't_change_log',
      't_chat_config', 't_chat_sessions', 't_columns', 't_config',
      't_coordinadores', 't_email_templates', 't_estado', 't_evaluation',
      't_evaluation_criteria', 't_evaluation_detail', 't_institution',
      't_institution_address', 't_institution_career', 't_institution_internship_type',
      't_institution_manager', 't_institution_manager_institution', 't_internship_type',
      't_internships_period', 't_key_history', 't_knowledge_base', 't_landing_config',
      't_list', 't_municipio', 't_notifications', 't_operation', 't_parroquia',
      't_password_history', 't_permissions', 't_person_address', 't_person_merge_log',
      't_persons', 't_practice_visits', 't_preset_questions',
      't_professional_practices', 't_professional_practices_tutor',
      't_practice_culmination', 't_prospect_list_items', 't_prospect_lists', 't_recovery_tokens',
      't_report_text_templates', 't_request_types', 't_roles', 't_roles_permissions',
      't_security_questions', 't_session', 't_session_attempts', 't_session_history',
      't_student_documents', 't_student_requests', 't_students', 't_system_institution',
      't_tables', 't_tutor_career', 't_tutors', 't_user', 't_user_key',
      't_user_questions', 't_user_roles', 't_user_theme', 't_value_list', 't_visit'
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
      const [sequences, indexes, constraints, rlsPolicies, functions, triggers] = await Promise.all([
        this.getSequences(),
        this.getIndexes(),
        this.getConstraints(),
        this.getRlsPolicies(),
        this.getFunctions(),
        this.getTriggers()
      ]);
      fileContent = this.generateFullSQL(
        backupName, 
        tableDefinitions, 
        sequences,
        indexes,
        constraints,
        rlsPolicies,
        functions,
        triggers,
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

    let dataToSave: any;
    if (format === 'json') {
      dataToSave = JSON.parse(fileContent);
    } else {
      dataToSave = { 
        fullSql: fileContent,
        metadata: {
          includesStructure: tableDefinitions.length > 0,
          tablesWithData,
          totalRecords,
          totalTables: allTables.length
        }
      };
    }

    const { data: backupRecord, error: insertError } = await supabaseClient
      .from('t_backups')
      .insert({
        name: backupName,
        description: description || '',
        file_name: fileName,
        size: size,
        tables: backedUpTables,
        created_by: parseInt(userId),
        data: dataToSave
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
    sequences: SequenceInfo[],
    indexes: IndexInfo[],
    constraints: ConstraintInfo[],
    rlsPolicies: RlsPolicyInfo[],
    functions: FunctionInfo[],
    triggers: TriggerInfo[],
    tablesData: Record<string, any[]>, 
    backedUpTables: string[], 
    failedTables: string[],
    totalTablesDetected: number
  ): string {
    const lines: string[] = [];
    const tablesWithData = Object.entries(tablesData).filter(([, rows]) => rows.length > 0).length;
    const totalRecords = Object.values(tablesData).reduce((sum: number, arr) => sum + arr.length, 0);
    const fkConstraints = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
    
    lines.push('-- ================================================================================');
    lines.push(`-- UNEFA Dashboard - Respaldo COMPLETO para Réplica Exacta`);
    lines.push(`-- Nombre: ${backupName}`);
    lines.push(`-- Fecha: ${new Date().toISOString()}`);
    lines.push('-- Incluye: Sequences + Funciones + CREATE TABLE + FK + Índices + Triggers + RLS + Datos');
    lines.push('-- Compatible con: Restauración en otro proyecto Supabase');
    lines.push('-- ================================================================================');
    lines.push(`-- Tablas: ${totalTablesDetected} | Con datos: ${tablesWithData}`);
    lines.push(`-- Sequences: ${sequences.length} | Índices: ${indexes.length} | FK: ${fkConstraints.length}`);
    lines.push(`-- Triggers: ${triggers.length} | RLS: ${rlsPolicies.length} | Funciones: ${functions.length}`);
    lines.push(`-- Total registros: ${totalRecords}`);
    lines.push('-- ================================================================================');
    lines.push('');

    // ============================================================
    // EXTENSIONES REQUERIDAS
    // ============================================================
    lines.push('-- Extensiones requeridas');
    lines.push('CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public SCHEMA pg_catalog;');
    lines.push('CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public SCHEMA pg_catalog;');
    lines.push('CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;');
    lines.push('');

    // ============================================================
    // SECCIÓN 1: SEQUENCES
    // ============================================================
    if (sequences.length > 0) {
      lines.push('-- ============================================================');
      lines.push('-- SECCIÓN 1: SEQUENCES');
      lines.push('-- ============================================================');
      lines.push('');

      for (const seq of sequences) {
        const seqId = `"${seq.seq_name}"`;
        lines.push(`CREATE SEQUENCE IF NOT EXISTS ${seqId} START WITH 1;`);
        lines.push(`SELECT setval(${this.formatSQLValue(seqId)}, ${seq.current_value}, true);`);
        lines.push('');
      }
    }

    // ============================================================
    // SECCIÓN 2: FUNCIONES (antes que tablas por si hay defaults)
    // ============================================================
    if (functions.length > 0) {
      lines.push('-- ============================================================');
      lines.push('-- SECCIÓN 2: FUNCIONES (RPCs)');
      lines.push('-- ============================================================');
      lines.push('');

      for (const fn of functions) {
        const def = fn.definition.replace(/^CREATE OR REPLACE FUNCTION/m, 'CREATE OR REPLACE FUNCTION');
        lines.push(def);
        lines.push('');
      }
    }

    // ============================================================
    // SECCIÓN 3: TABLAS (CREATE TABLE)
    // ============================================================
    lines.push('-- ============================================================');
    lines.push('-- SECCIÓN 3: ESTRUCTURA DE TABLAS (CREATE TABLE)');
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
      lines.push('');
    }

    // Tablas excluidas del backup de datos pero necesarias para la estructura
    lines.push('-- Tablas excluidas del backup (solo estructura)');
    lines.push('CREATE TABLE IF NOT EXISTS "t_backups" (');
    lines.push('  "id" UUID NOT NULL DEFAULT gen_random_uuid(),');
    lines.push('  "name" VARCHAR(255) NOT NULL,');
    lines.push('  "description" TEXT,');
    lines.push('  "file_name" VARCHAR(255) NOT NULL,');
    lines.push('  "size" BIGINT,');
    lines.push('  "tables" TEXT[],');
    lines.push('  "created_by" INTEGER,');
    lines.push('  "data" JSONB,');
    lines.push('  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    lines.push('  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    lines.push(');');
    lines.push('ALTER TABLE "t_backups" OWNER TO postgres;');
    lines.push('');

    // ============================================================
    // SECCIÓN 4: DATOS (INSERT)
    // ============================================================
    lines.push('-- ============================================================');
    lines.push('-- SECCIÓN 4: DATOS (INSERT)');
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

    // ============================================================
    // SECCIÓN 5: CONSTRAINTS (FK, UNIQUE, CHECK)
    // ============================================================
    if (constraints.length > 0) {
      lines.push('-- ============================================================');
      lines.push('-- SECCIÓN 5: CONSTRAINTS');
      lines.push('-- ============================================================');
      lines.push('');

      const fks = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
      const others = constraints.filter(c => c.constraint_type !== 'FOREIGN KEY');

      if (fks.length > 0) {
        lines.push('-- Foreign Keys');
        for (const c of fks) {
          lines.push(`ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" ${c.definition};`);
        }
        lines.push('');
      }

      if (others.length > 0) {
        lines.push('-- Unique / Check');
        for (const c of others) {
          lines.push(`ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" ${c.definition};`);
        }
        lines.push('');
      }
    }

    // ============================================================
    // SECCIÓN 6: ÍNDICES
    // ============================================================
    if (indexes.length > 0) {
      lines.push('-- ============================================================');
      lines.push('-- SECCIÓN 6: ÍNDICES');
      lines.push('-- ============================================================');
      lines.push('');

      for (const idx of indexes) {
        lines.push(`${idx.index_def};`);
      }
      lines.push('');
    }

    // ============================================================
    // SECCIÓN 7: TRIGGERS
    // ============================================================
    if (triggers.length > 0) {
      lines.push('-- ============================================================');
      lines.push('-- SECCIÓN 7: TRIGGERS');
      lines.push('-- ============================================================');
      lines.push('');

      for (const trg of triggers) {
        lines.push(trg.definition + ';');
      }
      lines.push('');
    }

    // ============================================================
    // SECCIÓN 8: RLS POLICIES
    // ============================================================
    if (rlsPolicies.length > 0) {
      lines.push('-- ============================================================');
      lines.push('-- SECCIÓN 8: RLS POLICIES');
      lines.push('-- ============================================================');
      lines.push('');

      // Group by table to emit ENABLE ROW LEVEL SECURITY once per table
      const tablesWithRls = [...new Set(rlsPolicies.map(p => p.table_name))].sort();
      for (const tname of tablesWithRls) {
        lines.push(`ALTER TABLE "${tname}" ENABLE ROW LEVEL SECURITY;`);
      }
      lines.push('');

      for (const policy of rlsPolicies) {
        lines.push(policy.definition);
      }
      lines.push('');
    }

    // ============================================================
    // SECCIÓN 9: TABLAS VACÍAS (referencia)
    // ============================================================
    lines.push('-- ============================================================');
    lines.push('-- SECCIÓN 9: TABLAS SIN DATOS (vacías)');
    lines.push('-- ============================================================');
    
    const emptyTables = backedUpTables.filter(t => !tablesData[t] || tablesData[t].length === 0);
    for (const tableName of emptyTables.sort()) {
      lines.push(`-- ${tableName} (0 registros)`);
    }
    lines.push('');

    // ============================================================
    // RESUMEN
    // ============================================================
    lines.push('-- ============================================================');
    lines.push('-- RESUMEN DEL RESPALDO');
    lines.push('-- ============================================================');
    lines.push(`-- Tablas: ${totalTablesDetected}`);
    lines.push(`-- Con datos: ${tablesWithData}`);
    lines.push(`-- Vacías: ${emptyTables.length}`);
    lines.push(`-- Registros: ${totalRecords}`);
    lines.push(`-- Sequences: ${sequences.length}`);
    lines.push(`-- Funciones: ${functions.length}`);
    lines.push(`-- Índices: ${indexes.length}`);
    lines.push(`-- Foreign Keys: ${fkConstraints.length}`);
    lines.push(`-- RLS Policies: ${rlsPolicies.length}`);
    lines.push(`-- Errores: ${failedTables.length}`);
    if (failedTables.length > 0) {
      lines.push(`-- Falló en: ${failedTables.slice(0, 10).join(', ')}${failedTables.length > 10 ? '...' : ''}`);
    }
    lines.push('');
    lines.push('-- ================================================================================');
    lines.push('-- FIN DEL RESPALDO — Réplica exacta lista para otro proyecto Supabase');
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
