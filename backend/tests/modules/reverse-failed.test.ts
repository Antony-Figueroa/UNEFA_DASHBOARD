import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { PRACTICES_STATUS } from '../../src/constants/practice-status.constants.js';

// Integration tests for POST /api/evaluations/:practiceId/reverse-failed (Part 3a).
// Live DB required (borrows an existing practice row and flips its status).

let agent: request.Agent;
let supabase: ReturnType<typeof createClient>;

let borrowedPracticeId: number | null = null;
let originalStatus: number | null = null;

beforeAll(async () => {
  agent = await createAuthenticatedAgent(app);

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[reverse-failed-test] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — live DB required for this integration test'
    );
  }
  supabase = createClient(supabaseUrl, supabaseKey);

  const { data: candidate } = await supabase
    .from('t_professional_practices')
    .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS')
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

const ENDPOINT = (id: number) => `/api/evaluations/${id}/reverse-failed`;

describe('POST /evaluations/:practiceId/reverse-failed', () => {
  it('200 — flips REPROBADO → INSCRITO and records reason', async () => {
    expect(borrowedPracticeId, 'borrowed practice id').toBeGreaterThan(0);

    // Set borrowed practice to REPROBADO (manual failure).
    const { error: setErr } = await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);
    expect(setErr, 'status flip to REPROBADO').toBeNull();

    const res = await agent
      .post(ENDPOINT(borrowedPracticeId))
      .send({ reason: 'Error administrativo al marcar reprobado', resolutionNumber: 'RES-2026-001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm the DB row is now INSCRITO.
    const { data: row } = await supabase
      .from('t_professional_practices')
      .select('PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId)
      .maybeSingle();
    expect(row!.PRACTICES_STATUS).toBe(PRACTICES_STATUS.INSCRITO);
  });

  it('404 — missing practice returns not found', async () => {
    // A non-existent practice id (999999999) must yield 404.
    const res = await agent
      .post(ENDPOINT(999999999))
      .send({ reason: 'Reversión de práctica inexistente', resolutionNumber: 'RES-2026-002' });
    expect(res.status).toBe(404);
  });

  it('400 — missing reason is rejected', async () => {
    // Borrowed practice is INSCRITO after the first test; reason is required
    // regardless of status, so this exercises the guard.
    const res = await agent
      .post(ENDPOINT(borrowedPracticeId!))
      .send({ resolutionNumber: 'RES-2026-003' });
    expect(res.status).toBe(400);
  });

  it('400 — CULMINADO practice cannot be reversed', async () => {
    const { error: setErr } = await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);
    expect(setErr, 'status flip to CULMINADO').toBeNull();

    const res = await agent
      .post(ENDPOINT(borrowedPracticeId!))
      .send({ reason: 'Intento de reversión de culminada', resolutionNumber: 'RES-2026-004' });
    expect(res.status).toBe(400);

    // Restore to REPROBADO-equivalent for subsequent tests is not needed; afterAll restores.
  });

  it('400 — RETIRADO practice cannot be reversed', async () => {
    const { error: setErr } = await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.RETIRADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);
    expect(setErr, 'status flip to RETIRADO').toBeNull();

    const res = await agent
      .post(ENDPOINT(borrowedPracticeId!))
      .send({ reason: 'Intento de reversión de retirada', resolutionNumber: 'RES-2026-005' });
    expect(res.status).toBe(400);
  });
});
