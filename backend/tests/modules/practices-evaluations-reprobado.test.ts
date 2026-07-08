import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import {
  createAuthenticatedAgent,
} from '../setup/helpers.js';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { PRACTICES_STATUS } from '../../src/constants/practice-status.constants.js';

// Minimal shape of a practice row returned by the controller.
interface PracticeRow {
  practiceId: number;
  result: 'approved' | 'failed' | 'pending';
  finalGrade: number | null;
}

let agent: request.Agent;
let supabase: ReturnType<typeof createClient>;

// We reuse an EXISTING practice row in the DB and flip its PRACTICES_STATUS
// to REPROBADO for the duration of the test, then restore it. This avoids
// building the full student→person FK chain and exercises the real controller.
let borrowedPracticeId: number | null = null;
let originalStatus: number | null = null;

beforeAll(async () => {
  agent = await createAuthenticatedAgent(app);

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[reprobado-test] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — live DB required for this integration test'
    );
  }
  supabase = createClient(supabaseUrl, supabaseKey);

  // Borrow ANY active practice (we will flip it to REPROBADO for the test).
  const { data: candidate } = await supabase
    .from('t_professional_practices')
    .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS, GRADE')
    .eq('STATUS', 1)
    .limit(1)
    .maybeSingle();

  expect(candidate, 'need at least one active practice in DB to borrow').toBeTruthy();
  borrowedPracticeId = (candidate as any).PROFESSIONAL_PRACTICE_ID;
  originalStatus = (candidate as any).PRACTICES_STATUS;
});

afterAll(async () => {
  // Restore the borrowed practice to its original status.
  if (borrowedPracticeId !== null && originalStatus !== null) {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: originalStatus })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);
  }
});

describe('getPracticesWithEvaluations — REPROBADO inclusion (Part 1)', () => {
  it('includes a practice marked REPROBADO with result = failed', async () => {
    expect(borrowedPracticeId, 'borrowed practice id').toBeGreaterThan(0);

    // Flip the borrowed practice to REPROBADO.
    const { error: updateError } = await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);
    expect(updateError, 'status flip to REPROBADO').toBeNull();

    // Hit the endpoint and assert the REPROBADO practice is present + failed.
    const res = await agent.get('/api/practices/evaluations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const rows = res.body.data as PracticeRow[];
    const target = rows.find((r) => r.practiceId === borrowedPracticeId);

    expect(target, 'REPROBADO practice must appear in the unified list').toBeTruthy();
    expect(target!.result).toBe('failed');
  });

  it('still includes INSCRITO practices after the status filter change', async () => {
    // Restore the borrowed practice to INSCRITO for this assertion.
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent.get('/api/practices/evaluations');
    expect(res.status).toBe(200);
    const rows = res.body.data as PracticeRow[];
    const target = rows.find((r) => r.practiceId === borrowedPracticeId);

    // The INSCRITO practice must still be present in the unified list
    // (proves the filter now uses .in([INSCRITO, REPROBADO]) and did not
    // drop INSCRITO). Note: a genuine low grade could still yield 'failed',
    // so we only assert presence + a valid enum, not the specific value.
    expect(target, 'INSCRITO practice must remain in the list').toBeTruthy();
    expect(['approved', 'failed', 'pending']).toContain(target!.result);
  });
});
