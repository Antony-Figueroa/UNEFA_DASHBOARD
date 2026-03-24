/**
 * @file audit.controller.ts
 * @description Controller for audit logs - provides endpoints to list and filter audit entries
 */

import { Request, Response } from 'express';
import { auditService } from '../services/audit.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

interface AuditLogEntry {
  CHANGE_LOG_ID: number;
  DATE_TIME: string;
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
  // Joined fields
  t_tables?: {
    NAME: string;
    PHYSICAL_NAME: string;
  };
  t_columns?: {
    COLUMN_NAME: string;
  };
  t_operation?: {
    ACTION: string;
  };
  t_user?: {
    NAME: string;
    SURNAME: string;
    USER_CI: string;
  };
}

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      tableName,
      userId,
      operation,
      startDate,
      endDate,
      limit = '50',
      offset = '0'
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit as string) || 50, 200);
    const parsedOffset = parseInt(offset as string) || 0;

    const result = await auditService.getChangeLogs({
      tableName: tableName as string | undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      operation: operation as 'INSERT' | 'UPDATE' | 'DELETE' | undefined,
      limit: parsedLimit,
      offset: parsedOffset
    });

    // Filter by date range in memory (since DATE_TIME filtering in Supabase is complex)
    let filteredData = result.data;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate as string) : new Date(0);
      const end = endDate ? new Date(endDate as string) : new Date(Date.now());
      
      filteredData = filteredData.filter((entry: AuditLogEntry) => {
        const entryDate = new Date(entry.DATE_TIME);
        return entryDate >= start && entryDate <= end;
      });
    }

    // Format response
    const formattedData = filteredData.map((entry: AuditLogEntry) => ({
      id: entry.CHANGE_LOG_ID,
      dateTime: entry.DATE_TIME,
      tableName: entry.t_tables?.PHYSICAL_NAME || '',
      tableLabel: entry.t_tables?.NAME || '',
      columnName: entry.t_columns?.COLUMN_NAME || '',
      operation: entry.t_operation?.ACTION || '',
      userId: entry.USER_ID,
      userName: entry.t_user ? `${entry.t_user.NAME} ${entry.t_user.SURNAME}`.trim() : '',
      userCi: entry.t_user?.USER_CI || '',
      oldValue: entry.OLD_VALUE,
      newValue: entry.NEW_VALUE,
      ipAddress: entry.IP_ADDRESS,
      recordId: entry.FORM_ID
    }));

    res.json({
      success: true,
      data: formattedData,
      meta: {
        total: result.total,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error) {
    console.error('[Audit] Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría'
    });
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = (await import('../lib/db-manager.js')).dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_change_log')
      .select(`
        *,
        t_tables ( NAME, PHYSICAL_NAME ),
        t_columns ( COLUMN_NAME ),
        t_operation ( ACTION ),
        t_user ( NAME, SURNAME, USER_CI )
      `)
      .eq('CHANGE_LOG_ID', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Log de auditoría no encontrado'
      });
    }

    const entry = data as AuditLogEntry;
    res.json({
      success: true,
      data: {
        id: entry.CHANGE_LOG_ID,
        dateTime: entry.DATE_TIME,
        tableName: entry.t_tables?.PHYSICAL_NAME || '',
        tableLabel: entry.t_tables?.NAME || '',
        columnName: entry.t_columns?.COLUMN_NAME || '',
        operation: entry.t_operation?.ACTION || '',
        userId: entry.USER_ID,
        userName: entry.t_user ? `${entry.t_user.NAME} ${entry.t_user.SURNAME}`.trim() : '',
        userCi: entry.t_user?.USER_CI || '',
        oldValue: entry.OLD_VALUE,
        newValue: entry.NEW_VALUE,
        ipAddress: entry.IP_ADDRESS,
        recordId: entry.FORM_ID
      }
    });
  } catch (error) {
    console.error('[Audit] Error getting audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener log de auditoría'
    });
  }
};

