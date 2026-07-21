/**
 * @file grace-config-integration.test.ts
 * @description Integration tests for practice sequence override endpoints.
 *
 * Tasks 5.7–5.9:
 *   5.7 — PUT /api/academic-config/enforce-sequential with valid password → 200
 *   5.8 — PUT /api/academic-config/enforce-sequential with wrong password → 400
 *   5.9 — GET /api/academic-config/defaults returns enforceSequentialOrder field
 *
 * Requires live Supabase DB + authenticated test user (globalSetup).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';

// Skip entire suite when live DB credentials are missing (CI without Supabase, local dev)
const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let agent: request.Agent;
let originalToggleState: number | null = null;

beforeAll(async () => {
  if (!hasDb) return;
  agent = await createAuthenticatedAgent(app);

  // Capture original toggle state so we can restore it after tests
  const getRes = await agent.get('/api/academic-config/defaults');
  if (getRes.status === 200 && getRes.body.enforceSequentialOrder !== undefined) {
    originalToggleState = getRes.body.enforceSequentialOrder ? 1 : 0;
  }
});

afterAll(async () => {
  if (!hasDb || originalToggleState === null) return;
  // Restore original toggle state if we changed it
  await agent
    .put('/api/academic-config/enforce-sequential')
    .send({
      enforceSequentialOrder: originalToggleState === 1,
      password: process.env.TEST_USER_PASS || 'TestAdmin123!',
    });
});

// ═══════════════════════════════════════════════════════════════════
// 5.7: PUT /api/academic-config/enforce-sequential — valid password
// ═══════════════════════════════════════════════════════════════════

describe('5.7: PUT /api/academic-config/enforce-sequential — valid password', () => {
  it('should return 200 with enforceSequentialOrder in response when password is correct', async () => {
    const testPassword = process.env.TEST_USER_PASS || 'TestAdmin123!';

    const res = await agent
      .put('/api/academic-config/enforce-sequential')
      .send({
        enforceSequentialOrder: false,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('enforceSequentialOrder', false);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 200 when toggling back to true with valid password', async () => {
    const testPassword = process.env.TEST_USER_PASS || 'TestAdmin123!';

    const res = await agent
      .put('/api/academic-config/enforce-sequential')
      .send({
        enforceSequentialOrder: true,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('enforceSequentialOrder', true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5.8: PUT /api/academic-config/enforce-sequential — wrong password
// ═══════════════════════════════════════════════════════════════════

describe('5.8: PUT /api/academic-config/enforce-sequential — wrong password', () => {
  it('should return 400 with INVALID_PASSWORD code when password is incorrect', async () => {
    const res = await agent
      .put('/api/academic-config/enforce-sequential')
      .send({
        enforceSequentialOrder: false,
        password: 'DefinitelyWrongPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code', 'INVALID_PASSWORD');
    expect(res.body).toHaveProperty('message');
  });

  it('should return 400 when password field is missing', async () => {
    const res = await agent
      .put('/api/academic-config/enforce-sequential')
      .send({
        enforceSequentialOrder: false,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code', 'MISSING_PASSWORD');
  });

  it('should return 400 when enforceSequentialOrder is not a boolean', async () => {
    const testPassword = process.env.TEST_USER_PASS || 'TestAdmin123!';

    const res = await agent
      .put('/api/academic-config/enforce-sequential')
      .send({
        enforceSequentialOrder: 'not-a-boolean',
        password: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code', 'INVALID_VALUE');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5.9: GET /api/academic-config/defaults — enforceSequentialOrder
// ═══════════════════════════════════════════════════════════════════

describe('5.9: GET /api/academic-config/defaults — enforceSequentialOrder field', () => {
  it('should return enforceSequentialOrder as a boolean in the response', async () => {
    const res = await agent.get('/api/academic-config/defaults');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('enforceSequentialOrder');
    expect(typeof res.body.enforceSequentialOrder).toBe('boolean');
  });

  it('should return default grace days fields alongside enforceSequentialOrder', async () => {
    const res = await agent.get('/api/academic-config/defaults');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('defaultEnrollmentGraceDays');
    expect(res.body).toHaveProperty('defaultEvaluationGraceDays');
    expect(res.body).toHaveProperty('enforceSequentialOrder');
  });

  it('should reflect the value set via PUT after toggling', async () => {
    const testPassword = process.env.TEST_USER_PASS || 'TestAdmin123!';

    // Set to false
    await agent
      .put('/api/academic-config/enforce-sequential')
      .send({ enforceSequentialOrder: false, password: testPassword });

    const getRes = await agent.get('/api/academic-config/defaults');
    expect(getRes.body.enforceSequentialOrder).toBe(false);

    // Set back to true
    await agent
      .put('/api/academic-config/enforce-sequential')
      .send({ enforceSequentialOrder: true, password: testPassword });

    const getRes2 = await agent.get('/api/academic-config/defaults');
    expect(getRes2.body.enforceSequentialOrder).toBe(true);
  });
});
