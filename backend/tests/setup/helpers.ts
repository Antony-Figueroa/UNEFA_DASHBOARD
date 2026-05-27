/**
 * Helpers compartidos para tests de integración.
 *
 * Proporciona:
 *   - createAuthenticatedAgent(): supertest agent con cookie JWT
 *   - TestDataBuilder: crea data de prueba con CI/email únicos
 *   - TEST_CONSTANTS: valores reutilizables
 */

import request from 'supertest';
import type { Express } from 'express';

// ============================================================
// CONSTANTES
// ============================================================

export const TEST_CONSTANTS = {
  /** CI del usuario maestro creado en globalSetup (varchar(10)) */
  MASTER_CI: process.env.TEST_USER_CI || 'V-TESTADM',
  /** Password del usuario maestro */
  MASTER_PASS: process.env.TEST_USER_PASS || 'TestAdmin123!',
} as const;

// ============================================================
// AUTH HELPER
// ============================================================

/**
 * Crea un agente de supertest autenticado con el usuario maestro.
 *
 * El agente mantiene la cookie `auth_token` entre requests,
 * por lo que todas las requests subsecuentes están autenticadas.
 */
export async function createAuthenticatedAgent(
  app: Express
): Promise<request.Agent> {
  const agent = request.agent(app);

  const res = await agent
    .post('/api/auth/login')
    .send({
      userCi: TEST_CONSTANTS.MASTER_CI,
      password: TEST_CONSTANTS.MASTER_PASS,
    });

  if (res.status !== 200) {
    throw new Error(
      `[TestHelper] Login failed (${res.status}): ${JSON.stringify(res.body)}`
    );
  }

  return agent;
}

// ============================================================
// TEST DATA BUILDER
// ============================================================

// Contador para IDs únicos de prueba. Arranca desde un número semi-aleatorio
// basado en timestamp para no colisionar con datos de runs anteriores.
// CI final = "{prefix}-{number}" ≤ 10 chars → number ≤ 8 chars.
const COUNTER_SEED = 10000000 + (Date.now() % 10000000);
let counter = COUNTER_SEED;

/**
 * Genera data de prueba para un estudiante con valores únicos.
 * Usá esto en cada test para evitar colisiones de CI/email.
 *
 * NOTA: CI final = "V-{identificationNumber}" debe ser ≤ 10 chars.
 *       El identificationNumber se trunca a 8 chars máximo.
 */
export function buildTestStudentData(overrides: Record<string, unknown> = {}) {
  const uniqueId = String(counter++);
  const shortId = uniqueId.slice(-8); // máximo 8 dígitos para la CI
  return {
    identificationPrefix: 'V',
    identificationNumber: shortId,
    firstName: 'Test',
    middleName: null,
    lastName: `Est_${shortId}`,
    secondLastName: null,
    sex: 'MASCULINO',
    birthDate: '2000-01-15',
    civilStatus: 'SOLTERO',
    phone: '04121234567',
    email: `test.est${shortId}@unefa.edu.ve`,
    address: 'Dirección de prueba',
    studentType: 'CIVIL',
    militaryRank: null,
    works: 'NO',
    ...overrides,
  } as const;
}

// ============================================================
// CLEANUP HELPER
// ============================================================

/**
 * Elimina un estudiante de prueba por studentId.
 * Retorna true si se eliminó, false si no existía.
 */
export async function deleteTestStudent(
  agent: request.Agent,
  studentId: number
): Promise<boolean> {
  const res = await agent.delete(`/api/students/${studentId}`);
  return res.status === 200;
}
