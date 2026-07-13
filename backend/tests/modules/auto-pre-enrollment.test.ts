/**
 * @file auto-pre-enrollment.test.ts
 * @description TDD unit tests for triggerAutoPreEnrollment.
 *
 * All 5 guard conditions, success path, and PREVIOUS_PRACTICE_ID propagation.
 * Uses mocked Supabase client — no live DB required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerAutoPreEnrollment, type CulminatedPractice } from '../../src/utils/auto-pre-enrollment.js';
import { PRACTICES_STATUS } from '../../src/constants/practice-status.constants.js';

// ─── Mock Supabase factory ──────────────────────────────────────────
// Each .from() call returns a fresh query chain. The `tableResponses`
// map configures what each table's query chain should resolve to.

type TableResponse = {
  single?: any;
  maybeSingle?: any;
  array?: any;
  error?: any;
};

function createMockSupabase(tableResponses: Record<string, TableResponse>) {
  const fromCalls: string[] = [];

  function createChain(table: string) {
    const response = tableResponses[table] || {};
    const chain: any = {};

    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.gt = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);

    chain.maybeSingle = vi.fn().mockResolvedValue({
      data: response.maybeSingle ?? null,
      error: response.error ?? null,
    });

    chain.single = vi.fn().mockResolvedValue({
      data: response.single ?? null,
      error: response.error ?? null,
    });

    // Default array response (when awaited without .maybeSingle()/.single())
    chain.then = function (resolve: any, reject: any) {
      return Promise.resolve({
        data: response.array ?? [],
        error: response.error ?? null,
      }).then(resolve, reject);
    };

    chain.insert = vi.fn().mockResolvedValue({
      data: response.insertData ?? { PROFESSIONAL_PRACTICE_ID: 999 },
      error: response.insertError ?? null,
    });

    return chain;
  }

  const fromMock = vi.fn((table: string) => {
    fromCalls.push(table);
    return createChain(table);
  });

  return {
    from: fromMock,
    _fromCalls: fromCalls,
  };
}

function createBasePractice(overrides: Partial<CulminatedPractice> = {}): CulminatedPractice {
  return {
    PROFESSIONAL_PRACTICE_ID: 100,
    STUDENTS_ID: 10,
    CAREER_ID: 20,
    INTERNSHIP_TYPE_ID: 30,
    PERIOD_ID: 40,
    SEMESTER: '5',
    SECTION: 'A',
    REGIME: 'DIURNO',
    ENROLLMENT: '2024-001',
    INSTITUTION_ID: 50,
    MANAGER_ID: 60,
    GRADE: 18,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('triggerAutoPreEnrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════
  // Guard 1: AUTO_PRE_ENROLL = false
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: false, reason: "career_auto_pre_enroll_disabled" } when AUTO_PRE_ENROLL is false', async () => {
    const mock = createMockSupabase({
      't_career': { maybeSingle: { AUTO_PRE_ENROLL: false } },
    });

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());

    expect(result).toEqual({
      created: false,
      reason: 'career_auto_pre_enroll_disabled',
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Guard 2: PRIORITY = 0 (standalone type)
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: false, reason: "standalone_type" } when current type PRIORITY is 0', async () => {
    const mock = createMockSupabase({
      't_career': { maybeSingle: { AUTO_PRE_ENROLL: true } },
      't_internship_type': { maybeSingle: { PRIORITY: 0 } },
    });

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());

    expect(result).toEqual({
      created: false,
      reason: 'standalone_type',
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Guard 3: No next type in sequence
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: false, reason: "last_in_sequence" } when no next type exists', async () => {
    // The mock will return the same response for every .from('t_internship_type') call.
    // Guard 2 passes (PRIORITY > 0), Guard 3: no next type with higher priority.
    // We need two calls to t_internship_type: first returns current type (PRIORITY=2),
    // second (for next type) returns null.
    // Since mock returns same response for all calls to same table, we handle this
    // by making PRIORITY=2 for current type and null for next type by using
    // sequential mock behavior.
    let internshipTypeCallCount = 0;
    const internshipTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    internshipTypeChain.maybeSingle.mockImplementation(() => {
      internshipTypeCallCount++;
      if (internshipTypeCallCount === 1) {
        // First call: current type → PRIORITY = 2
        return Promise.resolve({ data: { PRIORITY: 2 }, error: null });
      }
      // Second call: next type → null (no type with higher priority)
      return Promise.resolve({ data: null, error: null });
    });

    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { AUTO_PRE_ENROLL: true }, error: null }),
          };
        }
        if (table === 't_internship_type') {
          return internshipTypeChain;
        }
        if (table === 't_career_internship_type') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ INTERNSHIP_TYPE_ID: 30 }, { INTERNSHIP_TYPE_ID: 31 }], error: null }).then(resolve, reject),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice({ INTERNSHIP_TYPE_ID: 30 }));

    expect(result).toEqual({
      created: false,
      reason: 'last_in_sequence',
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Guard 4: Duplicate pre-enrollment exists
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: false, reason: "duplicate_pre_enrollment" } when a PRE_INSCRITO already exists', async () => {
    let internshipTypeCallCount = 0;
    const internshipTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    internshipTypeChain.maybeSingle.mockImplementation(() => {
      internshipTypeCallCount++;
      if (internshipTypeCallCount === 1) {
        return Promise.resolve({ data: { PRIORITY: 1 }, error: null });
      }
      // Next type found
      return Promise.resolve({ data: { INTERNSHIP_TYPE_ID: 31 }, error: null });
    });

    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { AUTO_PRE_ENROLL: true }, error: null }),
          };
        }
        if (table === 't_internship_type') {
          return internshipTypeChain;
        }
        if (table === 't_career_internship_type') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ INTERNSHIP_TYPE_ID: 30 }, { INTERNSHIP_TYPE_ID: 31 }], error: null }).then(resolve, reject),
          };
        }
        if (table === 't_professional_practices') {
          // Duplicate check returns existing record
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { PROFESSIONAL_PRACTICE_ID: 888 }, error: null }),
          };
        }
        return {};
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice({ INTERNSHIP_TYPE_ID: 30 }));

    expect(result).toEqual({
      created: false,
      reason: 'duplicate_pre_enrollment',
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Guard 5: Insert error
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: false, reason: "insert_error: ..." } when DB insert fails', async () => {
    let internshipTypeCallCount = 0;
    const internshipTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    internshipTypeChain.maybeSingle.mockImplementation(() => {
      internshipTypeCallCount++;
      if (internshipTypeCallCount === 1) {
        return Promise.resolve({ data: { PRIORITY: 1 }, error: null });
      }
      return Promise.resolve({ data: { INTERNSHIP_TYPE_ID: 31 }, error: null });
    });

    let practiceCallCount = 0;
    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { AUTO_PRE_ENROLL: true }, error: null }),
          };
        }
        if (table === 't_internship_type') {
          return internshipTypeChain;
        }
        if (table === 't_career_internship_type') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ INTERNSHIP_TYPE_ID: 30 }, { INTERNSHIP_TYPE_ID: 31 }], error: null }).then(resolve, reject),
          };
        }
        if (table === 't_professional_practices') {
          practiceCallCount++;
          if (practiceCallCount === 1) {
            // Duplicate check → no duplicate
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          // Insert → error
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection refused' } }),
          };
        }
        return {};
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice({ INTERNSHIP_TYPE_ID: 30 }));

    expect(result.created).toBe(false);
    expect(result.reason).toMatch(/^insert_error: .*/);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Success path
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: true } when all guards pass and insert succeeds', async () => {
    let internshipTypeCallCount = 0;
    const internshipTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    internshipTypeChain.maybeSingle.mockImplementation(() => {
      internshipTypeCallCount++;
      if (internshipTypeCallCount === 1) {
        return Promise.resolve({ data: { PRIORITY: 1 }, error: null });
      }
      return Promise.resolve({ data: { INTERNSHIP_TYPE_ID: 31 }, error: null });
    });

    let practiceCallCount = 0;
    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { AUTO_PRE_ENROLL: true }, error: null }),
          };
        }
        if (table === 't_internship_type') {
          return internshipTypeChain;
        }
        if (table === 't_career_internship_type') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ INTERNSHIP_TYPE_ID: 30 }, { INTERNSHIP_TYPE_ID: 31 }], error: null }).then(resolve, reject),
          };
        }
        if (table === 't_professional_practices') {
          practiceCallCount++;
          if (practiceCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: { PROFESSIONAL_PRACTICE_ID: 999 }, error: null }),
          };
        }
        return {};
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice({ INTERNSHIP_TYPE_ID: 30 }));

    expect(result).toEqual({ created: true });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PREVIOUS_PRACTICE_ID propagation
  // ═══════════════════════════════════════════════════════════════════

  it('should set PREVIOUS_PRACTICE_ID to the current practice ID in the insert payload', async () => {
    let internshipTypeCallCount = 0;
    const internshipTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    internshipTypeChain.maybeSingle.mockImplementation(() => {
      internshipTypeCallCount++;
      if (internshipTypeCallCount === 1) {
        return Promise.resolve({ data: { PRIORITY: 1 }, error: null });
      }
      return Promise.resolve({ data: { INTERNSHIP_TYPE_ID: 31 }, error: null });
    });

    let practiceCallCount = 0;
    let insertPayload: any = null;
    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { AUTO_PRE_ENROLL: true }, error: null }),
          };
        }
        if (table === 't_internship_type') {
          return internshipTypeChain;
        }
        if (table === 't_career_internship_type') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ INTERNSHIP_TYPE_ID: 30 }, { INTERNSHIP_TYPE_ID: 31 }], error: null }).then(resolve, reject),
          };
        }
        if (table === 't_professional_practices') {
          practiceCallCount++;
          if (practiceCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {
            insert: vi.fn().mockImplementation((payload: any) => {
              insertPayload = payload;
              return Promise.resolve({ data: { PROFESSIONAL_PRACTICE_ID: 999 }, error: null });
            }),
          };
        }
        return {};
      }),
    };

    const practice = createBasePractice({
      INTERNSHIP_TYPE_ID: 30,
      PROFESSIONAL_PRACTICE_ID: 42,
    });

    await triggerAutoPreEnrollment(mock as any, practice);

    expect(insertPayload).not.toBeNull();
    expect(insertPayload.PREVIOUS_PRACTICE_ID).toBe(42);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Insert payload correctness
  // ═══════════════════════════════════════════════════════════════════

  it('should insert a PRE_INSCRITO record with correct field mappings', async () => {
    let internshipTypeCallCount = 0;
    const internshipTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    internshipTypeChain.maybeSingle.mockImplementation(() => {
      internshipTypeCallCount++;
      if (internshipTypeCallCount === 1) {
        return Promise.resolve({ data: { PRIORITY: 1 }, error: null });
      }
      return Promise.resolve({ data: { INTERNSHIP_TYPE_ID: 31 }, error: null });
    });

    let practiceCallCount = 0;
    let insertPayload: any = null;
    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { AUTO_PRE_ENROLL: true }, error: null }),
          };
        }
        if (table === 't_internship_type') {
          return internshipTypeChain;
        }
        if (table === 't_career_internship_type') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: [{ INTERNSHIP_TYPE_ID: 30 }, { INTERNSHIP_TYPE_ID: 31 }], error: null }).then(resolve, reject),
          };
        }
        if (table === 't_professional_practices') {
          practiceCallCount++;
          if (practiceCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {
            insert: vi.fn().mockImplementation((payload: any) => {
              insertPayload = payload;
              return Promise.resolve({ data: { PROFESSIONAL_PRACTICE_ID: 999 }, error: null });
            }),
          };
        }
        return {};
      }),
    };

    const practice = createBasePractice({ INTERNSHIP_TYPE_ID: 30 });
    await triggerAutoPreEnrollment(mock as any, practice);

    expect(insertPayload).not.toBeNull();
    expect(insertPayload.STUDENTS_ID).toBe(10);
    expect(insertPayload.CAREER_ID).toBe(20);
    expect(insertPayload.PERIOD_ID).toBe(40);
    expect(insertPayload.SEMESTER).toBe('5');
    expect(insertPayload.SECTION).toBe('A');
    expect(insertPayload.REGIME).toBe('DIURNO');
    expect(insertPayload.ENROLLMENT).toBe('2024-001');
    expect(insertPayload.INSTITUTION_ID).toBe(50);
    expect(insertPayload.MANAGER_ID).toBe(60);
    expect(insertPayload.INTERNSHIP_TYPE_ID).toBe(31);
    expect(insertPayload.PRACTICES_STATUS).toBe(PRACTICES_STATUS.PRE_INSCRITO);
    expect(insertPayload.PREVIOUS_PRACTICE_ID).toBe(100);
  });

  // ═══════════════════════════════════════════════════════════════════
  // Never throws — error safety
  // ═══════════════════════════════════════════════════════════════════

  it('should never throw even if Supabase calls throw unexpected errors', async () => {
    const mock = {
      from: vi.fn().mockImplementation(() => {
        throw new Error('unexpected DB crash');
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());
    expect(result.created).toBe(false);
    expect(result.reason).toMatch(/insert_error: unexpected DB crash/);
  });

  it('should return error when career lookup fails', async () => {
    const mock = createMockSupabase({
      't_career': { maybeSingle: null, error: { message: 'connection timeout' } },
    });

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());
    expect(result.created).toBe(false);
    expect(result.reason).toBe('career_lookup_error: connection timeout');
  });
});
