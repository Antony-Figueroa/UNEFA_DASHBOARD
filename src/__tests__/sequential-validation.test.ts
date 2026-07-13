/**
 * @file Tests for sequential-validation.ts — cross-period blocking (D-05)
 * @description Pure unit test with mocked Supabase. No DB required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSequentialPrerequisite } from '../../backend/src/utils/sequential-validation.js';
import { PRACTICES_STATUS } from '../../backend/src/constants/practice-status.constants.js';

/**
 * Creates a mock Supabase client. The `.from()` method is tracked and
 * returns thenable chains that resolve to configured data.
 *
 * Each `.from(table)` call pops the next entry from the queue for that table.
 */
function createMockClient(queues: Record<string, any[]>) {
  const calls: string[] = [];

  function makeChain(table: string) {
    const chain: any = {};
    // Make it thenable so `await chain` resolves
    chain.then = (resolve: any, reject: any) => {
      const entry = queues[table]?.shift();
      const result = entry ?? { data: [], error: null };
      return Promise.resolve(result).then(resolve, reject);
    };
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockImplementation(() => {
      const entry = queues[table]?.shift();
      const result = entry ?? { data: null, error: null };
      return Promise.resolve(result);
    });
    return chain;
  }

  const client: any = {
    from: vi.fn().mockImplementation((table: string) => {
      calls.push(table);
      return makeChain(table);
    }),
  };

  return { client, calls };
}

describe('checkSequentialPrerequisite — cross-period validation (D-05)', () => {
  it('should return valid for PRIORITY=1 (no prerequisites)', async () => {
    const { client } = createMockClient({
      't_internship_type': [{ data: { PRIORITY: 1 }, error: null }],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 10,
    });
    expect(result.valid).toBe(true);
  });

  it('should return valid for PRIORITY=0 (standalone)', async () => {
    const { client } = createMockClient({
      't_internship_type': [{ data: { PRIORITY: 0 }, error: null }],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 10,
    });
    expect(result.valid).toBe(true);
  });

  it('should return valid when prerequisite CULMINADO exists with passing grade', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },               // call 1: current type
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null }, // call 3: typePriorities
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        // CULMINADO check → found!
        { data: [{ PROFESSIONAL_PRACTICE_ID: 1, GRADE: 15, t_culmination_reversals: [] }], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });
    expect(result.valid).toBe(true);
  });

  it('should block with reprobado when prerequisite is REPROBADO', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },               // call 1: current type priority
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null }, // call 3: typePriorities
        { data: { NAME: 'Hospitalaria' }, error: null },       // call 7: prerequisite type name
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        // CULMINADO check → empty
        { data: [], error: null },
        // Cross-period check → REPROBADO
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO }], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReason).toBe('reprobado');
    expect(result.message).toContain('reprobado');
    expect(result.message).toContain('próximo año');
  });

  it('should block with retirado when prerequisite is RETIRADO', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null },
        { data: { NAME: 'Comunitaria' }, error: null },
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        { data: [], error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.RETIRADO }], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReason).toBe('retirado');
    expect(result.message).toContain('retirado');
  });

  it('should block with retiro_justificado when prerequisite has RETIRO_JUSTIFICADO', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null },
        { data: { NAME: 'Hospitalaria' }, error: null },
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        { data: [], error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.RETIRO_JUSTIFICADO }], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReason).toBe('retiro_justificado');
    expect(result.message).toContain('retiro justificado');
    expect(result.message).toContain('siguiente período');
  });

  it('should return generic message when no failed practices and no CULMINADO', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null },
        { data: { NAME: 'Hospitalaria' }, error: null },
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        { data: [], error: null },
        { data: [], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReason).toBeNull();
    expect(result.message).toContain('completar y aprobar');
  });

  it('should prefer reprobado over retiro_justificado when both exist', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null },
        { data: { NAME: 'Hospitalaria' }, error: null },
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        { data: [], error: null },
        {
          data: [
            { INTERNSHIP_TYPE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO },
            { INTERNSHIP_TYPE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.RETIRO_JUSTIFICADO },
          ],
          error: null,
        },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReason).toBe('reprobado');
  });

  it('should return valid when only single type assigned (no sequential)', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });
    expect(result.valid).toBe(true);
  });

  it('should block when CULMINADO exists but grade below minimum', async () => {
    const { client } = createMockClient({
      't_internship_type': [
        { data: { PRIORITY: 2 }, error: null },
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRIORITY: 1 }, { INTERNSHIP_TYPE_ID: 20, PRIORITY: 2 }], error: null },
        { data: { NAME: 'Hospitalaria' }, error: null },
      ],
      't_career_internship_type': [
        { data: [{ INTERNSHIP_TYPE_ID: 10 }, { INTERNSHIP_TYPE_ID: 20 }], error: null },
      ],
      't_career': [
        { data: { MINIMUM_GRADE: 10 }, error: null },
      ],
      't_professional_practices': [
        // CULMINADO check → CULMINADO but grade below minimum
        { data: [{ PROFESSIONAL_PRACTICE_ID: 1, GRADE: 8, t_culmination_reversals: [] }], error: null },
        // Cross-period check → REPROBADO
        { data: [{ INTERNSHIP_TYPE_ID: 10, PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO }], error: null },
      ],
    });

    const result = await checkSequentialPrerequisite(client, {
      studentsId: 1,
      careerId: 1,
      internshipTypeId: 20,
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReason).toBe('reprobado');
  });
});
