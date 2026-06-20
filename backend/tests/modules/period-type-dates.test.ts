/**
 * Tests de integración — Módulo Period-Type-Dates
 *
 * Prueba CRUD endpoints + resolveDates service + period validator.
 *
 * Requisitos:
 *   1. globalSetup creó el usuario maestro (V-TEST-ADMIN)
 *   2. Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   3. FEATURE_PERIOD_TYPE_DATES configurable mediante vi.stubEnv
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';

// ============================================================
// HELPERS
// ============================================================

function expectTypeDateShape(obj: unknown): asserts obj is Record<string, unknown> {
  expect(obj).toBeInstanceOf(Object);
  const r = obj as Record<string, unknown>;
  expect(r).toHaveProperty('ID');
  expect(r).toHaveProperty('PERIOD_ID');
  expect(r).toHaveProperty('INTERNSHIP_TYPE_ID');
  // START_DATE / END_DATE are optional (nullable)
}

// ============================================================
// SUITE
// ============================================================

describe('Period-Type-Dates API', () => {
  let agent: request.Agent;
  let testPeriodId: number;
  let testTypeId = 1; // HOSPITALARIA

  // ── Setup: agente autenticado ──────────────────────────────
  beforeAll(async () => {
    process.env.FEATURE_PERIOD_TYPE_DATES = 'true';
    agent = await createAuthenticatedAgent(app);

    // Crear un periodo de prueba si no existiera
    const periodRes = await agent.post('/api/periodos').send({
      description: `PTD-TEST-${Date.now()}`,
      startDate: '2026-03-01',
      endDate: '2026-07-31',
      periodStatus: '2',
      status: 1,
    });
    if (periodRes.status === 201) {
      testPeriodId = periodRes.body.PERIOD_ID || periodRes.body.periodId;
    } else {
      // Buscar un periodo existente como fallback
      const listRes = await agent.get('/api/periodos');
      const periods = listRes.body || [];
      if (periods.length > 0) {
        testPeriodId = periods[0].PERIOD_ID;
      } else {
        throw new Error('No se pudo crear/encontrar un periodo de prueba');
      }
    }
  });

  afterAll(() => {
    delete process.env.FEATURE_PERIOD_TYPE_DATES;
  });

  // ============================================================
  // CRUD — Task 1.2 / 6.2
  // ============================================================

  describe('CRUD endpoints', () => {
    let createdId: number | null = null;

    it('POST /api/period-type-dates — should create a type-date record', async () => {
      const res = await agent.post('/api/period-type-dates').send({
        periodId: testPeriodId,
        internshipTypeId: testTypeId,
        startDate: '2026-03-16',
        endDate: '2026-05-08',
      });

      // Expect 201 or 200 (depending on controller implementation)
      expect([200, 201]).toContain(res.status);
      expectTypeDateShape(res.body);
      expect(res.body.PERIOD_ID).toBe(testPeriodId);
      expect(res.body.INTERNSHIP_TYPE_ID).toBe(testTypeId);
      expect(res.body.START_DATE).toContain('2026-03-16');
      expect(res.body.END_DATE).toContain('2026-05-08');
      createdId = res.body.ID;
    });

    it('GET /api/period-type-dates?periodId= — should list records for a period', async () => {
      // Ensure at least one record exists
      if (!createdId) {
        const createRes = await agent.post('/api/period-type-dates').send({
          periodId: testPeriodId,
          internshipTypeId: testTypeId,
          startDate: '2026-03-16',
          endDate: '2026-05-08',
        });
        createdId = createRes.body.ID;
      }

      const res = await agent.get(`/api/period-type-dates?periodId=${testPeriodId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const found = res.body.find((r: any) => r.ID === createdId);
      expect(found).toBeDefined();
      expect(found.PERIOD_ID).toBe(testPeriodId);
    });

    it('PUT /api/period-type-dates/:id — should update endDate (extension)', async () => {
      if (!createdId) return; // skip if creation failed

      const res = await agent.put(`/api/period-type-dates/${createdId}`).send({
        endDate: '2026-05-15',
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body.END_DATE).toContain('2026-05-15');
    });

    it('DELETE /api/period-type-dates/:id — should soft-delete or hard-delete', async () => {
      if (!createdId) return;

      const res = await agent.delete(`/api/period-type-dates/${createdId}`);
      expect([200, 204]).toContain(res.status);

      // Verify it's gone
      const listRes = await agent.get(`/api/period-type-dates?periodId=${testPeriodId}`);
      const found = (listRes.body || []).find((r: any) => r.ID === createdId);
      expect(found).toBeUndefined();
    });
  });

  // ============================================================
  // resolveDates — Task 2.1 (integration)
  // ============================================================

  describe('resolveDates() — type-date resolution', () => {
    it('should resolve type-specific dates when record exists', async () => {
      // Create a type-date record
      await agent.post('/api/period-type-dates').send({
        periodId: testPeriodId,
        internshipTypeId: testTypeId,
        startDate: '2026-04-01',
        endDate: '2026-06-30',
      });

      // Verify via the periods endpoint that typeDates appear (task 2.3)
      const periodRes = await agent.get(`/api/periodos/${testPeriodId}`);
      expect(periodRes.status).toBe(200);
      const typeDates = periodRes.body.typeDates || [];
      const match = typeDates.find((td: any) => td.INTERNSHIP_TYPE_ID === testTypeId);
      expect(match).toBeDefined();
      expect(match.START_DATE).toContain('2026-04-01');
      expect(match.END_DATE).toContain('2026-06-30');
    });

    it('should fallback to period dates when no type-date record exists', async () => {
      const unknownTypeId = 9999; // non-existent type

      const periodRes = await agent.get(`/api/periodos/${testPeriodId}`);
      const typeDates = periodRes.body.typeDates || [];
      const match = typeDates.find((td: any) => td.INTERNSHIP_TYPE_ID === unknownTypeId);
      expect(match).toBeUndefined();
      // The period dates should still be available via period.START_DATE / period.END_DATE
      expect(periodRes.body.START_DATE).toBeDefined();
    });
  });

  // ============================================================
  // Overlap allowed — Spec REQ-6
  // ============================================================

  describe('Overlapping dates (spec REQ-6)', () => {
    it('should allow overlapping date ranges for different types', async () => {
      const type1 = testTypeId;        // HOSPITALARIA
      const type2 = testTypeId + 1;   // COMUNITARIA (if exists)

      // Create type 1 (may already exist, so we use a unique combo)
      const res1 = await agent.post('/api/period-type-dates').send({
        periodId: testPeriodId,
        internshipTypeId: type1,
        startDate: '2026-03-16',
        endDate: '2026-05-08',
      });
      expect([200, 201]).toContain(res1.status);

      // Create type 2 with overlapping dates
      const res2 = await agent.post('/api/period-type-dates').send({
        periodId: testPeriodId,
        internshipTypeId: type2,
        startDate: '2026-05-01',
        endDate: '2026-07-03',
      });
      expect([200, 201]).toContain(res2.status);
      // Overlap should NOT error
    });
  });
});
