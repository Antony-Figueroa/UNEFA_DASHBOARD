import { dbManager } from '../lib/db-manager.js';

export interface ChangeLogEntry {
  CHANGE_LOG_ID?: number;
  DATE_TIME: Date | string;
  TABLE_ID: number;
  COLUMN_ID: number;
  OPERATION_ID: number;
  USER_ID: number;
  NEW_VALUE: string;
  OLD_VALUE: string;
  IP_ADDRESS: string;
  FORM_ID: number;
  PRINT_EMAIL: string;
  STATUS: number;
}

interface TableInfo {
  TABLE_ID: number;
  PHYSICAL_NAME: string;
}

interface ColumnInfo {
  COLUMN_ID: number;
  COLUMN_NAME: string;
  TABLE_ID: number;
}

interface OperationInfo {
  OPERATION_ID: number;
  ACTION: string;
}

class AuditService {
  private tableCache: Map<string, TableInfo> = new Map();
  private columnCache: Map<string, ColumnInfo> = new Map();
  private operationCache: Map<string, OperationInfo> = new Map();
  private cacheLoaded = false;

  /**
   * Carga caché de tablas, columnas y operaciones
   */
  private async loadCache(): Promise<void> {
    if (this.cacheLoaded) return;

    await dbManager.withRetry(async (supabase) => {
      // Cargar tablas
      const { data: tables } = await supabase
        .from('t_tables')
        .select('TABLE_ID, PHYSICAL_NAME')
        .eq('STATUS', 1)
        .eq('LOG', 1);

      if (tables) {
        for (const table of tables) {
          this.tableCache.set(table.PHYSICAL_NAME, table);
        }
      }

      // Cargar columnas
      const { data: columns } = await supabase
        .from('t_columns')
        .select('COLUMN_ID, COLUMN_NAME, TABLE_ID')
        .eq('STATUS', 1);

      if (columns) {
        for (const col of columns) {
          const key = `${col.TABLE_ID}_${col.COLUMN_NAME}`;
          this.columnCache.set(key, col);
        }
      }

      // Cargar operaciones
      const { data: operations } = await supabase
        .from('t_operation')
        .select('OPERATION_ID, ACTION')
        .eq('STATUS', 1);

      if (operations) {
        for (const op of operations) {
          this.operationCache.set(op.ACTION, op);
        }
      }

      this.cacheLoaded = true;
    });
  }

  /**
   * Obtiene el ID de una tabla por su nombre físico
   */
  private async getTableId(tableName: string): Promise<number | null> {
    await this.loadCache();
    return this.tableCache.get(tableName)?.TABLE_ID || null;
  }

  /**
   * Obtiene el ID de una columna
   */
  private async getColumnId(tableId: number, columnName: string): Promise<number | null> {
    await this.loadCache();
    const key = `${tableId}_${columnName}`;
    return this.columnCache.get(key)?.COLUMN_ID || null;
  }

  /**
   * Obtiene el ID de una operación
   */
  private async getOperationId(action: 'INSERT' | 'UPDATE' | 'DELETE'): Promise<number | null> {
    await this.loadCache();
    return this.operationCache.get(action)?.OPERATION_ID || null;
  }

  /**
   * Registra un cambio en el log de auditoría
   */
  async logChange(params: {
    tableName: string;
    columnName: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    userId: number;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    formId?: number;
  }): Promise<void> {
    try {
      const tableId = await this.getTableId(params.tableName);
      if (!tableId) {
        console.warn(`[Audit] Tabla no configurada para auditoría: ${params.tableName}`);
        return;
      }

      const columnId = await this.getColumnId(tableId, params.columnName);
      if (!columnId) {
        console.warn(`[Audit] Columna no configurada: ${params.tableName}.${params.columnName}`);
        return;
      }

      const operationId = await this.getOperationId(params.operation);
      if (!operationId) {
        console.warn(`[Audit] Operación no encontrada: ${params.operation}`);
        return;
      }

      await dbManager.withRetry(async (supabase) => {
        await supabase.from('t_change_log').insert({
          DATE_TIME: new Date().toISOString(),
          TABLE_ID: tableId,
          COLUMN_ID: columnId,
          OPERATION_ID: operationId,
          USER_ID: params.userId,
          NEW_VALUE: params.newValue || '',
          OLD_VALUE: params.oldValue || '',
          IP_ADDRESS: params.ipAddress || '',
          FORM_ID: params.formId ?? 0,
          PRINT_EMAIL: '',
          STATUS: 1
        });
      });

    } catch (error) {
      console.error('[Audit] Error registrando cambio:', error);
    }
  }

  /**
   * Registra múltiples cambios de una vez
   */
  async logChanges(params: {
    tableName: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    userId: number;
    changes: Array<{
      columnName: string;
      oldValue?: string;
      newValue?: string;
    }>;
    ipAddress?: string;
    formId?: number;
  }): Promise<void> {
    for (const change of params.changes) {
      await this.logChange({
        tableName: params.tableName,
        columnName: change.columnName,
        operation: params.operation,
        userId: params.userId,
        oldValue: change.oldValue,
        newValue: change.newValue,
        ipAddress: params.ipAddress,
        formId: params.formId
      });
    }
  }

  /**
   * Obtiene el historial de cambios
   */
  async getChangeLogs(params: {
    tableName?: string;
    userId?: number;
    operation?: 'INSERT' | 'UPDATE' | 'DELETE';
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    return await dbManager.withRetry(async (supabase) => {
      let query = supabase
        .from('t_change_log')
        .select(`
          *,
          t_tables ( NAME, PHYSICAL_NAME ),
          t_columns ( COLUMN_NAME ),
          t_operation ( ACTION ),
          t_user ( NAME, SURNAME, USER_CI )
        `, { count: 'exact' });

      if (params.userId) {
        query = query.eq('USER_ID', params.userId);
      }

      const limit = params.limit || 50;
      const offset = params.offset || 0;

      const { data, error, count } = await query
        .order('DATE_TIME', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Filtrar por tabla si se especifica
      let filteredData = data || [];
      if (params.tableName) {
        const tableId = await this.getTableId(params.tableName);
        if (tableId) {
          filteredData = filteredData.filter((item: any) => item.TABLE_ID === tableId);
        }
      }

      // Filtrar por operación si se especifica
      if (params.operation) {
        const operationId = await this.getOperationId(params.operation);
        if (operationId) {
          filteredData = filteredData.filter((item: any) => item.OPERATION_ID === operationId);
        }
      }

      return { data: filteredData, total: count || 0 };
    });
  }

  /**
   * Obtiene el historial de cambios de un registro específico
   */
  async getRecordHistory(params: {
    tableName: string;
    recordId: number;
    limit?: number;
  }): Promise<any[]> {
    return await dbManager.withRetry(async (supabase) => {
      const tableId = await this.getTableId(params.tableName);
      if (!tableId) return [];

      const { data, error } = await supabase
        .from('t_change_log')
        .select(`
          *,
          t_columns ( COLUMN_NAME ),
          t_operation ( ACTION ),
          t_user ( NAME, SURNAME, USER_CI )
        `)
        .eq('TABLE_ID', tableId)
        .eq('FORM_ID', params.recordId)
        .order('DATE_TIME', { ascending: false })
        .limit(params.limit || 100);

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Refresca el caché (llamar si se actualizan tablas/columnas)
   */
  refreshCache(): void {
    this.cacheLoaded = false;
    this.tableCache.clear();
    this.columnCache.clear();
    this.operationCache.clear();
  }
}

export const auditService = new AuditService();
