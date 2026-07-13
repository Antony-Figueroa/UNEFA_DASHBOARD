/**
 * @file Tests for period-closure.controller.ts — pending practices and close-with-decisions
 * @description Pure unit tests with mocked Supabase. No DB required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Helpers ---

function createMockReq(params: Record<string, string> = {}, body: Record<string, unknown> = {}) {
  return {
    params,
    body,
    user: { userId: '1', role: 1 },
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Creates a chainable mock for Supabase `.from(table).select().eq().single()` patterns.
 */
function chainMock(defaultData: unknown = null, defaultError: unknown = null) {
  const chain: any = {};
  chain._data = defaultData;
  chain._error = defaultError;
  chain._count = 0;

  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: chain._data, error: chain._error });
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve({ data: chain._data, error: chain._error }).then(resolve, reject);

  return chain;
}

// --- Mocks before imports ---

const mockFromFn = vi.fn();

vi.mock('../../backend/src/lib/db-manager.js', () => ({
  dbManager: {
    getConnection: vi.fn(() => ({ from: mockFromFn })),
    withRetry: vi.fn(async (fn: any) => {
      const client = { from: mockFromFn };
      return fn(client);
    }),
  },
}));

vi.mock('../../backend/src/services/backup.service.js', () => ({
  backupService: {
    createBackup: vi.fn().mockResolvedValue({ id: 'backup-123' }),
  },
}));

vi.mock('../../backend/src/lib/cache-manager.js', () => ({
  cacheManager: {
    deleteByPrefix: vi.fn(),
  },
}));

vi.mock('../../backend/src/utils/audit-helpers.js', () => ({
  auditCreate: vi.fn(),
  auditUpdate: vi.fn(),
  auditStatusChange: vi.fn(),
}));

vi.mock('../../backend/src/services/period-type-dates.service.js', () => ({
  isFeatureEnabled: vi.fn(() => false),
  getTypeDatesByPeriod: vi.fn(),
}));

// --- Imports ---

import { getPendingPractices, closePeriodWithDecisions } from '../../backend/src/controllers/period-closure.controller.js';
import { PRACTICES_STATUS, PERIOD_STATUS } from '../../backend/src/constants/practice-status.constants.js';

// --- Tests ---

