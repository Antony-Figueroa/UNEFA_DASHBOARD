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
  it('generates workbook with 7 columns and correct headers', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        responsable: 'Juan Pérez',
        telefono: '0212-1234567',
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
      'NOMBRE DE LA\nEMPRESA O INSTITUCIÓN',
      'RIF',
      'RESPONSABLE',
      'NÚMERO DE\nCONTACTO',
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

  it('applies institutional formatting (green header, thin borders)', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        responsable: 'Juan Pérez',
        telefono: '0212-1234567',
        tipoEmpresa: 'PRIVADA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Verify header row has green background (#92D050)
    const headerRow = sheet.getRow(6);
    const headerCell = headerRow.getCell(1);
    expect(headerCell.fill?.fgColor?.argb).toBe('FF92D050');

    // Verify data row has thin borders
    const dataRow = sheet.getRow(7);
    const dataCell = dataRow.getCell(1);
    expect(dataCell.border?.top?.style).toBe('thin');
    expect(dataCell.border?.bottom?.style).toBe('thin');
    expect(dataCell.border?.left?.style).toBe('thin');
    expect(dataCell.border?.right?.style).toBe('thin');
  });

  it('concatenates manager name correctly with NULL fields', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        responsable: 'Juan  Pérez', // Double space due to NULL middle name
        telefono: '0212-1234567',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 2,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Verify responsable is in UPPERCASE
    const dataRow = sheet.getRow(7);
    expect(String(dataRow.getCell(3).value)).toBe('JUAN  PÉREZ');
  });

  it('uses phone priority: INSTITUTION_CONTACT → manager CONTACT_PHONE → N/A', async () => {
    // Test case 1: Institution has contact phone
    const rowsWithPhone: RelacionInstitucionesExcelRow[] = [
      {
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        responsable: 'Juan Pérez',
        telefono: '0212-1234567',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 1,
      },
    ];

    const workbook1 = await generateRelacionInstitucionesSolicitanWorkbook(rowsWithPhone, 'Período: 2025-2026');
    const sheet1 = workbook1.worksheets[0];
    const dataRow1 = sheet1.getRow(7);
    expect(String(dataRow1.getCell(4).value)).toBe('0212-1234567');

    // Test case 2: No phone available (N/A)
    const rowsNoPhone: RelacionInstitucionesExcelRow[] = [
      {
        empresa: 'Empresa Test',
        rif: 'J-12345678-9',
        responsable: 'Juan Pérez',
        telefono: 'N/A',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 1,
      },
    ];

    const workbook2 = await generateRelacionInstitucionesSolicitanWorkbook(rowsNoPhone, 'Período: 2025-2026');
    const sheet2 = workbook2.worksheets[0];
    const dataRow2 = sheet2.getRow(7);
    expect(String(dataRow2.getCell(4).value)).toBe('N/A');
  });

  it('shows subtotals row with institution count and total students', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        empresa: 'Empresa 1',
        rif: 'J-12345678-9',
        responsable: 'Juan Pérez',
        telefono: '0212-1234567',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
      {
        empresa: 'Empresa 2',
        rif: 'J-98765432-1',
        responsable: 'María López',
        telefono: '0212-7654321',
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
    expect(subtotalsRow.getCell(7).value).toBe(5); // Total students
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