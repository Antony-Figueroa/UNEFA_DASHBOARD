/**
 * Servicio de exportación Excel — genera workbooks ExcelJS con estructura oficial.
 *
 * Cada workbook contiene una hoja por carrera con:
 *   - Encabezado institucional (UNEFA + nombre del reporte + período)
 *   - Columnas oficiales del tipo de reporte
 *   - Datos agrupados por carrera
 *   - Pie con 3 notas numeradas + líneas de firma
 */

import ExcelJS from 'exceljs';
import { Workbook, Worksheet } from 'exceljs';

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
// Estilos compartidos
// ============================================================

const STYLES = {
  headerTitle: {
    font: { name: 'Calibri', size: 14, bold: true },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
  headerPeriod: {
    font: { name: 'Calibri', size: 11, italic: true },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
  columnHeader: {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF003366' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  },
  dataCell: {
    font: { name: 'Calibri', size: 10 },
    alignment: { vertical: 'middle' as const, wrapText: false },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  },
  footerNote: {
    font: { name: 'Calibri', size: 9, italic: true },
    alignment: { vertical: 'top' as const, wrapText: true },
  },
  footerSignature: {
    font: { name: 'Calibri', size: 10 },
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
// Generador de workbook
// ============================================================

/**
 * Genera un workbook Excel con una hoja por grupo (carrera).
 */
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
    addSheetContent(ws, section);
  }

  return workbook;
}

// ============================================================
// Construcción de una hoja individual
// ============================================================

function addSheetContent(ws: Worksheet, section: SheetSection): void {
  // ── Encabezado institucional ──
  ws.mergeCells(1, 1, 1, section.columns.length);
  const titleCell = ws.getCell('A1');
  titleCell.value = `UNEFA — ${section.title}`;
  titleCell.font = STYLES.headerTitle.font;
  titleCell.alignment = STYLES.headerTitle.alignment;
  ws.getRow(1).height = 30;

  // ── Período ──
  ws.mergeCells(2, 1, 2, section.columns.length);
  const periodCell = ws.getCell('A2');
  periodCell.value = section.periodLabel;
  periodCell.font = STYLES.headerPeriod.font;
  periodCell.alignment = STYLES.headerPeriod.alignment;
  ws.getRow(2).height = 22;

  // ── Fila vacía ──
  ws.getRow(3).height = 6;

  // ── Encabezados de columna ──
  const headerRow = ws.getRow(4);
  headerRow.height = 28;
  section.columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = STYLES.columnHeader.font;
    cell.fill = STYLES.columnHeader.fill;
    cell.alignment = STYLES.columnHeader.alignment;
    cell.border = STYLES.columnHeader.border;
  });

  // ── Datos ──
  const dataStartRow = 5;
  section.rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(dataStartRow + rowIdx);
    excelRow.height = 20;
    section.columns.forEach((col, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.value = row[col.key] ?? '';
      cell.font = STYLES.dataCell.font;
      cell.alignment = { ...STYLES.dataCell.alignment, horizontal: getColumnAlignment(col.key) };
      cell.border = STYLES.dataCell.border;
    });
  });

  // ── Footer: notas ──
  const notes = section.footerNotes ?? DEFAULT_FOOTER_NOTES;
  const footerStartRow = dataStartRow + section.rows.length + 1;
  notes.forEach((note, idx) => {
    const row = ws.getRow(footerStartRow + idx);
    ws.mergeCells(footerStartRow + idx, 1, footerStartRow + idx, section.columns.length);
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
    const colWidth = Math.max(1, Math.floor(section.columns.length / 3));
    const startCol = idx * colWidth + 1;
    const endCol = Math.min((idx + 1) * colWidth, section.columns.length);

    if (endCol > startCol) {
      ws.mergeCells(sigStartRow + idx, startCol, sigStartRow + idx, endCol);
    }
    const cell = row.getCell(startCol);
    cell.value = `__________________________\n${sig}`;
    cell.font = STYLES.footerSignature.font;
    cell.alignment = STYLES.footerSignature.alignment;
    row.height = 36;
  });

  // ── Ancho de columnas ──
  section.columns.forEach((col, idx) => {
    ws.getColumn(idx + 1).width = col.width ?? 20;
  });
}

// ============================================================
// Hoja vacía (sin datos)
// ============================================================

function addEmptySheet(ws: Worksheet, message: string): void {
  ws.mergeCells(1, 1, 3, 1);
  const cell = ws.getCell('A1');
  cell.value = message;
  cell.font = { name: 'Calibri', size: 12, italic: true };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 60;
  ws.getRow(1).height = 40;
}

// ============================================================
// Utilitarios
// ============================================================

/**
 * Limpia el nombre de la hoja para caracteres no válidos en Excel.
 * Excel limita nombres de hoja a 31 caracteres.
 */
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

/**
 * Determina alineación horizontal según la clave de columna.
 * Números a la derecha, texto a la izquierda.
 */
function getColumnAlignment(key: string): 'left' | 'center' | 'right' {
  const rightAligned = ['nro', 'cantidad', 'count', 'total', 'cedula', 'ci', 'telefono', 'phone'];
  const centerAligned = ['condicion', 'dedicacion', 'categoria', 'tipo', 'sexo', 'status'];

  if (rightAligned.some((k) => key.toLowerCase().includes(k))) return 'right';
  if (centerAligned.some((k) => key.toLowerCase().includes(k))) return 'center';
  return 'left';
}
