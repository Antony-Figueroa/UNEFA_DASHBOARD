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

import { resolveDatesFromRecord } from '../../src/services/period-type-dates.service.js';
import { dbManager } from '../../src/lib/db-manager.js';

// ============================================================
// UNIT: resolveDatesFromRecord pure function — Task 6.1
// ============================================================

describe('resolveDatesFromRecord() — unit tests (no DB)', () => {
  const periodDates = { START_DATE: '2026-03-01', END_DATE: '2026-07-31' };

  it('should return period dates when typeRecord is null', () => {
    const result = resolveDatesFromRecord(null, periodDates);
    expect(result).toEqual(periodDates);
  });

  it('should return period dates when typeRecord is undefined', () => {
    const result = resolveDatesFromRecord(undefined, periodDates);
    expect(result).toEqual(periodDates);
  });

  it('should return type-specific dates when both are non-null', () => {
    const typeRecord = { START_DATE: '2026-03-16', END_DATE: '2026-05-08' };
    const result = resolveDatesFromRecord(typeRecord, periodDates);
    expect(result).toEqual({ START_DATE: '2026-03-16', END_DATE: '2026-05-08' });
  });

  it('should fallback START_DATE to period when type START_DATE is null', () => {
    const typeRecord = { START_DATE: null, END_DATE: '2026-05-08' };
    const result = resolveDatesFromRecord(typeRecord, periodDates);
    expect(result).toEqual({ START_DATE: '2026-03-01', END_DATE: '2026-05-08' });
  });

  it('should fallback END_DATE to period when type END_DATE is null', () => {
    const typeRecord = { START_DATE: '2026-03-16', END_DATE: null };
    const result = resolveDatesFromRecord(typeRecord, periodDates);
    expect(result).toEqual({ START_DATE: '2026-03-16', END_DATE: '2026-07-31' });
  });

  it('should return full period dates when both type fields are null', () => {
    const typeRecord = { START_DATE: null, END_DATE: null };
    const result = resolveDatesFromRecord(typeRecord, periodDates);
    expect(result).toEqual(periodDates);
  });

  it('should work with partial period dates (edge case: both type dates empty strings)', () => {
    // Empty strings should NOT fallback — they are not null/undefined per ?? operator
    const typeRecord = { START_DATE: '', END_DATE: '' };
    const result = resolveDatesFromRecord(typeRecord, periodDates);
    expect(result).toEqual({ START_DATE: '', END_DATE: '' });
  });
});

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

  // ============================================================
  // E2E: Full flow — create period → type dates → pre-enroll → enroll (Task 6.5)
  // ============================================================

  describe('E2E full flow (acceptance criteria)', () => {
    let e2ePersonId: number;
    let e2eStudentId: number;
    let e2ePracticeId: number | null = null;
    const e2eTypeId = 1; // ÚNICA (exists in seed data)
    const e2eCiSuffix = String(Date.now()).slice(-7);
    const e2eCi = `V-E2E-${e2eCiSuffix}`;

    beforeAll(async () => {
      const now = new Date().toISOString();

      const personResult = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_persons')
          .insert({
            ci: e2eCi,
            first_name: 'E2E',
            last_name: 'TestStudent',
            email: `e2e.${Date.now()}@test.unefa.edu.ve`,
            gender: 'M',
            status: 1,
          })
          .select('person_id')
          .single();
        if (error) throw error;
        return data;
      }, 'e2e:createPerson');
      e2ePersonId = personResult.person_id;

      const studentResult = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_students')
          .insert({
            person_id: e2ePersonId,
            STUDENT_TYPE: 'CIVIL',
            MILITARY_RANK: null,
            EMPLOYMENT: 'NO',
            STATUS: 1,
            REGISTRATION_DATE: now.slice(0, 19).replace('T', ' '),
          })
          .select('STUDENTS_ID')
          .single();
        if (error) throw error;
        return data;
      }, 'e2e:createStudent');
      e2eStudentId = studentResult.STUDENTS_ID;
    });

    afterAll(async () => {
      await dbManager.withRetry(async (supabase) => {
        if (e2ePracticeId) {
          await supabase.from('t_professional_practices').delete().eq('PROFESSIONAL_PRACTICE_ID', e2ePracticeId);
        }
        await supabase.from('t_students').delete().eq('STUDENTS_ID', e2eStudentId);
        await supabase.from('t_persons').delete().eq('person_id', e2ePersonId);
      }, 'e2e:cleanup');
    });

    it('should create type dates and verify period endpoint includes them', async () => {
      const typeRes = await agent.post('/api/period-type-dates').send({
        periodId: testPeriodId,
        internshipTypeId: e2eTypeId,
        startDate: '2026-04-01',
        endDate: '2026-06-30',
      });
      expect([200, 201]).toContain(typeRes.status);

      const periodRes = await agent.get(`/api/periodos/${testPeriodId}`);
      expect(periodRes.status).toBe(200);
      const typeDates = periodRes.body.typeDates || [];
      const match = typeDates.find((td: any) => td.INTERNSHIP_TYPE_ID === e2eTypeId);
      expect(match).toBeDefined();
      expect(match.START_DATE).toContain('2026-04-01');
      expect(match.END_DATE).toContain('2026-06-30');
    });

    it('should pre-enroll with internshipTypeId through type-date-aware middleware', async () => {
      // CI = V-E2E-<suffix>, so identificationPrefix=V, identificationNumber=E2E-<suffix>
      const preEnrollRes = await agent.post('/api/pre-enrollments').send({
        identificationPrefix: 'V',
        identificationNumber: `E2E-${e2eCiSuffix}`,
        studentName: 'E2E TestStudent',
        phone: '04120000000',
        period: '2025-I',
        practiceType: 'ÚNICA',
        internshipTypeId: e2eTypeId,
        enrollmentCode: `E2E-${Date.now()}`,
        careerId: '4',
        semester: '04',
        section: '01',
        regime: 'DIURNO',
        careerName: 'INGENIERIA INFORMATICA',
      });

      // Validate the middleware ran — should NOT get a crash (500) or
      // DATE_OUTSIDE_PERIOD error. If the period '2025-I' is not active,
      // it will return PERIOD_NOT_ACTIVE which is expected.
      expect(preEnrollRes.status).not.toBe(500);
      if (preEnrollRes.body?.code) {
        expect(preEnrollRes.body.code).not.toBe('DATE_OUTSIDE_PERIOD');
      }
      if (preEnrollRes.status === 201) {
        e2ePracticeId = preEnrollRes.body.preEnrollmentId || null;
      }
    });

    it('should route enrollment create through type-date-aware middleware without crash', async () => {
      const enrollRes = await agent.post('/api/enrollments').send({
        identificationPrefix: 'V',
        identificationNumber: `E2E-${e2eCiSuffix}`,
        studentName: 'E2E TestStudent',
        period: '2025-I',
        practiceType: 'ÚNICA',
        academicTutorId: '',
        methodologicalTutorId: '',
        institutionId: '',
        institutionResponsibleId: '',
      });

      // The enrollment validation middleware should run without 500 crash.
      // Since we created the test student, the middleware should find the
      // person and pre-enrollment record, resolve dates, and then fail
      // validation (missing tutors/institution) with a 400.
      expect(enrollRes.status).not.toBe(500);
    });
  });
});
