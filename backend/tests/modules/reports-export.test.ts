/**
 * Tests de integración — Exportación Excel de Reportes (Task 1.1, 1.2)
 *
 * Prueba el endpoint GET /api/reports/export/:type y la generación de workbook ExcelJS.
 *
 * Dependencias:
 *   1. globalSetup creó el usuario maestro (V-TEST-ADMIN)
 *   2. Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   3. ExcelJS disponible en package.json
 */

import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';
import ExcelJS from 'exceljs';

describe('Reports Export API — GET /api/reports/export/:type', () => {
  let agent: request.Agent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent(app);
  });

  // ============================================================
  // Task 1.1 / 1.2: exportReportExcel + route
  // ============================================================

  describe('exportReportExcel (Tasks 1.1, 1.2)', () => {
    it('GET /api/reports/export/tutores-academicos returns 200 with Excel buffer', async () => {
      const res = await agent
        .get('/api/reports/export/tutores-academicos')
        .query({ periodId: 1 })
        .buffer(true)
        .parse((res: any, callback: any) => {
          let data = Buffer.alloc(0);
          res.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
          res.on('end', () => callback(null, data));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');

      // Verify it's a valid Excel workbook
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.body as Buffer);
      expect(workbook.worksheets.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/reports/export/resumen-pasantias generates workbook with at least one sheet', async () => {
      const res = await agent
        .get('/api/reports/export/resumen-pasantias')
        .query({ periodId: 1 })
        .buffer(true)
        .parse((res: any, callback: any) => {
          let data = Buffer.alloc(0);
          res.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
          res.on('end', () => callback(null, data));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');

      // Verificar que el buffer es un workbook ExcelJS válido
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.body as Buffer);
      expect(workbook.worksheets.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/reports/export/distribucion-tutores returns 200 with Excel buffer', async () => {
      const res = await agent
        .get('/api/reports/export/distribucion-tutores')
        .query({ periodId: 1 })
        .buffer(true)
        .parse((res: any, callback: any) => {
          let data = Buffer.alloc(0);
          res.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
          res.on('end', () => callback(null, data));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.body as Buffer);
      expect(workbook.worksheets.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/reports/export/relacion-individual-docente with tutorId works or returns appropriate status', async () => {
      const res = await agent
        .get('/api/reports/export/relacion-individual-docente')
        .query({ periodId: 1, tutorId: 1 })
        .buffer(true)
        .parse((res: any, callback: any) => {
          let data = Buffer.alloc(0);
          res.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
          res.on('end', () => callback(null, data));
        });

      // The endpoint should return either 200 (tutor exists and data found),
      // 404 (tutor not found), or 400 (no tutorId)
      expect([200, 400, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.headers['content-type']).toContain('spreadsheetml');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(res.body as Buffer);
        expect(workbook.worksheets.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('GET /api/reports/export/tipo-invalido returns 400', async () => {
      const res = await agent
        .get('/api/reports/export/tipo-invalido')
        .query({ periodId: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('inválido');
    });
  });
});
