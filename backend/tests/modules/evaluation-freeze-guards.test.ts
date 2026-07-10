import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { PRACTICES_STATUS } from '../../src/constants/practice-status.constants.js';

// Integration tests for evaluation freeze guards (Slice A).
// Live DB required (borrows an existing practice row and flips its status).
// Tests assertInscribed helper: freeze/unfreeze rejects non-INSCRITO states with 400.

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
      '[freeze-guards-test] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — live DB required for this integration test'
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
  if (borrowedPracticeId !== null && originalStatus !== null) {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: originalStatus })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);
  }
});

describe('freezeEvaluations — assertInscribed guard (Part 1)', () => {
  it('400 — REPROBADO practice rejected by freezeEvaluations', async () => {
    expect(borrowedPracticeId).toBeGreaterThan(0);

    // Flip to REPROBADO
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent
      .post('/api/evaluations/freeze')
      .send({ practiceIds: [borrowedPracticeId] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — RETIRADO practice rejected by freezeEvaluations', async () => {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.RETIRADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent
      .post('/api/evaluations/freeze')
      .send({ practiceIds: [borrowedPracticeId] });

    expect(res.status).toBe(400);
  });

  it('400 — CULMINADO practice rejected by freezeEvaluations', async () => {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent
      .post('/api/evaluations/freeze')
      .send({ practiceIds: [borrowedPracticeId] });

    expect(res.status).toBe(400);
  });

  it('400 — PRE_INSCRITO practice rejected by freezeEvaluations', async () => {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.PRE_INSCRITO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent
      .post('/api/evaluations/freeze')
      .send({ practiceIds: [borrowedPracticeId] });

    expect(res.status).toBe(400);
  });

  it('2xx — INSCRITO practice passes freezeEvaluations', async () => {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    // The endpoint may return 200 or 400 if no unfrozen evaluations exist.
    // We just assert it does NOT return 400 due to status guard.
    const res = await agent
      .post('/api/evaluations/freeze')
      .send({ practiceIds: [borrowedPracticeId] });

    // It should NOT be 400 "Solo se permite la operación sobre prácticas en estado Inscrito"
    // It may be 400 "No hay evaluaciones para congelar" or 200, both are acceptable.
    if (res.status === 400) {
      expect(res.body.message).not.toContain('estado Inscrito');
    } else {
      expect(res.status).toBe(200);
    }
  });
});

describe('unfreezePracticeEvaluations — assertInscribed guard (Part 2)', () => {
  it('400 — CULMINADO practice rejected by unfreezePracticeEvaluations', async () => {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent
      .post('/api/evaluations/unfreeze-practice')
      .send({ practiceId: borrowedPracticeId, reason: 'Motivo de prueba con diez caracteres' });

    expect(res.status).toBe(400);
  });

  it('400 — REPROBADO practice rejected by unfreezePracticeEvaluations', async () => {
    await supabase
      .from('t_professional_practices')
      .update({ PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    const res = await agent
      .post('/api/evaluations/unfreeze-practice')
      .send({ practiceId: borrowedPracticeId, reason: 'Motivo de prueba con diez caracteres' });

    expect(res.status).toBe(400);
  });
});
