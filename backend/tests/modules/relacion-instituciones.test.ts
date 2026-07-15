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
  it('generates workbook with correct headers and sub-headers', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa Test',
        responsable: 'Juan Pérez',
        telefonoContacto: '04121234567',
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
    const expectedHeaders: Record<number, string> = {
      1: 'REGIÓN',
      2: 'NÚCLEO',
      3: 'EXTENSIÓN',
      4: 'NOMBRE DE LA EMPRESA\nO INSTITUCIÓN',
      5: 'RESPONSABLE',
      6: 'NUMERO DE\nCONTACTO',
      7: 'TIPO DE\nEMPRESA',
      9: 'CARRERAS',
      10: 'CANTIDAD DE\nESTUDIANTES',
    };

    Object.entries(expectedHeaders).forEach(([col, header]) => {
      expect(String(headerRow.getCell(Number(col)).value)).toBe(header);
    });

    // Verify sub-headers in row 7
    const subRow = sheet.getRow(7);
    expect(String(subRow.getCell(7).value)).toBe('PÚBLICA');
    expect(String(subRow.getCell(8).value)).toBe('PRIVADA');
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
        responsable: 'María García',
        telefonoContacto: '04147654321',
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

    // Verify data row (row 8) has thin borders
    const dataRow = sheet.getRow(8);
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
        responsable: 'Ana López',
        telefonoContacto: '04121111111',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa 2',
        responsable: 'Carlos Ruiz',
        telefonoContacto: '04242222222',
        tipoEmpresa: 'PRIVADA',
        carreras: 'Contaduría',
        cantidadEstudiantes: 2,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Each row should have region independently (data starts at row 8)
    const row1 = sheet.getRow(8);
    const row2 = sheet.getRow(9);
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
        responsable: 'Ana López',
        telefonoContacto: '04121111111',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 3,
      },
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa 2',
        responsable: 'Carlos Ruiz',
        telefonoContacto: '04242222222',
        tipoEmpresa: 'PRIVADA',
        carreras: 'Contaduría',
        cantidadEstudiantes: 2,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];

    // Data starts at row 8, so subtotals at row 8 + 2 = row 10
    const subtotalsRow = sheet.getRow(10);
    expect(subtotalsRow.getCell(2).value).toBe('SUB-TOTALES');
    expect(subtotalsRow.getCell(4).value).toBe(2); // Institution count
    expect(subtotalsRow.getCell(10).value).toBe(5); // Total students (column 10)
  });

  it('contains RESPONSABLE and NUMERO DE CONTACTO columns', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa Test',
        responsable: 'Pedro Martínez',
        telefonoContacto: '04163333333',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 1,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];
    const headerRow = sheet.getRow(6);

    // Ensure RESPONSABLE and NUMERO DE CONTACTO headers exist
    const headerValues: string[] = [];
    for (let i = 1; i <= 9; i++) {
      headerValues.push(String(headerRow.getCell(i).value));
    }
    expect(headerValues).toContain('RESPONSABLE');
    expect(headerValues).toContain('NUMERO DE\nCONTACTO');
  });

  it('formats phone numbers as 0000 - 0000000', async () => {
    const rows: RelacionInstitucionesExcelRow[] = [
      {
        region: 'Región Capital',
        nucleo: 'Caracas',
        extension: 'UCV',
        empresa: 'Empresa Test',
        responsable: 'Pedro Martínez',
        telefonoContacto: '04163333333',
        tipoEmpresa: 'PÚBLICA',
        carreras: 'Ing. Sistemas',
        cantidadEstudiantes: 1,
      },
    ];

    const workbook = await generateRelacionInstitucionesSolicitanWorkbook(rows, 'Período: 2025-2026');
    const sheet = workbook.worksheets[0];
    const dataRow = sheet.getRow(8);

    // Phone should be formatted as 0416 - 3333333
    expect(String(dataRow.getCell(6).value)).toBe('0416 - 3333333');
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
