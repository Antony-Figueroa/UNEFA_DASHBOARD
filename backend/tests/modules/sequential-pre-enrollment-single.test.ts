/**
 * @file sequential-pre-enrollment-single.test.ts
 * @description Unit tests for sequential prerequisite validation in single createPreEnrollment endpoint.
 * Verifies that the endpoint calls checkSequentialPrerequisite and rejects when it fails.
 * Uses mocked Supabase client — no live DB required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPreEnrollment } from '../../src/controllers/pre-enrollments.controller.js';
import { checkSequentialPrerequisite } from '../../src/utils/sequential-validation.js';

// Mock the sequential validation function
vi.mock('../../src/utils/sequential-validation.js', () => ({
  checkSequentialPrerequisite: vi.fn(),
}));

// Mock the database manager
vi.mock('../../src/lib/db-manager.js', () => ({
  dbManager: {
    withRetry: vi.fn((fn: any) => fn(mockSupabase)),
  },
}));

// Mock the cache manager
vi.mock('../../src/lib/cache-manager.js', () => ({
  cacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock audit helpers
vi.mock('../../src/utils/audit-helpers.js', () => ({
  auditStatusChange: vi.fn(),
}));

// Create a mock Supabase client with full chain support
function createMockSupabase() {
  const fromCalls: string[] = [];

  function createChain(table: string) {
    const chain: any = {};

    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.gt = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);

    chain.maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    chain.single = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    chain.insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            PROFESSIONAL_PRACTICE_ID: 999,
            START_DATE: '2024-01-01',
            END_DATE: '2024-06-30',
            REPORT_TITLE: 'PENDIENTE',
            REGISTRATION_DATE: '2024-01-01',
            GRADE: 0,
            PRACTICES_STATUS: 'PRE_INSCRITO',
            PERIOD_ID: 1,
            INSTITUTION_ID: 60,
            STUDENTS_ID: 10,
            student_person_id: 1,
            STATUS: 1,
            MANAGER_ID: 50,
            ENROLLMENT: '2024-001',
            INTERNSHIP_STATUS: 1,
            INTERNSHIP_TYPE_ID: 31,
            CAREER_ID: 20,
            SEMESTER: '5',
            SECTION: 'A',
            REGIME: 'DIURNO',
            t_students: {
              STUDENTS_ID: 10,
              person_id: 1,
              t_persons: {
                ci: 'V-12345678',
                first_name: 'Test',
                last_name: 'Student',
                phone: '04121234567',
              },
            },
            t_career: { CAREER_NAME: 'Informática' },
            t_internships_period: { DESCRIPTION: '2024-1' },
            t_internship_type: { NAME: 'HOSPITALARIA' },
          },
          error: null,
        }),
      }),
    });

    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);

    // Default then for array results
    chain.then = function (resolve: any, reject: any) {
      return Promise.resolve({
        data: [],
        error: null,
      }).then(resolve, reject);
    };

    return chain;
  }

  const fromMock = vi.fn((table: string) => {
    fromCalls.push(table);
    const chain = createChain(table);

    // Configure responses per table
    if (table === 't_persons') {
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { person_id: 1 },
        error: null,
      });
    } else if (table === 't_students') {
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: {
          STUDENTS_ID: 10,
          person_id: 1,
          t_persons: { ci: 'V-12345678', first_name: 'Test', last_name: 'Student', phone: '04121234567' },
        },
        error: null,
      });
    } else if (table === 't_internships_period') {
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: {
          PERIOD_ID: 1,
          START_DATE: '2024-01-01',
          END_DATE: '2024-06-30',
          DESCRIPTION: '2024-1',
        },
        error: null,
      });
    } else if (table === 't_internship_type') {
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { INTERNSHIP_TYPE_ID: 31 },
        error: null,
      });
    } else if (table === 't_career') {
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { CAREER_ID: 20 },
        error: null,
      });
    } else if (table === 't_institution_manager') {
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: { MANAGER_ID: 50, INSTITUTION_ID: 60 },
        error: null,
      });
    } else if (table === 't_professional_practices') {
      // For active pre-enrollment check, duplicate check, and grace period
      chain.maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      // Grace period check returns empty array
      chain.then = function (resolve: any, reject: any) {
        return Promise.resolve({
          data: [],
          error: null,
        }).then(resolve, reject);
      };
    }

    return chain;
  });

  return {
    from: fromMock,
    _fromCalls: fromCalls,
  };
}

let mockSupabase: any;

// Mock request and response
const createMockReq = (body: any = {}) => ({
  body: {
    identificationPrefix: 'V',
    identificationNumber: '12345678',
    period: '2024-1',
    practiceType: 'HOSPITALARIA',
    enrollmentCode: '2024-001',
    careerId: '20',
    semester: '5',
    section: 'A',
    regime: 'DIURNO',
    ...body,
  },
});

const createMockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('createPreEnrollment - Sequential prerequisite validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  it('should call checkSequentialPrerequisite when careerId and practiceType are provided', async () => {
    const req = createMockReq();
    const res = createMockRes();

    // Mock sequential validation to succeed
    vi.mocked(checkSequentialPrerequisite).mockResolvedValue({
      valid: true,
    });

    await createPreEnrollment(req, res);

    // Verify that checkSequentialPrerequisite was called with correct params
    expect(checkSequentialPrerequisite).toHaveBeenCalledWith(
      mockSupabase,
      {
        studentsId: 10,
        careerId: 20,
        internshipTypeId: 31,
      }
    );

    // Should succeed and return 201
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should reject with 409 and blockingReason when sequential prerequisite fails', async () => {
    const req = createMockReq();
    const res = createMockRes();

    // Mock sequential validation to fail with blocking reason
    vi.mocked(checkSequentialPrerequisite).mockResolvedValue({
      valid: false,
      message: 'Prerrequisito secuencial no cumplido: HOSPITALARIA debe estar culminada antes de COMUNITARIA',
      blockingReason: 'retirado',
    });

    await createPreEnrollment(req, res);

    // Should return 409 with blocking reason
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Prerrequisito secuencial no cumplido'),
      })
    );
  });

  it('should not call checkSequentialPrerequisite when careerId is not provided', async () => {
    const req = createMockReq({ careerId: '' });
    const res = createMockRes();

    await createPreEnrollment(req, res);

    // Should not call sequential validation
    expect(checkSequentialPrerequisite).not.toHaveBeenCalled();

    // Should succeed (career is optional)
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should propagate blockingReason from sequential validation error', async () => {
    // Test each blocking reason type
    const testCases = [
      { blockingReason: 'reprobado' as const, message: 'Estudiante reprobó la práctica anterior' },
      { blockingReason: 'retirado' as const, message: 'Estudiante se retiró de la práctica anterior' },
      { blockingReason: 'retiro_justificado' as const, message: 'Estudiante se retiró con justificación' },
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();
      mockSupabase = createMockSupabase();

      vi.mocked(checkSequentialPrerequisite).mockResolvedValue({
        valid: false,
        message: testCase.message,
        blockingReason: testCase.blockingReason,
      });

      const req = createMockReq();
      const res = createMockRes();

      await createPreEnrollment(req, res);

      // Verify the response includes the blocking reason in the error
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: testCase.message,
        })
      );
    }
  });
});
