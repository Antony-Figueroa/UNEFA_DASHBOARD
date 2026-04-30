/**
 * @file audit-helpers.ts
 * @description Helper functions for audit logging across controllers
 */

import { auditService } from '../services/audit.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

interface AuditContext {
  userId: number;
  ipAddress: string;
}

/**
 * Extracts audit context from authenticated request
 */
export const getAuditContext = (req: AuthRequest): AuditContext => {
  return {
    userId: req.user?.userId || 0,
    ipAddress: req.ip || req.socket?.remoteAddress || ''
  };
};

/**
 * Logs a record creation
 */
export const auditCreate = async (
  req: AuthRequest,
  tableName: string,
  recordData: Record<string, any>,
  columnsToLog: string[]
): Promise<void> => {
  const ctx = getAuditContext(req);
  
  const changes = columnsToLog
    .filter(col => {
      const val = recordData[col];
      // Ignorar valores undefined, null o vacíos
      return val !== undefined && val !== null && String(val).trim() !== '';
    })
    .map(col => ({
      columnName: col,
      newValue: String(recordData[col] ?? '').trim()
    }));

  if (changes.length > 0) {
    await auditService.logChanges({
      tableName,
      operation: 'INSERT',
      userId: ctx.userId,
      changes,
      ipAddress: ctx.ipAddress
    });
  }
};

/**
 * Logs a record update by comparing old and new values
 */
export const auditUpdate = async (
  req: AuthRequest,
  tableName: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  columnsToLog: string[]
): Promise<void> => {
  const ctx = getAuditContext(req);
  
  const changes = columnsToLog
    .filter(col => {
      const oldVal = oldData[col];
      const newVal = newData[col];
      // Comparar valores recortando espacios para evitar falsos positivos
      const oldTrimmed = String(oldVal ?? '').trim();
      const newTrimmed = String(newVal ?? '').trim();
      return oldTrimmed !== newTrimmed && (oldVal !== undefined || newVal !== undefined);
    })
    .map(col => ({
      columnName: col,
      oldValue: String(oldData[col] ?? '').trim(),
      newValue: String(newData[col] ?? '').trim()
    }));

  if (changes.length > 0) {
    await auditService.logChanges({
      tableName,
      operation: 'UPDATE',
      userId: ctx.userId,
      changes,
      ipAddress: ctx.ipAddress
    });
  }
};

/**
 * Logs a record deletion
 */
export const auditDelete = async (
  req: AuthRequest,
  tableName: string,
  deletedData: Record<string, any>,
  columnsToLog: string[]
): Promise<void> => {
  const ctx = getAuditContext(req);
  
  const changes = columnsToLog
    .filter(col => deletedData[col] !== undefined)
    .map(col => ({
      columnName: col,
      oldValue: String(deletedData[col] ?? '')
    }));

  if (changes.length > 0) {
    await auditService.logChanges({
      tableName,
      operation: 'DELETE',
      userId: ctx.userId,
      changes,
      ipAddress: ctx.ipAddress
    });
  }
};

/**
 * Logs a status change (soft delete/restore)
 */
export const auditStatusChange = async (
  req: AuthRequest,
  tableName: string,
  recordId: number | string,
  oldStatus: number,
  newStatus: number
): Promise<void> => {
  const ctx = getAuditContext(req);
  
  await auditService.logChange({
    tableName,
    columnName: 'STATUS',
    operation: 'UPDATE',
    userId: ctx.userId,
    oldValue: String(oldStatus),
    newValue: String(newStatus),
    ipAddress: ctx.ipAddress
  });
};