export const getRecordHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { tableName, recordId } = req.params;
    const { limit = '100' } = req.query;

    if (!tableName || !recordId) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos: tableName y recordId'
      });
    }

    const result = await auditService.getRecordHistory({
      tableName,
      recordId: parseInt(recordId),
      limit: parseInt(limit as string) || 100
    });

    const formattedData = result.map((entry: any) => ({
      id: entry.CHANGE_LOG_ID,
      dateTime: entry.DATE_TIME,
      columnName: entry.t_columns?.COLUMN_NAME || '',
      operation: entry.t_operation?.ACTION || '',
      userName: entry.t_user ? `${entry.t_user.NAME} ${entry.t_user.SURNAME}`.trim() : '',
      userCi: entry.t_user?.USER_CI || '',
      oldValue: entry.OLD_VALUE,
      newValue: entry.NEW_VALUE,
      ipAddress: entry.IP_ADDRESS
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('[Audit] Error getting record history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial del registro'
    });
  }
};

export const getAuditTables = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = (await import('../lib/db-manager.js')).dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_tables')
      .select('TABLE_ID, NAME, PHYSICAL_NAME')
      .eq('STATUS', 1)
      .eq('LOG', 1)
      .order('NAME');

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('[Audit] Error getting tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tablas auditadas'
    });
  }
};

export const getAuditStats = async (req: AuthRequest, res: Response) => {
  try {
    const { days = '7' } = req.query;
    const daysNum = parseInt(days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const supabase = (await import('../lib/db-manager.js')).dbManager.getConnection();

    // Get operation counts
    const { data: operations } = await supabase
      .from('t_change_log')
      .select('OPERATION_ID')
      .gte('DATE_TIME', startDate.toISOString());

    const operationCounts = {
      INSERT: 0,
      UPDATE: 0,
      DELETE: 0
    };

    // Get operation IDs
    const { data: opData } = await supabase
      .from('t_operation')
      .select('OPERATION_ID, ACTION')
      .eq('STATUS', 1);

    const opMap = new Map((opData || []).map((op: any) => [op.OPERATION_ID, op.ACTION]));

    (operations || []).forEach((entry: any) => {
      const action = opMap.get(entry.OPERATION_ID);
      if (action && operationCounts.hasOwnProperty(action)) {
        operationCounts[action as keyof typeof operationCounts]++;
      }
    });

    // Get top users
    const { data: topUsers } = await supabase
      .from('t_change_log')
      .select(`
        USER_ID,
        t_user ( NAME, SURNAME )
      `)
      .gte('DATE_TIME', startDate.toISOString())
      .order('DATE_TIME', { ascending: false })
      .limit(10);

    const userActivity = new Map();
    (topUsers || []).forEach((entry: any) => {
      const userName = entry.t_user ? `${entry.t_user.NAME} ${entry.t_user.SURNOME || ''}`.trim() : 'Unknown';
      userActivity.set(userName, (userActivity.get(userName) || 0) + 1);
    });

    // Get top tables
    const { data: tableCounts } = await supabase
      .from('t_change_log')
      .select('TABLE_ID')
      .gte('DATE_TIME', startDate.toISOString());

    const tableActivity = new Map();
    const { data: tables } = await supabase
      .from('t_tables')
      .select('TABLE_ID, NAME');

    const tableMap = new Map((tables || []).map((t: any) => [t.TABLE_ID, t.NAME]));

    (tableCounts || []).forEach((entry: any) => {
      const tableName = tableMap.get(entry.TABLE_ID) || 'Unknown';
      tableActivity.set(tableName, (tableActivity.get(tableName) || 0) + 1);
    });

    res.json({
      success: true,
      data: {
        operations: operationCounts,
        topUsers: Array.from(userActivity.entries()).map(([name, count]) => ({ name, count })),
        topTables: Array.from(tableActivity.entries()).map(([name, count]) => ({ name, count })),
        totalChanges: (operations || []).length,
        period: daysNum
      }
    });
  } catch (error) {
    console.error('[Audit] Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de auditoría'
    });
  }
};
