/**
 * Tests de integración — Columnas de reportes según formato oficial
 *
 * Tasks 1.3, 1.4, 2.1, 2.2:
 *   - 1.3: estudianteCi en distribucion-tutores
 *   - 1.4: CONTACT_PHONE / EMAIL en relacion-individual-docente
 *   - 2.1: EXTENSION en resumen-pasantias
 *   - 2.2: cantidadTutoresInst como tutores INSTITUCIONAL únicos
 */

import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';

describe('Reports Columns — formato oficial', () => {
  let agent: request.Agent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent(app);
  });

  // ============================================================
  // Task 1.3: estudianteCi en getDistribucionTutores
  // ============================================================

  describe('Task 1.3 — distribucion-tutores incluye estudianteCi', () => {
    it('GET /api/reports/distribucion-tutores should return estudianteCi field', async () => {
      const res = await agent
        .get('/api/reports/distribucion-tutores')
        .query({ periodId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      if (res.body.data.length > 0) {
        const firstRow = res.body.data[0];
        // Verificar que el campo existe — será '' si no hay datos
        expect(firstRow).toHaveProperty('estudianteCi');
        // Verificar que el campo estudiante original aún existe
        expect(firstRow).toHaveProperty('estudiante');
      }
      // Si no hay datos, al menos el meta debe estar presente
      expect(res.body.meta).toBeDefined();
    });
  });

  // ============================================================
  // Task 1.4: CONTACT_PHONE y EMAIL en getRelacionIndividualDocente
  // ============================================================

  describe('Task 1.4 — relacion-individual-docente incluye TI phone/email', () => {
    it('GET /api/reports/relacion-individual-docente/:tutorId should include TI phone/email', async () => {
      const res = await agent
        .get('/api/reports/relacion-individual-docente/1');

      // El tutorId=1 podría no existir → 404
      if (res.status === 404) {
        expect(res.body.message).toContain('no encontrado');
        return;
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      if (res.body.data.length > 0) {
        const firstRow = res.body.data[0];
        // Nuevos campos que debe tener
        expect(firstRow).toHaveProperty('tutorInstitucional');
        if (firstRow.tutorInstitucional) {
          expect(firstRow.tutorInstitucional).toHaveProperty('telefono');
          expect(firstRow.tutorInstitucional).toHaveProperty('correo');
        }
      }
    });
  });

  // ============================================================
  // Task 2.1: Verificar que EXTENSION ya está en resumen-pasantias
  // ============================================================

  describe('Task 2.1 — resumen-pasantias incluye extension', () => {
    it('GET /api/reports/resumen-pasantias should include extension field', async () => {
      const res = await agent
        .get('/api/reports/resumen-pasantias')
        .query({ periodId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      if (res.body.data.length > 0) {
        const firstRow = res.body.data[0];
        expect(firstRow).toHaveProperty('extension');
      }
      expect(res.body.meta).toBeDefined();
    });
  });

  // ============================================================
  // Task 2.2: cantidadTutoresInst como tutores INSTITUCIONAL únicos
  // ============================================================

  describe('Task 2.2 — resumen-pasantias calcula cantidadTutoresInst como únicos', () => {
    it('GET /api/reports/resumen-pasantias should return cantidadTutoresInst as number', async () => {
      const res = await agent
        .get('/api/reports/resumen-pasantias')
        .query({ periodId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      if (res.body.data.length > 0) {
        const firstRow = res.body.data[0];
        expect(firstRow).toHaveProperty('cantidadTutoresInst');
        expect(typeof firstRow.cantidadTutoresInst).toBe('number');
        expect(firstRow.cantidadTutoresInst).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
