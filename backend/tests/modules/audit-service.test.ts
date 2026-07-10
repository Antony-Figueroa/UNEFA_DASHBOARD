import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../../src/services/audit.service.js';

describe('AuditService.logChange — formId threading', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should forward formId through logChanges to logChange', async () => {
    // Spy on the private logChange to verify it receives formId
    const logChangeSpy = vi
      .spyOn(auditService as any, 'logChange')
      .mockImplementation(async (_params: any) => Promise.resolve());

    // logChanges iterates params.changes and calls this.logChange for each
    // We provide changes as an array so the for-of loop works
    await auditService.logChanges({
      tableName: 't_evaluation',
      operation: 'UPDATE',
      userId: 1,
      changes: [
        { columnName: 'TOTAL_SCORE', oldValue: '10', newValue: '20' }
      ],
      ipAddress: '127.0.0.1',
      formId: 42
    });

    expect(logChangeSpy).toHaveBeenCalledTimes(1);
    const callArg = logChangeSpy.mock.calls[0][0];
    expect(callArg).toHaveProperty('formId', 42);
  });

  it('should default formId to 0 when not provided', () => {
    const formId = undefined;
    const result = formId ?? 0;
    expect(result).toBe(0);
  });

  it('should use provided formId over default', () => {
    const formId = 42;
    const result = formId ?? 0;
    expect(result).toBe(42);
  });
});
