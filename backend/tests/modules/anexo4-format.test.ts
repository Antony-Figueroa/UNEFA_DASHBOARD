/**
 * Tests estructurales — ANEXO 4 Formato de Corrección
 *
 * Verifica que las hojas de tutores académicos (GENERAL e INDIVIDUAL)
 * y la hoja de validación (Hoja1) se generen con la estructura correcta:
 * - Cantidad de columnas
 * - Nombres de hojas
 * - Colores de encabezado
 * - Tamaños de fuente
 * - Sección de firmas
 * - Hoja1 con valores de dropdown
 *
 * Estos tests son de ESTRUCTURA, no de integración con base de datos.
 * Usan generateTutoresAcademicosWorkbook con datos mock.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import ExcelJS, { Workbook } from 'exceljs';
import {
  generateTutoresAcademicosWorkbook,
} from '../../src/services/excel-export.service.js';
import type {
  SheetSection,
  IndividualTutorSheetConfig,
  IndividualTutorRow,
} from '../../src/services/excel-export.service.js';

// ============================================================
// Datos mock
// ============================================================

function makeGeneralSection(): SheetSection {
  return {
    title: 'RELACIÓN GENERAL\nDE TUTORES ACADÉMICOS CONTRATADOS U ORDINARIOS CON DEDICACIÓN MT, TC Y DE QUE SE ENCUENTRAN TUTORANDO ESTUDIANTES DE PRACTICAS PROFESIONALES ( PASANTIAS )',
    periodLabel: '1 - 2026',
    columns: [
      { header: 'N°', key: 'nro' },
      { header: 'REGIÓN', key: 'region' },
      { header: 'NÚCLEO', key: 'nucleo' },
      { header: 'EXTENSIÓN', key: 'extension' },
      { header: 'CARRERA', key: 'carrera' },
      { header: 'NOMBRE DEL TUTOR (A)', key: 'nombreTutor' },
      { header: 'APELLIDO DEL TUTOR (A)', key: 'apellidoTutor' },
      { header: 'CÉDULA', key: 'cedula' },
      { header: 'CONDICIÓN', key: 'condicion' },
      { header: 'DEDICACIÓN', key: 'dedicacion' },
      { header: 'CATEGORÍA', key: 'categoria' },
      { header: 'TELÉFONO', key: 'telefono' },
      { header: 'CORREO ELECTRÓNICO', key: 'correo' },
      { header: 'CANTIDAD DE ESTUDIANTES ATENDIDOS', key: 'cantidadEstudiantes' },
    ],
    rows: [
      {
        nro: 1, region: 'CAPITAL', nucleo: 'CARACAS', extension: 'SUCRE',
        carrera: 'ING. DE SISTEMAS', nombreTutor: 'JUAN CARLOS', apellidoTutor: 'PÉREZ GARCÍA',
        cedula: 'V-12345678', condicion: 'ORDINARIOS', dedicacion: 'TIEMPO COMPLETO (TC)',
        categoria: 'Agregado', telefono: '0412-1234567', correo: 'juan@unefa.edu.ve', cantidadEstudiantes: 5,
      },
    ],
    footerNotes: [
      '1.-Los soportes anexados a este formato, deberán estar ordenados según la numeración correspondiente a cada tutor (a).',
      '2. Las pestañas deben estar enumeradas de acuerdo al orden numerico del docente en la relacion general.',
      '2.-Debe realizar un archivo por cada carrera.',
    ],
    signatures: [
      'NOMBRE APELLIDO\nFIRMA Y SELLO DEL COORDINADOR DE PRÁCTICAS PROFESIONALES',
      'NOMBRE APELLIDO\nFIRMA Y SELLO DEL JEFE ÁREA ACADÉMICA',
      'NOMBRE APELLIDO\nFIRMA Y SELLO DEL DECANO (A)',
    ],
  };
}

function makeIndividualConfig(): IndividualTutorSheetConfig {
  const rows: IndividualTutorRow[] = [
    {
      nro: 1, region: 'CAPITAL', nucleo: 'CARACAS', extension: 'SUCRE',
      carrera: 'ING. DE SISTEMAS', estudianteNombre: 'PEDRO ANTONIO', estudianteApellido: 'MARTÍNEZ LÓPEZ',
      estudianteCi: 'V-20123456', sexo: 'M', tipo: 'CIVIL', rango: '',
      telefono: '0424-9876543', institucion: 'EMPRESA XYZ C.A.',
      tipoInstitucion: 'PRIVADA', tutorInst: 'GARCÍA, MARía, C.I: V-10000000/TLFNO: 0412-0000000/CORREO: maria@xyz.com',
      direccion: 'AV. PRINCIPAL, EDIFICIO A, PISO 2', observaciones: '',
    },
  ];

  return {
    sheetIndex: 1,
    tutorName: 'JUAN CARLOS',
    tutorApellido: 'PÉREZ GARCÍA',
    periodLabel: '2-2025',
    rows,
  };
}

// ============================================================
// Estilos esperados (deben coincidir con las constantes del servicio)
// ============================================================
const EXPECTED_GREEN_FILL_ARGB = 'FF92D050';
const EXPECTED_FONT_NAME = 'Arial';
const EXPECTED_FONT_SIZE = 11;

// ============================================================
// Tests
// ============================================================

describe('ANEXO 4 — Formato de corrección (estructura)', () => {
  let workbook: Workbook;

  beforeAll(async () => {
    workbook = await generateTutoresAcademicosWorkbook(
      makeGeneralSection(),
      [makeIndividualConfig()],
    );
  });

  // ── Nombre de hojas ──
  it('debe generar exactamente 3 hojas: GENERAL, Hoja1, Individual', () => {
    expect(workbook.worksheets.length).toBe(3);
    expect(workbook.worksheets[0].name).toBe('RELACIÓN GENERAL');
    expect(workbook.worksheets[1].name).toBe('Hoja1');
    expect(workbook.worksheets[2].name).toContain('PÉREZ');
  });

  // ── Hoja GENERAL ──
  describe('Hoja GENERAL — RELACIÓN GENERAL', () => {
    it('debe tener 18 columnas de datos (B-R)', () => {
      const ws = workbook.worksheets[0];
      // Column A es margen, B(2) a R(18) son datos
      // Verificar que la columna R (18) tiene contenido en el header
      const headerRow = ws.getRow(5);
      const lastColCell = headerRow.getCell(18); // R5
      expect(lastColCell.value).toBeTruthy();
      expect(String(lastColCell.value)).toContain('CANTIDAD');
    });

    it('debe tener encabezados correctos en fila 5', () => {
      const ws = workbook.worksheets[0];
      const headerRow = ws.getRow(5);
      expect(String(headerRow.getCell(2).value)).toBe('N°');
      expect(String(headerRow.getCell(3).value)).toBe('REGIÓN');
      expect(String(headerRow.getCell(4).value)).toBe('NÚCLEO');
      expect(String(headerRow.getCell(5).value)).toBe('EXTENSIÓN');
      expect(String(headerRow.getCell(6).value)).toBe('CARRERA');
      expect(String(headerRow.getCell(7).value)).toContain('NOMBRE DEL TUTOR');
      expect(String(headerRow.getCell(9).value)).toContain('APELLIDO DEL TUTOR');
      expect(String(headerRow.getCell(11).value)).toBe('CÉDULA');
      expect(String(headerRow.getCell(12).value)).toBe('CONDICIÓN');
      expect(String(headerRow.getCell(13).value)).toBe('DEDICACIÓN');
      expect(String(headerRow.getCell(14).value)).toBe('CATEGORÍA');
      expect(String(headerRow.getCell(15).value)).toBe('TELÉFONO');
      expect(String(headerRow.getCell(16).value)).toContain('CORREO');
      expect(String(headerRow.getCell(18).value)).toContain('CANTIDAD DE ESTUDIANTES');
    });

    it('debe tener fill verde FF92D050 en la fila de encabezado', () => {
      const ws = workbook.worksheets[0];
      const headerRow = ws.getRow(5);
      const cell = headerRow.getCell(2); // B5
      const fill = cell.fill as any;
      expect(fill).toBeDefined();
      expect(fill.fgColor?.argb).toBe(EXPECTED_GREEN_FILL_ARGB);
    });

    it('debe tener fuente Arial 11pt en encabezados', () => {
      const ws = workbook.worksheets[0];
      const headerRow = ws.getRow(5);
      const cell = headerRow.getCell(2);
      expect(cell.font?.name).toBe(EXPECTED_FONT_NAME);
      expect(cell.font?.size).toBe(EXPECTED_FONT_SIZE);
      expect(cell.font?.bold).toBe(true);
    });

    it('debe tener código SOA-PP-001-3 en celda C2', () => {
      const ws = workbook.worksheets[0];
      const codeCell = ws.getCell(2, 3); // C2
      expect(String(codeCell.value)).toBe('SOA-PP-001-3');
    });

    it('debe tener la sección de firmas con 3 bloques', () => {
      const ws = workbook.worksheets[0];
      // Verificar las 3 celdas de inicio de los rangos de firma combinados
      const sigRow = 12;
      const b12 = ws.getCell(sigRow, 2).value; // B12:D12
      const f12 = ws.getCell(sigRow, 6).value; // F12:H12
      const j12 = ws.getCell(sigRow, 10).value; // J12:O12
      expect(String(b12)).toContain('FIRMA Y SELLO');
      expect(String(f12)).toContain('FIRMA Y SELLO');
      expect(String(j12)).toContain('FIRMA Y SELLO');
    });

    it('debe tener al menos 1 fila de datos con valor uppercase', () => {
      const ws = workbook.worksheets[0];
      // Datos empiezan en fila 6
      const dataRow = ws.getRow(6);
      const regionVal = dataRow.getCell(3).value; // C6 = región
      expect(String(regionVal)).toBe('CAPITAL');
    });
  });

  // ── Hoja Hoja1 (dropdown validation) ──
  describe('Hoja1 — Hoja de validación', () => {
    it('debe existir con nombre "Hoja1"', () => {
      const ws = workbook.worksheets[1];
      expect(ws).toBeDefined();
      expect(ws.name).toBe('Hoja1');
    });

    it('debe tener header "Regiones" en B1', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 2).value)).toBe('Regiones');
    });

    it('debe tener 7 regiones en B4:B10', () => {
      const ws = workbook.worksheets[1];
      const regiones = ['CAPITAL', 'CENTRAL', 'OCCIDENTAL', 'ORIENTAL', 'LOS LLANOS', 'LOS ANDES', 'GUAYANA'];
      regiones.forEach((r, i) => {
        expect(String(ws.getCell(4 + i, 2).value)).toBe(r);
      });
    });

    it('debe tener header "Núcleos" en D1', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 4).value)).toBe('Núcleos');
    });

    it('debe tener 26 núcleos en D4:D29', () => {
      const ws = workbook.worksheets[1];
      const nucleos = [
        'CARACAS', 'MIRANDA', 'GUATIRE', 'VARGAS', 'ARAGUA', 'CARABOBO',
        'PUERTO CABELLO', 'YARACUY', 'FALCÓN', 'LARA', 'ZULIA', 'ANZOÁTEGUI',
        'SUCRE', 'MONAGAS', 'NUEVA ESPARTA', 'COJEDES', 'PORTUGUESA',
        'BARINAS', 'GUÁRICO', 'APURE', 'TRUJILLO', 'TÁCHIRA', 'MÉRIDA',
        'BOLÍVAR', 'AMAZONAS', 'DELTA AMACURO',
      ];
      nucleos.forEach((n, i) => {
        expect(String(ws.getCell(4 + i, 4).value)).toBe(n);
      });
    });

    it('debe tener header "Sexo" en E1 y valores FEMENINO/MASCULINO', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 5).value)).toBe('Sexo');
      expect(String(ws.getCell(4, 5).value)).toBe('FEMENINO');
      expect(String(ws.getCell(5, 5).value)).toBe('MASCULINO');
    });

    it('debe tener header "Tipo estudiante" en F1 y valores CIVIL/MILITAR', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 6).value)).toBe('Tipo estudiante');
      expect(String(ws.getCell(4, 6).value)).toBe('CIVIL');
      expect(String(ws.getCell(5, 6).value)).toBe('MILITAR');
    });

    it('debe tener header "Tipo institución" en G1 y valores PÚBLICA/PRIVADA/MIXTA', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 7).value)).toBe('Tipo institución');
      expect(String(ws.getCell(4, 7).value)).toBe('PÚBLICA');
      expect(String(ws.getCell(5, 7).value)).toBe('PRIVADA');
      expect(String(ws.getCell(6, 7).value)).toBe('MIXTA');
    });

    it('debe tener header "Condición docente" en I1 y valores CONTRATADOS/ORDINARIOS', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 9).value)).toBe('Condición docente');
      expect(String(ws.getCell(4, 9).value)).toBe('CONTRATADOS');
      expect(String(ws.getCell(5, 9).value)).toBe('ORDINARIOS');
    });

    it('debe tener header "Dedicación" en K1 y valores MT/TC/DE', () => {
      const ws = workbook.worksheets[1];
      expect(String(ws.getCell(1, 11).value)).toBe('Dedicación');
      expect(String(ws.getCell(4, 11).value)).toBe('MEDIO TIEMPO (MT)');
      expect(String(ws.getCell(5, 11).value)).toBe('TIEMPO COMPLETO (TC)');
      expect(String(ws.getCell(6, 11).value)).toBe('DEDICACIÓN EXCLUSIVA (DE)');
    });
  });

  // ── Hoja Individual ──
  describe('Hoja Individual — RELACIÓN INDIVIDUAL', () => {
    it('debe tener 19 columnas de datos (B-S)', () => {
      const ws = workbook.worksheets[2];
      // S = columna 19, debe tener contenido en header row 7
      const headerRow = ws.getRow(7);
      const lastColCell = headerRow.getCell(19); // S7
      expect(lastColCell.value).toBeTruthy();
      expect(String(lastColCell.value)).toContain('OBSERVACIONES');
    });

    it('debe tener encabezados correctos en la fila 7 (row 1 del header)', () => {
      const ws = workbook.worksheets[2];
      const h1 = ws.getRow(7);
      expect(String(h1.getCell(2).value)).toBe('N°');
      expect(String(h1.getCell(3).value)).toBe('REGIÓN');
      expect(String(h1.getCell(4).value)).toBe('NÚCLEO');
      expect(String(h1.getCell(5).value)).toBe('EXTENSIÓN');
      expect(String(h1.getCell(6).value)).toBe('CARRERA');
      expect(String(h1.getCell(7).value)).toContain('NOMBRE Y APELLIDO');
      expect(String(h1.getCell(8).value)).toBe('CÉDULA');
      expect(String(h1.getCell(9).value)).toContain('SEXO');
    });

    it('debe tener TIPO DE ESTUDIANTE en fila 7 col J con sub-headers CIVIL/RANGO en fila 8', () => {
      const ws = workbook.worksheets[2];
      const h1 = ws.getRow(7);
      const h2 = ws.getRow(8);
      expect(String(h1.getCell(10).value)).toContain('TIPO DE ESTUDIANTE');
      expect(String(h2.getCell(10).value)).toBe('CIVIL');
      expect(String(h2.getCell(11).value)).toContain('RANGO');
    });

    it('debe tener fill verde FF92D050 en headers individuales', () => {
      const ws = workbook.worksheets[2];
      const headerRow = ws.getRow(7);
      const cell = headerRow.getCell(2); // B7
      const fill = cell.fill as any;
      expect(fill).toBeDefined();
      expect(fill.fgColor?.argb).toBe(EXPECTED_GREEN_FILL_ARGB);
    });

    it('debe tener fuente Arial 11pt en headers individuales', () => {
      const ws = workbook.worksheets[2];
      const cell = ws.getRow(7).getCell(2);
      expect(cell.font?.name).toBe(EXPECTED_FONT_NAME);
      expect(cell.font?.size).toBe(EXPECTED_FONT_SIZE);
      expect(cell.font?.bold).toBe(true);
    });

    it('debe tener código SOA-PP-001-5 en celda C3', () => {
      const ws = workbook.worksheets[2];
      const codeCell = ws.getCell(3, 3); // C3
      expect(String(codeCell.value)).toBe('SOA-PP-001-5');
    });

    it('debe tener el nombre del tutor en fila 5 con fondo amarillo', () => {
      const ws = workbook.worksheets[2];
      const nameCell = ws.getRow(5).getCell(2); // B5
      expect(String(nameCell.value)).toContain('PÉREZ GARCÍA');
      const fill = nameCell.fill as any;
      expect(fill.fgColor?.argb).toBe('FFFFFF00');
    });

    it('debe tener 1 fila de datos con valores correctos', () => {
      const ws = workbook.worksheets[2];
      // Fila 9: datos después de filas 7-8 (headers) — primer fila de datos
      const dataRow = ws.getRow(9);
      expect(dataRow.getCell(2).value).toBe(1); // N°
      expect(String(dataRow.getCell(3).value)).toBe('CAPITAL');
    });

    it('NO debe tener sección de firmas (sin filas FIRMA Y SELLO)', () => {
      const ws = workbook.worksheets[2];
      let hasSignature = false;
      for (let r = 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        for (let c = 1; c <= 19; c++) {
          const val = row.getCell(c).value;
          if (val && typeof val === 'string' && val.includes('FIRMA Y SELLO')) {
            hasSignature = true;
          }
        }
      }
      expect(hasSignature).toBe(false);
    });
  });
});
