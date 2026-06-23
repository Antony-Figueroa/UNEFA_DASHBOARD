/**
 * Servicio de exportación Excel — genera workbooks ExcelJS con formato institucional UNEFA.
 *
 * Cada workbook contiene una hoja por grupo (carrera) con:
 *   - Membrete institucional (6 líneas en celda combinada)
 *   - Logos UNEFA (izquierda) y Escudo (derecha)
 *   - Título del reporte + período
 *   - Encabezados de columna en verde #92D050
 *   - Datos en mayúsculas (UPPERCASE) con bordes finos
 *   - Opcional: notas al pie + líneas de firma
 */

import ExcelJS from 'exceljs';
import { Workbook, Worksheet } from 'exceljs';
import path from 'path';
import fs from 'fs';

// ============================================================
// Tipos
// ============================================================

export interface SheetSection {
  title: string;
  periodLabel: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, any>[];
  footerNotes?: string[];
}

// ============================================================
// Membrete institucional
// ============================================================

const INSTITUTIONAL_HEADER = [
  'REPÚBLICA BOLIVARIANA DE VENEZUELA',
  'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
  'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
  'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
  'VICERRECTORADO ACADÉMICO',
  'COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA',
];

const MEMBRETE_TEXT = INSTITUTIONAL_HEADER.join('\n');

// ============================================================
// Estilos institucionales UNEFA
// ============================================================

const FONT_NAME = 'Arial';

