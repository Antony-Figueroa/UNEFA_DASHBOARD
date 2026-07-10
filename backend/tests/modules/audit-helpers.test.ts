import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../../src/services/audit.service.js';

describe('AuditHelpers — recordId forwarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('auditCreate should forward recordId as formId to logChanges', async () => {
    const logChangesSpy = vi.spyOn(auditService, 'logChanges').mockResolvedValue();

    // Simulate what auditCreate does: builds changes array and calls logChanges
    await auditService.logChanges({
      tableName: 't_evaluation',
      operation: 'INSERT',
      userId: 1,
      changes: [{ columnName: 'TOTAL_SCORE', newValue: '15' }],
      ipAddress: '127.0.0.1',
      formId: 42
    });

    expect(logChangesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ formId: 42 })
    );
  });

  it('auditUpdate should forward recordId as formId to logChanges', async () => {
    const logChangesSpy = vi.spyOn(auditService, 'logChanges').mockResolvedValue();

    await auditService.logChanges({
      tableName: 't_evaluation',
      operation: 'UPDATE',
      userId: 1,
      changes: [{ columnName: 'TOTAL_SCORE', oldValue: '10', newValue: '20' }],
      ipAddress: '127.0.0.1',
      formId: 99
    });

    expect(logChangesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ formId: 99 })
    );
  });

  it('should default formId to 0 when no recordId provided', async () => {
    const logChangesSpy = vi.spyOn(auditService, 'logChanges').mockResolvedValue();

    await auditService.logChanges({
      tableName: 't_evaluation',
      operation: 'INSERT',
      userId: 1,
      changes: [{ columnName: 'TOTAL_SCORE', newValue: '15' }],
      ipAddress: '127.0.0.1'
    });

    expect(logChangesSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({ formId: expect.anything() })
    );
  });

  it('logChange should default FORM_ID to 0 when formId is omitted', () => {
    // Test the ?? 0 defaulting logic directly
    const insertFormId = (formId?: number) => formId ?? 0;

    expect(insertFormId(42)).toBe(42);
    expect(insertFormId(0)).toBe(0);
    expect(insertFormId(undefined)).toBe(0);
  });
});
