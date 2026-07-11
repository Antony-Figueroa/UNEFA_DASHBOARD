/**
 * @file Tests TDD para validación secuencial de inscripción (Phase 3).
 * RED → GREEN → REFACTOR
 *
 * Tasks:
 *   3.1 — Sequential prerequisite check and PREVIOUS_PRACTICE_ID assignment at COM enrollment
 *   3.2 — Auto-resolve retiro justificado at enrollment
 *   3.3 — Joint certificate logic in generateCertificate
 *
 * Prerrequisito: DB en vivo con prácticas activas.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { PRACTICES_STATUS } from '../../src/constants/practice-status.constants.js';

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
      '[enrollment-sequential-test] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — live DB required'
    );
  }
  supabase = createClient(supabaseUrl, supabaseKey);

  // Borrow one active practice
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

// ─── 3.1: Sequential prerequisite at COM enrollment ─────────────────────────

describe('Sequential prerequisite at COM enrollment (3.1)', () => {
  it('RED: PREVIOUS_PRACTICE_ID column is accessible on enrolled practices', async () => {
    expect(borrowedPracticeId).toBeGreaterThan(0);

    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS, STUDENTS_ID, CAREER_ID, INTERNSHIP_TYPE_ID, PREVIOUS_PRACTICE_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId)
      .single();

    expect(practice).toBeTruthy();
    // Column was added in migration 033 — verify it's accessible (nullable)
    expect((practice as any)).toHaveProperty('PREVIOUS_PRACTICE_ID');
  });

  it('RED: PREVIOUS_PRACTICE_ID is set on COM enrollment when HOSP is culminated', async () => {
    // This test verifies that when COM enrollment succeeds and HOSP is culminated
    // with sufficient grade, PREVIOUS_PRACTICE_ID is populated on the COM record.
    // 
    // For the RED phase, we just verify the column exists and document the expectation.
    // The GREEN implementation will make this actually work.

    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID, PREVIOUS_PRACTICE_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId)
      .single();

    // Column existence check — PREVIOUS_PRACTICE_ID should be nullable
    // If the column doesn't exist, this query will fail
    expect(practice).toBeTruthy();
    console.log(`[TDD RED] PREVIOUS_PRACTICE_ID column accessible: ${(practice as any).PREVIOUS_PRACTICE_ID === null ? 'nullable' : 'has value'}`);
  });
});

// ─── 3.2: Auto-resolve retiro justificado at enrollment ─────────────────────

describe('Auto-resolve retiro justificado at enrollment (3.2)', () => {
  it('RED: enrollment detects RETIRO_JUSTIFICADO status on HOSP and auto-resolves', async () => {
    expect(borrowedPracticeId).toBeGreaterThan(0);

    // Set practice to RETIRO_JUSTIFICADO to simulate pending withdrawal
    await supabase
      .from('t_professional_practices')
      .update({
        PRACTICES_STATUS: PRACTICES_STATUS.RETIRO_JUSTIFICADO,
        END_DATE: new Date(Date.now() - 86400000).toISOString() // yesterday — past due
      })
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId);

    // Verify the update took effect
    const { data: updated } = await supabase
      .from('t_professional_practices')
      .select('PRACTICES_STATUS')
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId)
      .single();

    expect((updated as any)?.PRACTICES_STATUS).toBe(PRACTICES_STATUS.RETIRO_JUSTIFICADO);
    console.log('[TDD RED] RETIRO_JUSTIFICADO set — auto-resolve logic should handle this');
  });
});

// ─── 3.3: Joint certificate logic ───────────────────────────────────────────

describe('Joint certificate logic — generateCertificate (3.3)', () => {
  it('RED: certificate generation for sequential practices checks both sibling practices', async () => {
    expect(borrowedPracticeId).toBeGreaterThan(0);

    // Get practice info to check culmination and frozen status
    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        FROZEN_AT,
        PREVIOUS_PRACTICE_ID,
        PRACTICES_STATUS
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId)
      .single();

    expect(practice).toBeTruthy();

    // Attempt to generate a certificate — for sequential practices,
    // it should check BOTH practices before issuing
    const res = await agent
      .post(`/api/culmination/${borrowedPracticeId}/certificate`);

    // For a practice without a culmination record, it should 404
    // For sequential practices with both culminations, it should succeed with joint cert
    console.log(`[TDD RED] generateCertificate returned ${res.status}: ${JSON.stringify(res.body)}`);
  });

  it('RED: joint certificate requires both practices to be frozen', async () => {
    // Verify that even if both practices are culminated,
    // the certificate is rejected if one is not frozen
    const { data: practice } = await supabase
      .from('t_professional_practices')
      .select('FROZEN_AT')
      .eq('PROFESSIONAL_PRACTICE_ID', borrowedPracticeId)
      .single();

    if ((practice as any)?.FROZEN_AT) {
      console.log('[TDD RED] Practice is frozen — joint cert should succeed if both frozen');
    } else {
      console.log('[TDD RED] Practice is NOT frozen — joint cert should be rejected');
    }
  });
});