const STYLES = {
  membrete: {
    font: { name: FONT_NAME, size: 9, bold: false },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
  title: {
    font: { name: FONT_NAME, size: 11, bold: true },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
  periodCode: {
    font: { name: FONT_NAME, size: 8, bold: true },
    alignment: { horizontal: 'left' as const, vertical: 'middle' as const },
  },
  columnHeader: {
    font: { name: FONT_NAME, size: 8, bold: true, color: { argb: 'FF000000' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  },
  dataCell: {
    font: { name: FONT_NAME, size: 8 },
    alignment: { vertical: 'middle' as const, wrapText: false },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  },
  footerNote: {
    font: { name: FONT_NAME, size: 8, italic: true },
    alignment: { vertical: 'top' as const, wrapText: true },
  },
  footerSignature: {
    font: { name: FONT_NAME, size: 9 },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
};

const DEFAULT_FOOTER_NOTES = [
  '1. El presente listado es emitido por la Coordinación de Pasantías de la UNEFA.',
  '2. Cualquier inconsistencia en los datos debe ser reportada a la Coordinación de Pasantías dentro de los 5 días hábiles siguientes a su publicación.',
  '3. Las firmas electrónicas tienen la misma validez que las firmas autógrafas conforme a la legislación vigente.',
];

const DEFAULT_SIGNATURES = [
  'Tutor Académico',
  'Director de Programa',
  'Coordinación de Pasantías',
];

// ============================================================
// Layout rows (constantes para mantener consistencia)
// ============================================================

const ROW_MEMBRETE = 1;       // Fila 1: membrete 6 líneas combinado
const ROW_LOGO_SPACE = 2;     // Fila 2: espacio para logos (alto)
const ROW_BLANK_1 = 3;        // Fila 3: espacio
const ROW_TITLE = 4;          // Fila 4: título del reporte
const ROW_CODE = 5;           // Fila 5: código / período
const ROW_BLANK_2 = 6;        // Fila 6: espacio
const ROW_HEADER = 7;         // Fila 7: encabezados de columna (verde)
const ROW_DATA_START = 8;     // Fila 8+: datos

// ============================================================
// Generador de workbook
// ============================================================

export async function generateWorkbook(sections: SheetSection[]): Promise<Workbook> {
  const workbook = new ExcelJS.Workbook();

  if (sections.length === 0) {
    const ws = workbook.addWorksheet('Sin Datos');
    addEmptySheet(ws, 'No se encontraron registros para el período seleccionado.');
    return workbook;
  }

  const usedSheetNames = new Set<string>();
  for (const section of sections) {
    const sheetName = sanitizeSheetName(section.title, usedSheetNames);
    const ws = workbook.addWorksheet(sheetName);
    addSheetContent(workbook, ws, section);
  }

  return workbook;
}

// ============================================================
// Construcción de una hoja individual
// ============================================================

function addSheetContent(workbook: Workbook, ws: Worksheet, section: SheetSection): void {
  const totalCols = section.columns.length;

  // ── Fila 1: Membrete institucional combinado ──
  ws.mergeCells(ROW_MEMBRETE, 1, ROW_MEMBRETE, totalCols);
  const membreteCell = ws.getCell(ROW_MEMBRETE, 1);
  membreteCell.value = MEMBRETE_TEXT;
  membreteCell.font = STYLES.membrete.font;
  membreteCell.alignment = STYLES.membrete.alignment;
  ws.getRow(ROW_MEMBRETE).height = 120;

  // ── Logos ──
  addLogos(workbook, ws, totalCols);

  // ── Fila 3: espacio ──
  ws.getRow(ROW_BLANK_1).height = 6;

  // ── Fila 4: título ──
  ws.mergeCells(ROW_TITLE, 1, ROW_TITLE, totalCols);
  const titleCell = ws.getCell(ROW_TITLE, 1);
  titleCell.value = { richText: [
    { text: section.title.toUpperCase(), font: { name: FONT_NAME, size: 11, bold: true } },
    { text: ` — ${section.periodLabel}`, font: { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFFF0000' } } },
  ]};
  titleCell.font = STYLES.title.font;
  titleCell.alignment = STYLES.title.alignment;
  ws.getRow(ROW_TITLE).height = 25;

  // ── Fila 5: código / período (opcional) ──
  ws.mergeCells(ROW_CODE, 1, ROW_CODE, totalCols);
  const codeCell = ws.getCell(ROW_CODE, 1);
  codeCell.value = `Período: ${section.periodLabel}`;
  codeCell.font = STYLES.periodCode.font;
  codeCell.alignment = STYLES.periodCode.alignment;
  ws.getRow(ROW_CODE).height = 18;

  // ── Fila 6: espacio ──
  ws.getRow(ROW_BLANK_2).height = 6;

  // ── Fila 7: Encabezados de columna (verde) ──
  const headerRow = ws.getRow(ROW_HEADER);
  headerRow.height = 30;
  section.columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = STYLES.columnHeader.font;
    cell.fill = STYLES.columnHeader.fill;
    cell.alignment = STYLES.columnHeader.alignment;
    cell.border = STYLES.columnHeader.border;
  });

  // ── Fila 8+: datos en UPPERCASE ──
  section.rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(ROW_DATA_START + rowIdx);
    excelRow.height = 20;
    section.columns.forEach((col, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      const val = row[col.key];
      cell.value = val !== null && val !== undefined
        ? (typeof val === 'string' ? val.toUpperCase() : val)
        : '';
      cell.font = STYLES.dataCell.font;
      cell.alignment = { ...STYLES.dataCell.alignment, horizontal: getColumnAlignment(col.key) };
      cell.border = STYLES.dataCell.border;
    });
  });

  // ── Ancho de columnas ──
  section.columns.forEach((col, idx) => {
    ws.getColumn(idx + 1).width = col.width ?? 20;
  });

  // ── Footer: notas ──
  // ponytail: skip footer if empty result set
  const notes = section.footerNotes ?? DEFAULT_FOOTER_NOTES;
  const footerStartRow = ROW_DATA_START + section.rows.length + 1;
  notes.forEach((note, idx) => {
    const row = ws.getRow(footerStartRow + idx);
    ws.mergeCells(footerStartRow + idx, 1, footerStartRow + idx, totalCols);
    const cell = row.getCell(1);
    cell.value = note;
    cell.font = STYLES.footerNote.font;
    cell.alignment = STYLES.footerNote.alignment;
    row.height = 18;
  });

  // ── Footer: firmas ──
  const sigStartRow = footerStartRow + notes.length + 1;
  DEFAULT_SIGNATURES.forEach((sig, idx) => {
    const row = ws.getRow(sigStartRow + idx);
    const colWidth = Math.max(1, Math.floor(totalCols / 3));
    const startCol = idx * colWidth + 1;
    const endCol = Math.min((idx + 1) * colWidth, totalCols);

    if (endCol > startCol) {
      ws.mergeCells(sigStartRow + idx, startCol, sigStartRow + idx, endCol);
    }
    const cell = row.getCell(startCol);
    cell.value = `__________________________\n${sig}`;
    cell.font = STYLES.footerSignature.font;
    cell.alignment = STYLES.footerSignature.alignment;
    row.height = 36;
  });
}

// ============================================================
// Logos institucionales
// ============================================================

function addLogos(workbook: Workbook, ws: Worksheet, totalCols: number): void {
  const logoPaths = findLogoPaths();

  if (!logoPaths) return;

  try {
    // Logo UNEFA (izquierda) — insertar en la primera columna
    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: 0, row: ROW_MEMBRETE - 1 + 0.2 },
        ext: { width: 85, height: 85 },
      });
    }

    // Escudo (derecha) — en la última columna
    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: totalCols - 1.5, row: ROW_MEMBRETE - 1 + 0.2 },
        ext: { width: 85, height: 85 },
      });
    }
  } catch (err) {
    console.warn('[excel-export] No se pudieron cargar las imágenes:', (err as Error).message);
  }
}

