/**
 * Tests for Relación de Instituciones que Solicitan Asignación de Pasantes
 * Phase 4: Testing — unit, integration, E2E
 */

import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/app.js';
import { createAuthenticatedAgent } from '../setup/helpers.js';
import request from 'supertest';
import ExcelJS, { Workbook } from 'exceljs';
import { generateRelacionInstitucionesSolicitanWorkbook } from '../../src/services/excel-export.service.js';
import type { RelacionInstitucionesExcelRow } from '../../src/services/excel-export.service.js';

// ============================================================
// Section A: Unit tests — Excel workbook formatting
// ============================================================

describe('generateRelacionInstitucionesSolicitanWorkbook — Unit Tests', () => {
  it('generates workbook with 8 columns and correct headers', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas, Contaduría',
        cantidadEstudiantes: 5,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    expect(workbook).toBeInstanceOf(Workbook);
    expect(workbook.worksheets.length).toBe(1);

    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe('RELACIÓN');

    // Verify headers in row 6
    const headerRow = sheet.getRow(6);
    const expectedHeaders = [
      'REGIÓN',
      'NÚCLEO',
      'EXTENSIÓN',
      'NOMBRE DE LA\nEMPRESA O INSTITUCIÓN',
      'RIF',
      'TIPO DE\nEMPRESA',
      'CARRERAS',
      'CANTIDAD DE\nESTUDIANTES',
    ];

    expectedHeaders.forEach((header, idx) => {
      expect(String(headerRow.getCell(idx + 1).value)).toBe(header);
    });
  });

  it('generates empty workbook with "Sin Datos" sheet when no rows', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [];
    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    
    expect(workbook.worksheets.length).toBe(1);
    expect(workbook.worksheets[0].name).toBe('Sin Datos');
  });

  it('applies institutional formatting (blue header, thin borders)', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        tipoEmpresa: 'PRIVADA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Verify header row has blue background (#8DB3E2)
    const headerRow = sheet.getRow(6);
    const headerCell = headerRow.getCell(1);
    expect(headerCell.fill?.fgColor?.argb).toBe('FF8DB3E2');

    // Verify data row has thin borders
    const dataRow = sheet.getRow(7);
    const dataCell = dataRow.getCell(1);
    expect(dataCell.border?.top?.style).toBe('thin');
    expect(dataCell.border?.bottom?.style).toBe('thin');
    expect(dataCell.border?.left?.style).toBe('thin');
    expect(dataCell.border?.right?.style).toBe('thin');
  });

  it('shows region in every data row (no merge)', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa 1',
        rif: 'J-12345678-9',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa 2',
        rif: 'J-98765432-1',
        tipoEmpresa: 'PRIVADA',
        carreras: 'Contaduría',
        cantidadEstudiantes: 2,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Each row should have region independently (no merged cell)
    const row1 = sheet.getRow(7);
    const row2 = sheet.getRow(8);
    expect(String(row1.getCell(1).value)).toBe('REGIÓN CAPITAL');
    expect(String(row2.getCell(1).value)).toBe('REGIÓN CAPITAL');
  });

  it('shows subtotals row with institution count and total students', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa 1',
        rif: 'J-12345678-9',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa 2',
        rif: 'J-98765432-1',
        tipoEmpresa: 'PRIVADA',
        carreras: 'Contaduría',
        cantidadEstudiantes: 2,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Verify subtotals row exists (row 7 + rows.length = row 9)
    const subtotalsRow = sheet.getRow(9);
    expect(subtotalsRow.getCell(2).value).toBe('SUB-TOTALES');
    expect(subtotalsRow.getCell(4).value).toBe(2); // Institution count
    expect(subtotalsRow.getCell(8).value).toBe(5); // Total students (column 8)
  });

  it('does NOT contain RESPONSABLE or TELÉFONO columns', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 1,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];
    const headerRow = sheet.getRow(6);

    // Ensure no RESPONSABLE or TELÉFONO header exists
    const headerValues: string[] = [];
    for (let i = 1; i <= 8; i++) {
      headerValues.push(String(headerRow.getCell(i).value));
    }
    expect(headerValues).not.toContain('RESPONSABLE');
    expect(headerValues).not.toContain('NÚMERO DE\nCONTACTO');
    expect(headerValues).not.toContain('TELÉFONO RESPONSABLE');
  });
});

// ============================================================
// Section B: Integration tests — Controller data grouping
// ============================================================

describe('Relacion Instituciones Export — Integration Tests', () => {
  let agent: request.Agent;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent(app);
  });

  it('GET /api/reports/export/relacion-instituciones-solicitan returns 200 with Excel buffer', async () => {
    const res = await agent
      .get('/api/reports/export/relacion-instituciones-solicitan')
      .query({ periodId: 1 })
      .buffer(true)
      .parse((res: any, callback: any) => {
        let data = Buffer.alloc(0);
        res.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
        res.on('end', () => callback(null, data));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect(res.headers['content-disposition']).toContain('attachment; filename="');
    expect(res.headers['content-disposition']).toContain('relacion-instituciones-solicitan');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body as Buffer);
    expect(workbook.worksheets.length).toBeGreaterThanOrEqual(1);
  });

  it('returns "Sin Datos" sheet when no data for period', async () => {
    const res = await agent
      .get('/api/reports/export/relacion-instituciones-solicitan')
      .query({ periodId: 99999 }) // Non-existent period
      .buffer(true)
      .parse((res: any, callback: any) => {
        let data = Buffer.alloc(0);
        res.on('data', (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
        res.on('end', () => callback(null, data));
      });

    expect(res.status).toBe(200);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body as Buffer);
    expect(workbook.worksheets.length).toBe(1);
    expect(workbook.worksheets[0].name).toBe('Sin Datos');
  });
});