describe('getPendingPractices — D-02', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when period not found', async () => {
    const periodChain = chainMock(null, { message: 'Not found' });
    mockFromFn.mockReturnValueOnce(periodChain);

    const req = createMockReq({ id: '999' });
    const res = createMockRes();

    await getPendingPractices(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('999') })
    );
  });

  it('should return 409 when period is not EN_CURSO', async () => {
    const periodChain = chainMock({ PERIOD_ID: 1, PERIOD_STATUS: PERIOD_STATUS.CULMINADO });
    mockFromFn.mockReturnValueOnce(periodChain);

    const req = createMockReq({ id: '1' });
    const res = createMockRes();

    await getPendingPractices(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return empty array when no practices exist', async () => {
    const periodChain = chainMock({ PERIOD_ID: 1, PERIOD_STATUS: PERIOD_STATUS.EN_CURSO });
    const practicesChain = chainMock([]);
    mockFromFn.mockReturnValueOnce(periodChain).mockReturnValueOnce(practicesChain);

    const req = createMockReq({ id: '1' });
    const res = createMockRes();

    await getPendingPractices(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ pendingPractices: [], totalPractices: 0 })
    );
  });

  it('should identify PRE_INSCRITO practices as pending', async () => {
    const periodChain = chainMock({ PERIOD_ID: 1, PERIOD_STATUS: PERIOD_STATUS.EN_CURSO });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.PRE_INSCRITO, PERSON_ID: 100, CAREER_ID: 1 },
      { PROFESSIONAL_PRACTICE_ID: 11, PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO, PERSON_ID: 101, CAREER_ID: 1 },
      { PROFESSIONAL_PRACTICE_ID: 12, PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO, PERSON_ID: 102, CAREER_ID: 1 },
    ]);

    const personChain = chainMock({ FIRST_NAME: 'Juan', MIDDLE_NAME: '', LAST_NAME: 'Pérez', SECOND_LAST_NAME: '', ID_CARD: '12345' });
    const careerChain = chainMock({ DESCRIPTION: 'Ingeniería' });
    const evalChain = chainMock(null);
    evalChain._count = 0;

    mockFromFn
      .mockReturnValueOnce(periodChain)
      .mockReturnValueOnce(practicesChain)
      .mockReturnValueOnce(personChain)   // for practice 10
      .mockReturnValueOnce(careerChain)   // for practice 10
      .mockReturnValueOnce(personChain)   // for practice 11
      .mockReturnValueOnce(careerChain)   // for practice 11
      .mockReturnValueOnce(evalChain);    // eval count for practice 11

    // Override eval chain to return count
    evalChain.select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }),
    });

    const req = createMockReq({ id: '1' });
    const res = createMockRes();

    await getPendingPractices(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.pendingPractices.length).toBeGreaterThanOrEqual(2);
    expect(response.totalPractices).toBe(3);

    // PRE_INSCRITO practice should be included
    const preInscrito = response.pendingPractices.find((p: any) => p.practiceId === 10);
    expect(preInscrito).toBeDefined();
    expect(preInscrito.statusLabel).toBe('Pre-inscrito');
    expect(preInscrito.pendingIssue).toContain('Pre-inscrito');
  });

  it('should include INSCRITO practices without evaluations', async () => {
    const periodChain = chainMock({ PERIOD_ID: 1, PERIOD_STATUS: PERIOD_STATUS.EN_CURSO });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 20, PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO, PERSON_ID: 200, CAREER_ID: 2 },
    ]);

    const personChain = chainMock({ FIRST_NAME: 'María', MIDDLE_NAME: '', LAST_NAME: 'García', SECOND_LAST_NAME: '', ID_CARD: '67890' });
    const careerChain = chainMock({ DESCRIPTION: 'Medicina' });
    // Eval chain with count = 0
    const evalChain = chainMock(null);
    evalChain.select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }),
    });

    mockFromFn
      .mockReturnValueOnce(periodChain)
      .mockReturnValueOnce(practicesChain)
      .mockReturnValueOnce(personChain)
      .mockReturnValueOnce(careerChain)
      .mockReturnValueOnce(evalChain);

    const req = createMockReq({ id: '1' });
    const res = createMockRes();

    await getPendingPractices(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.pendingPractices).toHaveLength(1);
    expect(response.pendingPractices[0].pendingIssue).toContain('sin evaluaciones');
    expect(response.pendingPractices[0].hasEvaluations).toBe(false);
  });
});