function findLogoPaths(): { logo: string; escudo: string } | null {
  const candidates = [
    // Desde backend/src/services/ o backend/dist/services/
    path.resolve(__dirname, '../../../public/logo-nuevo.png'),
    path.resolve(__dirname, '../../../public/unefa-img/Escudo.png'),
    // Fallback desde backend/
    path.resolve(process.cwd(), '../public/logo-nuevo.png'),
    path.resolve(process.cwd(), '../public/unefa-img/Escudo.png'),
    // Fallback directo
    path.resolve(process.cwd(), 'public/logo-nuevo.png'),
    path.resolve(process.cwd(), 'public/unefa-img/Escudo.png'),
  ];

  // Buscar el primer par que exista
  for (let i = 0; i < candidates.length; i += 2) {
    const logo = candidates[i];
    const escudo = candidates[i + 1];
    if (fs.existsSync(logo) && fs.existsSync(escudo)) {
      return { logo, escudo };
    }
  }
  return null;
}

// ============================================================
// Hoja vacía (sin datos)
// ============================================================

function addEmptySheet(ws: Worksheet, message: string): void {
  ws.mergeCells(1, 1, 3, 1);
  const cell = ws.getCell('A1');
  cell.value = message;
  cell.font = { name: FONT_NAME, size: 12, italic: true };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 60;
  ws.getRow(1).height = 40;
}

// ============================================================
// Utilitarios
// ============================================================

function sanitizeSheetName(name: string, existingNames?: Set<string>): string {
  let cleaned = name.replace(/[*?/:\\[\]]/g, '').trim();
  let result = cleaned.length > 31 ? cleaned.substring(0, 31) : cleaned || 'Sin nombre';

  if (existingNames) {
    let counter = 1;
    while (existingNames.has(result)) {
      const suffix = ` (${counter})`;
      const maxBase = 31 - suffix.length;
      result = (result.length > maxBase ? result.substring(0, maxBase) : result) + suffix;
      counter++;
    }
    existingNames.add(result);
  }

  return result;
}

function getColumnAlignment(key: string): 'left' | 'center' | 'right' {
  const rightAligned = ['nro', 'cantidad', 'count', 'total', 'cedula', 'ci', 'telefono', 'phone'];
  const centerAligned = ['condicion', 'dedicacion', 'categoria', 'tipo', 'sexo', 'status'];

  if (rightAligned.some((k) => key.toLowerCase().includes(k))) return 'right';
  if (centerAligned.some((k) => key.toLowerCase().includes(k))) return 'center';
  return 'left';
}
