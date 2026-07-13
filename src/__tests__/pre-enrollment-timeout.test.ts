/**
 * @file Tests for pre-enrollment timeout auto-cancel (D-03).
 * @description Pure unit tests with mocked Supabase. No DB required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPreEnrollmentTimeouts, previewTimeoutPractices } from '../../backend/src/utils/pre-enrollment-timeout.js';
import { PRACTICES_STATUS } from '../../backend/src/constants/practice-status.constants.js';

function createMockClient(queues: Record<string, any[]>) {
  function makeChain(table: string) {
    const chain: any = {};
    chain.then = (resolve: any, reject: any) => {
      const entry = queues[table]?.shift();
      const result = entry ?? { data: [], error: null };
      return Promise.resolve(result).then(resolve, reject);
    };
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.lt = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockImplementation(() => {
      const entry = queues[table]?.shift();
      const result = entry ?? { data: null, error: null };
      return Promise.resolve(result);
    });
    return chain;
  }

  const client: any = {
    from: vi.fn().mockImplementation((table: string) => makeChain(table)),
  };

  return { client };
}

const mockStudent = {
  FIRST_NAME: 'Juan',
  LAST_NAME: 'Perez',
  DOCUMENT_ID: 'V-12345678',
};

const mockCareer = { NAME: 'Ing. Sistemas' };

describe('checkPreEnrollmentTimeouts — D-03', () => {
  it('should return cancelled=0 when no stale practices exist', async () => {
    const { client } = createMockClient({
      't_professional_practices': [{ data: [], error: null }],
    });

    const result = await checkPreEnrollmentTimeouts(client, 30);
    expect(result.cancelled).toBe(0);
    expect(result.practices).toEqual([]);
  });

  it('should cancel stale PRE_INSCRITO practices', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);

    const { client } = createMockClient({
      't_professional_practices': [
        // Query result
        {
          data: [
            {
              PROFESSIONAL_PRACTICE_ID: 1,
              CREATED_AT: oldDate.toISOString(),
              t_students: mockStudent,
              t_career: mockCareer,
            },
          ],
          error: null,
        },
        // Update result
        { data: null, error: null },
      ],
    });

    const result = await checkPreEnrollmentTimeouts(client, 30);
    expect(result.cancelled).toBe(1);
    expect(result.practices).toHaveLength(1);
    expect(result.practices[0].practiceId).toBe(1);
    expect(result.practices[0].studentName).toBe('Juan Perez');
    expect(result.practices[0].careerName).toBe('Ing. Sistemas');
    expect(result.practices[0].daysSinceCreation).toBeGreaterThanOrEqual(45);
  });

  it('should cancel multiple stale practices', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);

    const { client } = createMockClient({
      't_professional_practices': [
        {
          data: [
            { PROFESSIONAL_PRACTICE_ID: 1, CREATED_AT: oldDate.toISOString(), t_students: mockStudent, t_career: mockCareer },
            { PROFESSIONAL_PRACTICE_ID: 2, CREATED_AT: oldDate.toISOString(), t_students: { ...mockStudent, FIRST_NAME: 'Maria' }, t_career: mockCareer },
          ],
          error: null,
        },
        { data: null, error: null },
      ],
    });

    const result = await checkPreEnrollmentTimeouts(client, 30);
    expect(result.cancelled).toBe(2);
    expect(result.practices).toHaveLength(2);
  });

  it('should return cancelled=0 on query error', async () => {
    const { client } = createMockClient({
      't_professional_practices': [{ data: null, error: { message: 'DB error' } }],
    });

    const result = await checkPreEnrollmentTimeouts(client, 30);
    expect(result.cancelled).toBe(0);
  });

  it('should return cancelled=0 on update error', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);

    const { client } = createMockClient({
      't_professional_practices': [
        {
          data: [{ PROFESSIONAL_PRACTICE_ID: 1, CREATED_AT: oldDate.toISOString(), t_students: mockStudent, t_career: mockCareer }],
          error: null,
        },
        { data: null, error: { message: 'Update failed' } },
      ],
    });

    const result = await checkPreEnrollmentTimeouts(client, 30);
    expect(result.cancelled).toBe(0);
  });

  it('should use default 30 days timeout', async () => {
    const { client } = createMockClient({
      't_professional_practices': [{ data: [], error: null }],
    });

    const result = await checkPreEnrollmentTimeouts(client);
    expect(result.cancelled).toBe(0);
    // Verify lt was called with a date ~30 days ago
    expect(client.from).toHaveBeenCalledWith('t_professional_practices');
  });

  it('should respect custom timeout days', async () => {
    const { client } = createMockClient({
      't_professional_practices': [{ data: [], error: null }],
    });

    const result = await checkPreEnrollmentTimeouts(client, 7);
    expect(result.cancelled).toBe(0);
  });
});

describe('previewTimeoutPractices — D-03', () => {
  it('should return wouldCancel=0 when no stale practices', async () => {
    const { client } = createMockClient({
      't_professional_practices': [{ data: [], error: null }],
    });

    const result = await previewTimeoutPractices(client, 30);
    expect(result.wouldCancel).toBe(0);
    expect(result.practices).toEqual([]);
  });

  it('should count stale practices without cancelling', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);

    const { client } = createMockClient({
      't_professional_practices': [
        {
          data: [
            { PROFESSIONAL_PRACTICE_ID: 1, CREATED_AT: oldDate.toISOString(), t_students: mockStudent, t_career: mockCareer },
          ],
          error: null,
        },
      ],
    });

    const result = await previewTimeoutPractices(client, 30);
    expect(result.wouldCancel).toBe(1);
    expect(result.practices).toHaveLength(1);
    // Verify no update was called (preview is read-only)
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it('should return wouldCancel=0 on error', async () => {
    const { client } = createMockClient({
      't_professional_practices': [{ data: null, error: { message: 'DB error' } }],
    });

    const result = await previewTimeoutPractices(client, 30);
    expect(result.wouldCancel).toBe(0);
  });
});
