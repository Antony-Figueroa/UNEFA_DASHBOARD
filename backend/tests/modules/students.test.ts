/**
 * Tests de integración — Módulo Estudiantes
 *
 * Prueba TODOS los endpoints CRUD del módulo estudiantes contra
 * la base de datos real (Supabase).
 *
 * Requisitos:
 *   1. globalSetup creó el usuario maestro (V-TEST-ADMIN)
 *   2. Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *
 * Convenciones:
 *   - Cada test usa data única (buildTestStudentData) para no colisionar
 *   - Cleanup al final de cada describe que crea data
 *   - Se prueba contra la BD real — si la BD falla, los tests fallan
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import {
  createAuthenticatedAgent,
  buildTestStudentData,
} from '../setup/helpers.js';
import request from 'supertest';

// ============================================================
// HELPERS DE ASERCION
// ============================================================

function expectStudentShape(obj: unknown): asserts obj is Record<string, unknown> {
  expect(obj).toBeInstanceOf(Object);
  const s = obj as Record<string, unknown>;
  expect(s).toHaveProperty('studentId');
  expect(s).toHaveProperty('identificationPrefix');
  expect(s).toHaveProperty('identificationNumber');
  expect(s).toHaveProperty('firstName');
  expect(s).toHaveProperty('lastName');
  expect(s).toHaveProperty('email');
  expect(s).toHaveProperty('sex');
  expect(s).toHaveProperty('studentType');
  expect(s).toHaveProperty('works');
  expect(s).toHaveProperty('status');
  expect(s).toHaveProperty('enrollmentDate');
}

// ============================================================
// SUITE
// ============================================================

describe('Students API', () => {
  let agent: request.Agent;

  // ── Setup: agente autenticado ──────────────────────────────
  beforeAll(async () => {
    agent = await createAuthenticatedAgent(app);
  });

  // ──────────────────────────────────────────────────────────
  // AUTH GUARD
  // ──────────────────────────────────────────────────────────
  describe('Auth Guard', () => {
    it('debería rechazar request sin token (401)', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────
  describe('POST /api/students — Crear estudiante', () => {
    let createdStudentId: number | null = null;

    afterAll(async () => {
      if (createdStudentId) {
        await agent.delete(`/api/students/${createdStudentId}`);
      }
    });

    it('debería crear un estudiante con data válida (201)', async () => {
      const data = buildTestStudentData();
      const res = await agent.post('/api/students').send(data);

      expect(res.status).toBe(201);
      expectStudentShape(res.body);

      const student = res.body;
      expect(student.firstName).toBe(data.firstName.toUpperCase());
      expect(student.lastName).toBe(data.lastName.toUpperCase());
      expect(student.email).toBe(data.email);
      expect(student.identificationPrefix).toBe(data.identificationPrefix);
      expect(student.identificationNumber).toBe(data.identificationNumber);
      expect(student.sex).toBe(data.sex);
      expect(student.studentType).toBe(data.studentType);
      expect(student.works).toBe(data.works);
      expect(student.status).toBe(true); // status por defecto = activo

      createdStudentId = Number(student.studentId);
    });

    it('debería rechazar creación sin campos requeridos (400)', async () => {
      const res = await agent.post('/api/students').send({});

      expect(res.status).toBe(400);
      // El body debería tener un mensaje de error
      expect(res.body).toBeInstanceOf(Object);
    });

    it('debería rechazar creación con email inválido (400)', async () => {
      const data = buildTestStudentData({ email: 'invalido' });
      const res = await agent.post('/api/students').send(data);

      expect(res.status).toBe(400);
    });

    it('debería rechazar creación con cédula duplicada (409)', async () => {
      // Crear primer estudiante
      const data = buildTestStudentData();
      const createRes = await agent.post('/api/students').send(data);
      expect(createRes.status).toBe(201);
      const firstId = createRes.body.studentId;

      // Intentar crear otro con la misma CI → 409 Conflict
      const duplicateRes = await agent.post('/api/students').send(data);
      expect(duplicateRes.status).toBe(409);

      // Limpiar
      await agent.delete(`/api/students/${firstId}`);
    });
  });

  // ──────────────────────────────────────────────────────────
  // LIST / READ
  // ──────────────────────────────────────────────────────────
  describe('GET /api/students — Listar estudiantes', () => {
    it('debería retornar lista paginada (200)', async () => {
      // Usamos sortField explícito para verificar ordenamiento funciona
      const res = await agent.get('/api/students?sortField=STUDENTS_ID&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data)).toBe(true);

      // Si hay datos, verificar forma
      if (res.body.data.length > 0) {
        expectStudentShape(res.body.data[0]);
      }
    });

    it('debería filtrar por estado activo', async () => {
      const res = await agent.get('/api/students?status=true&sortField=STUDENTS_ID');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('debería buscar por texto', async () => {
      // Crear un estudiante con nombre único para buscar
      const uniqueName = `Busqueda${Date.now()}`;
      const data = buildTestStudentData({ firstName: uniqueName });
      const createRes = await agent.post('/api/students').send(data);
      expect(createRes.status).toBe(201);
      const studentId = createRes.body.studentId;

      // Buscar por el nombre único
      const searchRes = await agent.get(`/api/students?search=${uniqueName}&sortField=STUDENTS_ID`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.body.data.some(
        (s: Record<string, unknown>) => s.firstName === uniqueName.toUpperCase()
      )).toBe(true);

      // Limpiar
      await agent.delete(`/api/students/${studentId}`);
    });
  });

  describe('GET /api/students/:id — Obtener por ID', () => {
    let studentId: number | null = null;

    beforeAll(async () => {
      // Crear estudiante para las pruebas de lectura
      const data = buildTestStudentData();
      const res = await agent.post('/api/students').send(data);
      expect(res.status).toBe(201);
      studentId = Number(res.body.studentId);
    });

    afterAll(async () => {
      if (studentId) {
        await agent.delete(`/api/students/${studentId}`);
      }
    });

    it('debería retornar estudiante por ID (200)', async () => {
      const res = await agent.get(`/api/students/${studentId}`);
      expect(res.status).toBe(200);
      expectStudentShape(res.body);
      expect(Number(res.body.studentId)).toBe(studentId);
    });

    it('debería retornar 404 para ID inexistente', async () => {
      const res = await agent.get('/api/students/99999999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/students/by-ci/:ci — Obtener por CI', () => {
    let createdCi: string | null = null;
    let studentId: number | null = null;

    beforeAll(async () => {
      const data = buildTestStudentData();
      const res = await agent.post('/api/students').send(data);
      expect(res.status).toBe(201);
      studentId = Number(res.body.studentId);
      // Guardar la CI en formato "V-TEST..."
      createdCi = `${data.identificationPrefix}-${data.identificationNumber}`;
    });

    afterAll(async () => {
      if (studentId) {
        await agent.delete(`/api/students/${studentId}`);
      }
    });

    it('debería retornar estudiante por CI (200)', async () => {
      const res = await agent.get(`/api/students/by-ci/${createdCi}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expectStudentShape(res.body.data);
    });

    it('debería retornar 404 para CI inexistente', async () => {
      const res = await agent.get('/api/students/by-ci/V-99999999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/students/stats — Estadísticas', () => {
    it('debería retornar total y activos', async () => {
      const res = await agent.get('/api/students/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('active');
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.active).toBe('number');
    });
  });

  // ──────────────────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────────────────
  describe('PUT /api/students/:id — Actualizar estudiante', () => {
    let studentId: number | null = null;

    beforeAll(async () => {
      const data = buildTestStudentData();
      const res = await agent.post('/api/students').send(data);
      expect(res.status).toBe(201);
      studentId = Number(res.body.studentId);
    });

    afterAll(async () => {
      if (studentId) {
        await agent.delete(`/api/students/${studentId}`);
      }
    });

    it('debería actualizar nombre y apellido (200)', async () => {
      const res = await agent.put(`/api/students/${studentId}`).send({
        ...buildTestStudentData(),
        firstName: 'Actualizado',
        lastName: 'Correctamente',
      });

      expect(res.status).toBe(200);
      expectStudentShape(res.body);
      expect(res.body.firstName).toBe('Actualizado');
      expect(res.body.lastName).toBe('Correctamente');
    });

    it('debería rechazar actualización con email inválido (400)', async () => {
      const res = await agent.put(`/api/students/${studentId}`).send({
        ...buildTestStudentData(),
        email: 'no-es-un-email',
      });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────
  // TOGGLE STATUS
  // ──────────────────────────────────────────────────────────
  describe('PATCH /api/students/:id/status — Cambiar estado', () => {
    let studentId: number | null = null;

    beforeAll(async () => {
      const data = buildTestStudentData();
      const res = await agent.post('/api/students').send(data);
      expect(res.status).toBe(201);
      studentId = Number(res.body.studentId);
    });

    afterAll(async () => {
      if (studentId) {
        await agent.delete(`/api/students/${studentId}`);
      }
    });

    it('debería desactivar y reactivar el estudiante', async () => {
      // Desactivar
      const deactivateRes = await agent
        .patch(`/api/students/${studentId}/status`)
        .send({ status: false });

      expect(deactivateRes.status).toBe(200);

      // Verificar que está inactivo
      const getRes = await agent.get(`/api/students/${studentId}`);
      expect(getRes.body.status).toBe(false);

      // Reactivar
      const activateRes = await agent
        .patch(`/api/students/${studentId}/status`)
        .send({ status: true });

      expect(activateRes.status).toBe(200);

      // Verificar que está activo
      const getRes2 = await agent.get(`/api/students/${studentId}`);
      expect(getRes2.body.status).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────
  describe('DELETE /api/students/:id — Eliminar estudiante', () => {
    it('debería eliminar un estudiante existente (204)', async () => {
      // Crear estudiante para eliminar
      const data = buildTestStudentData();
      const createRes = await agent.post('/api/students').send(data);
      expect(createRes.status).toBe(201);
      const studentId = createRes.body.studentId;

      // Eliminar (la API retorna 204 No Content — estándar REST)
      const deleteRes = await agent.delete(`/api/students/${studentId}`);
      expect(deleteRes.status).toBe(204);

      // Verificar que ya no existe llamando al GET
      const getRes = await agent.get(`/api/students/${studentId}`);
      expect(getRes.status).toBe(404);
    });

    it('debería retornar 204 (No Content) al eliminar ID inexistente', async () => {
      // DELETE es idempotente — retorna 204 incluso si no existe
      const res = await agent.delete('/api/students/99999999');
      expect(res.status).toBe(204);
    });
  });

  // ──────────────────────────────────────────────────────────
  // CHECK AVAILABILITY
  // ──────────────────────────────────────────────────────────
  describe('GET /api/students/check-availability', () => {
    it('debería retornar disponible para CI nuevo', async () => {
      const res = await agent
        .get('/api/students/check-availability')
        .query({
          type: 'ci',
          value: `V-CHECK${Date.now()}`,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('available');
    });
  });
});
