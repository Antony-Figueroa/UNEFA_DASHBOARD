/**
 * @file auto-pre-enrollment-override.test.ts
 * @description TDD tests for ENFORCE_SEQUENTIAL_ORDER guard in triggerAutoPreEnrollment.
 *
 * When toggle is OFF → auto pre-enrollment skipped with reason 'sequential_override_disabled'.
 * When toggle is ON → existing behavior unchanged.
 *
 * Uses mocked Supabase client — no live DB required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerAutoPreEnrollment, type CulminatedPractice } from '../../src/utils/auto-pre-enrollment.js';

function createBasePractice(overrides: Partial<CulminatedPractice> = {}): CulminatedPractice {
  return {
    PROFESSIONAL_PRACTICE_ID: 100,
    STUDENTS_ID: 10,
    STUDENT_PERSON_ID: 1001,
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

function makeConfigChain(data: any, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

function makeCareerChain(data: any, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe('triggerAutoPreEnrollment — ENFORCE_SEQUENTIAL_ORDER guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════
  // Guard 1.5: ENFORCE_SEQUENTIAL_ORDER = false
  // ═══════════════════════════════════════════════════════════════════

  it('should return { created: false, reason: "sequential_override_disabled" } when ENFORCE_SEQUENTIAL_ORDER is false', async () => {
    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') return makeCareerChain({ AUTO_PRE_ENROLL: true });
        if (table === 't_academic_config') return makeConfigChain({ ENFORCE_SEQUENTIAL_ORDER: false });
        return {};
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());

    expect(result).toMatchObject({
      created: false,
      reason: 'sequential_override_disabled',
    });
  });

  it('should proceed past Guard 1.5 when ENFORCE_SEQUENTIAL_ORDER is true', async () => {
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
        return Promise.resolve({ data: { PRIORITY: 0 }, error: null }); // standalone → Guard 2 blocks
      }
      return Promise.resolve({ data: null, error: null });
    });

    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') return makeCareerChain({ AUTO_PRE_ENROLL: true });
        if (table === 't_academic_config') return makeConfigChain({ ENFORCE_SEQUENTIAL_ORDER: true });
        if (table === 't_internship_type') return internshipTypeChain;
        return {};
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());

    // Should have passed Guard 1.5 and reached Guard 2 (standalone_type)
    expect(result).toMatchObject({
      created: false,
      reason: 'standalone_type',
    });
  });

  it('should proceed past Guard 1.5 when config row is missing (default = enforced)', async () => {
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
        return Promise.resolve({ data: { PRIORITY: 0 }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const mock = {
      from: vi.fn((table: string) => {
        if (table === 't_career') return makeCareerChain({ AUTO_PRE_ENROLL: true });
        if (table === 't_academic_config') return makeConfigChain(null, null);
        if (table === 't_internship_type') return internshipTypeChain;
        return {};
      }),
    };

    const result = await triggerAutoPreEnrollment(mock as any, createBasePractice());

    // Missing config → defaults to enforced → passes Guard 1.5 → reaches Guard 2
    expect(result).toMatchObject({
      created: false,
      reason: 'standalone_type',
    });
  });
});