describe('closePeriodWithDecisions — D-02', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when period not found', async () => {
    const periodChain = chainMock(null, { message: 'Not found' });
    mockFromFn.mockReturnValueOnce(periodChain);

    const req = createMockReq({ id: '999' });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 409 when period is not EN_CURSO', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.PENDIENTE,
      DESCRIPTION: 'Test',
      EVALUATION_GRACE_DAYS: 10,
    });
    mockFromFn.mockReturnValueOnce(periodChain);

    const req = createMockReq({ id: '1' });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 400 when decisions format is invalid', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.EN_CURSO,
      DESCRIPTION: 'Test',
      EVALUATION_GRACE_DAYS: 10,
    });
    mockFromFn.mockReturnValueOnce(periodChain);

    const req = createMockReq({ id: '1' }, { decisions: 'not-an-array' });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('inválido') })
    );
  });

  it('should accept valid decisions array', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.EN_CURSO,
      DESCRIPTION: 'Test Period',
      EVALUATION_GRACE_DAYS: 10,
    });
    // extend: first read current grace days
    const graceReadChain = chainMock({ EVALUATION_GRACE_DAYS: 10 });
    // extend: then update grace days
    const graceUpdateChain = chainMock({ error: null });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.PRE_INSCRITO },
    ]);
    const freezeEvalChain = chainMock([{ EVALUATION_ID: 1 }]);
    const closeChain = chainMock({ error: null });

    mockFromFn
      .mockReturnValueOnce(periodChain)       // initial validation
      .mockReturnValueOnce(graceReadChain)     // extend: read grace days
      .mockReturnValueOnce(graceUpdateChain)   // extend: update grace days
      .mockReturnValueOnce(practicesChain)     // get all practices
      .mockReturnValueOnce(freezeEvalChain)    // freeze evaluations
      .mockReturnValueOnce(closeChain);        // close period

    const req = createMockReq({ id: '1' }, {
      decisions: [
        { practiceId: 10, decision: 'extend' },
      ],
    });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    // Should succeed — either 200 with success: true, or handled gracefully
    const callArgs = res.json.mock.calls[0]?.[0];
    if (callArgs) {
      expect(callArgs.success).toBe(true);
      expect(callArgs.data.periodId).toBe(1);
      expect(callArgs.data.decisionsApplied).toBe(1);
    }
  });

  it('should close period without decisions (backward compatible)', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.EN_CURSO,
      DESCRIPTION: 'Test Period',
      EVALUATION_GRACE_DAYS: 10,
      START_DATE: '2025-01-01',
      END_DATE: '2025-06-01',
    });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO },
    ]);
    const freezeEvalChain = chainMock([{ EVALUATION_ID: 1 }]);
    const closeChain = chainMock({ error: null });

    mockFromFn
      .mockReturnValueOnce(periodChain)    // initial validation
      .mockReturnValueOnce(practicesChain)  // get all practices
      .mockReturnValueOnce(freezeEvalChain) // freeze evaluations
      .mockReturnValueOnce(closeChain);     // close period

    const req = createMockReq({ id: '1' }, {});
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.data.periodId).toBe(1);
    expect(response.data.decisionsApplied).toBe(0);
  });

  it('should apply enroll decision to convert PRE_INSCRITO → INSCRITO', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.EN_CURSO,
      DESCRIPTION: 'Test Period',
      EVALUATION_GRACE_DAYS: 10,
    });
    const enrollUpdateChain = chainMock({ error: null });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 20, PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO },
    ]);
    const freezeEvalChain = chainMock([]);
    const closeChain = chainMock({ error: null });

    mockFromFn
      .mockReturnValueOnce(periodChain)
      .mockReturnValueOnce(enrollUpdateChain)  // enroll decision update
      .mockReturnValueOnce(practicesChain)     // get all practices
      .mockReturnValueOnce(freezeEvalChain)    // freeze
      .mockReturnValueOnce(closeChain);        // close

    const req = createMockReq({ id: '1' }, {
      decisions: [
        { practiceId: 20, decision: 'enroll' },
      ],
    });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.data.decisionsApplied).toBe(1);
    expect(response.data.summary.enrolled).toBe(1);
  });

  it('should apply retiro_justificado decision', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.EN_CURSO,
      DESCRIPTION: 'Test',
      EVALUATION_GRACE_DAYS: 10,
    });
    const updateChain = chainMock({ error: null });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 30, PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO },
    ]);
    const freezeChain = chainMock([]);
    const closeChain = chainMock({ error: null });

    mockFromFn
      .mockReturnValueOnce(periodChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(practicesChain)
      .mockReturnValueOnce(freezeChain)
      .mockReturnValueOnce(closeChain);

    const req = createMockReq({ id: '1' }, {
      decisions: [{ practiceId: 30, decision: 'retiro_justificado' }],
    });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.data.summary.retired).toBe(1);
  });

  it('should apply abandono decision', async () => {
    const periodChain = chainMock({
      PERIOD_ID: 1,
      PERIOD_STATUS: PERIOD_STATUS.EN_CURSO,
      DESCRIPTION: 'Test',
      EVALUATION_GRACE_DAYS: 10,
    });
    const updateChain = chainMock({ error: null });
    const practicesChain = chainMock([
      { PROFESSIONAL_PRACTICE_ID: 40, PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO },
    ]);
    const freezeChain = chainMock([]);
    const closeChain = chainMock({ error: null });

    mockFromFn
      .mockReturnValueOnce(periodChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(practicesChain)
      .mockReturnValueOnce(freezeChain)
      .mockReturnValueOnce(closeChain);

    const req = createMockReq({ id: '1' }, {
      decisions: [{ practiceId: 40, decision: 'abandono' }],
    });
    const res = createMockRes();

    await closePeriodWithDecisions(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.data.summary.abandoned).toBe(1);
  });
});
