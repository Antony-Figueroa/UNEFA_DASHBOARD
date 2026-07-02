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
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Tipos
// ============================================================

export interface SheetSection {
  title: string;
  periodLabel: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, any>[];
  footerNotes?: string[];
  signatures?: string[];
}

export interface IndividualTutorRow {
  nro: number;
  region: string;
  nucleo: string;
  extension: string;
  carrera: string;
  estudianteNombre: string;
  estudianteApellido: string;
  estudianteCi: string;
  /** 'F' | 'M' | '' */
  sexo: string;
  /** 'CIVIL' | 'MILITAR' | '' */
  tipo: string;
  rango: string;
  telefono: string;
  institucion: string;
  tipoInstitucion: string;
  /** Tutor institucional concatenado: "APELLIDO, NOMBRE, C.I: V-.../TLFNO: .../CORREO: ..." */
  tutorInst: string;
  direccion: string;
  observaciones: string;
}

export interface ResumenPasantiaRow {
  region: string;
  nucleo: string;
  extension: string;
  carrera: string;
  cantidadTutoresAcad: number;
  cantidadEstudiantes: number;
  empresa: string;
  /** 'PÚBLICA' | 'PRIVADA' (desde INSTITUTION_TYPE) */
  tipo: string;
  cantidadTutoresInst: number;
  observacion: string;
}

export interface IndividualTutorSheetConfig {
  sheetIndex: number;
  tutorName: string;
  tutorApellido: string;
  periodLabel: string;
  rows: IndividualTutorRow[];
}

export interface RelacionInstitucionesExcelRow {
  region: string;
  nucleo: string;
  extension: string;
  empresa: string;
  rif: string;
  responsable: string;
  telefono: string;
  tipoEmpresa: string;
  carreras: string;
  cantidadEstudiantes: number;
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
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
  },
  title: {
    font: { name: FONT_NAME, size: 11, bold: true },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
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
  ws.getRow(ROW_TITLE).height = 50;

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
  const sigLabels = section.signatures ?? DEFAULT_SIGNATURES;
  const sigStartRow = footerStartRow + notes.length + 1;
  sigLabels.forEach((sig, idx) => {
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
// Generador combinado: Relación General + hojas individuales
// ============================================================

const INDIVIDUAL_TOTAL_COLS = 19;

/** Colores de fondo para headers del individual */
const HDR_GREEN = 'FF92D050';
const HDR_YELLOW = 'FFFFFF00';

const INDIVIDUAL_HEADER_STYLE_BASE = {
  font: { name: FONT_NAME, size: 8, bold: true },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
  },
};

function headerCell(fillArgb: string) {
  return {
    ...INDIVIDUAL_HEADER_STYLE_BASE,
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: fillArgb } },
  };
}

const INDIVIDUAL_DATA_STYLE = {
  font: { name: FONT_NAME, size: 8 },
  alignment: { vertical: 'middle' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
  },
};

const ROW_TUTOR_NAME = 7;
const ROW_INDIVIDUAL_HEADER_1 = 8;
const ROW_INDIVIDUAL_HEADER_2 = 9;
const ROW_INDIVIDUAL_DATA_START = 10;

export async function generateTutoresAcademicosWorkbook(
  generalSection: SheetSection,
  individualSections: IndividualTutorSheetConfig[],
): Promise<Workbook> {
  const workbook = new ExcelJS.Workbook();

  if (individualSections.length === 0 && generalSection.rows.length === 0) {
    const ws = workbook.addWorksheet('Sin Datos');
    addEmptySheet(ws, 'No se encontraron registros para el período seleccionado.');
    return workbook;
  }

  // Hoja 1: RELACIÓN GENERAL
  const wsGeneral = workbook.addWorksheet('RELACIÓN GENERAL');
  addGeneralTutorSheet(workbook, wsGeneral, generalSection);

  // Hojas 2+: individuales por tutor
  const usedSheetNames = new Set<string>(['RELACIÓN GENERAL']);
  for (const section of individualSections) {
    const sheetName = sanitizeSheetName(
      `${section.sheetIndex} - ${section.tutorApellido}, ${section.tutorName}`,
      usedSheetNames,
    );
    const ws = workbook.addWorksheet(sheetName);
    addIndividualTutorSheet(workbook, ws, section);
  }

  return workbook;
}

// ============================================================
// Generador: Resumen de Pasantías (formato oficial UNEFA)
// ============================================================

// ============================================================
// Interfaces
// ============================================================

interface RelacionEmpresaExcelRow {
  region: string;
  nucleo: string;
  extension: string;
  empresa: string;
  rif: string;
  publica: string;
  privada: string;
  carrera: string;
  cantidadEstudiantes: number;
}

// ============================================================
// Generador: Relación de Empresas (formato oficial Form-002-2019)
// ============================================================

export async function generateRelacionInstitucionesSolicitanWorkbook(
  rows: RelacionInstitucionesExcelRow[],
  periodLabel: string,
): Promise<Workbook> {
  const workbook = new ExcelJS.Workbook();
  const TOTAL = 10; // A-J

  if (rows.length === 0) {
    const ws = workbook.addWorksheet('Sin Datos');
    addEmptySheet(ws, 'No se encontraron registros para el período seleccionado.');
    return workbook;
  }

  const ws = workbook.addWorksheet('RELACIÓN');
  const FONT = 'Arial';
  const HDR_BG = 'FF8DB3E2'; // Blue header like relacion de empresas
  const SUB_BG = 'FF76923C';
  const TOTAL_BG = 'FFD6E3BC';

  // ── Fila 1: Membrete (120px) + logos ──
  ws.getRow(1).height = 120;
  ws.mergeCells(1, 1, 1, TOTAL);
  const mem = ws.getCell(1, 1);
  mem.value = MEMBRETE_TEXT;
  mem.font = { name: FONT, size: 9 };
  mem.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  addLogos(workbook, ws, TOTAL);

  // ── Fila 2: spacer ──
  ws.getRow(2).height = 6;

  // ── Fila 3: Form code ──
  ws.getRow(3).height = 18;
  ws.mergeCells(3, 1, 3, TOTAL);
  const code = ws.getCell(3, 1);
  code.value = 'Form-002-2019 CPA-VAC_jp';
  code.font = { name: FONT, size: 8, bold: true };
  code.alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Fila 4: spacer ──
  ws.getRow(4).height = 6;

  // ── Fila 5: Título (60px) ──
  ws.getRow(5).height = 60;
  ws.mergeCells(5, 1, 5, TOTAL);
  const title = ws.getCell(5, 1);
  title.value = {
    richText: [
      { text: 'RELACIÓN DE INSTITUCIONES QUE SOLICITAN ASIGNACIÓN DE PASANTES', font: { name: FONT, size: 11, bold: true } },
      { text: `\nPARA EL PERÍODO ACADÉMICO ${periodLabel}`, font: { name: FONT, size: 11, bold: true, color: { argb: 'FFFF0000' } } },
    ],
  };
  title.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // ── Estilo header ──
  const hdr = {
    font: { name: FONT, size: 9, bold: true },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: HDR_BG } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: { top: { style: 'thin' as const }, bottom: { style: 'thin' as const }, left: { style: 'thin' as const }, right: { style: 'thin' as const } },
  };
  const setH = (c: any, v: string) => { c.value = v; c.font = hdr.font; c.fill = hdr.fill; c.alignment = hdr.alignment; c.border = hdr.border; };

  // ── Fila 6: HEADER ROW (36px) ──
  ws.getRow(6).height = 36;
  setH(ws.getCell(6, 1), 'REGIÓN');
  setH(ws.getCell(6, 2), 'NÚCLEO');
  setH(ws.getCell(6, 3), 'EXTENSIÓN');
  setH(ws.getCell(6, 4), 'NOMBRE DE LA\nEMPRESA O INSTITUCIÓN');
  setH(ws.getCell(6, 5), 'RIF');
  setH(ws.getCell(6, 6), 'RESPONSABLE');
  setH(ws.getCell(6, 7), 'NÚMERO DE\nCONTACTO');
  setH(ws.getCell(6, 8), 'TIPO DE\nEMPRESA');
  setH(ws.getCell(6, 9), 'CARRERAS');
  setH(ws.getCell(6, 10), 'CANTIDAD DE\nESTUDIANTES');

  // ── Column widths ──
  const empresaW = Math.min(Math.max(...rows.map(r => (r.empresa || '').length), 10) + 3, 55);
  const carrerasW = Math.min(Math.max(...rows.map(r => (r.carreras || '').length), 10) + 3, 35);
  [12, 16, 16, empresaW, 16, 24, 16, 12, carrerasW, 10].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // ── Data rows ──
  const center = { vertical: 'middle' as const, wrapText: true, horizontal: 'center' as const };
  const left = { vertical: 'middle' as const, wrapText: true, horizontal: 'left' as const };
  const dataStyle = { font: { name: FONT, size: 9 }, border: { top: { style: 'thin' as const }, bottom: { style: 'thin' as const }, left: { style: 'thin' as const }, right: { style: 'thin' as const } } };

  rows.forEach((r, i) => {
    const er = ws.getRow(7 + i);
    er.height = 24;
    const vals = [r.region, r.nucleo, r.extension, r.empresa, r.rif, r.responsable, r.telefono, r.tipoEmpresa, r.carreras, r.cantidadEstudiantes];
    vals.forEach((v, ci) => {
      const cell = er.getCell(ci + 1);
      cell.value = v !== null && v !== undefined ? (typeof v === 'string' ? v.toUpperCase() : v) : '';
      cell.font = dataStyle.font;
      cell.alignment = [7, 8, 10].includes(ci + 1) ? center : left;
      cell.border = dataStyle.border;
    });
  });

  // ── Merge region across entire column A (rowspan=rows.length) ──
  if (rows.length > 1) {
    ws.mergeCells(7, 1, 7 + rows.length - 1, 1);
  }

  // ── Subtotals ──
  const dataEnd = 7 + rows.length;
  const pub = rows.filter(r => r.tipoEmpresa.toUpperCase() === 'PÚBLICA').length;
  const priv = rows.filter(r => r.tipoEmpresa.toUpperCase() === 'PRIVADA').length;
  const totalEst = rows.reduce((s, r) => s + (r.cantidadEstudiantes || 0), 0);

  const sub = (c: any) => {
    c.font = { name: FONT, size: 10, bold: true, color: { argb: 'FF000000' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_BG } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };

  ws.getRow(dataEnd).height = 24;
  ws.mergeCells(dataEnd, 2, dataEnd, 3);
  sub(ws.getCell(dataEnd, 2)); ws.getCell(dataEnd, 2).value = 'SUB-TOTALES';
  [{ c: 4, v: rows.length }, { c: 5, v: pub }, { c: 6, v: priv }, { c: 10, v: totalEst }].forEach(({ c, v }) => {
    sub(ws.getCell(dataEnd, c));
    ws.getCell(dataEnd, c).value = v;
  });

  // ── Total instituciones ──
  const r1 = dataEnd + 1;
  ws.getRow(r1).height = 28;
  const tot = (c: any) => {
    c.font = { name: FONT, size: 11, bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };
  ws.mergeCells(r1, 2, r1, 3); tot(ws.getCell(r1, 2)); ws.getCell(r1, 2).value = 'TOTAL INSTITUCIONES';
  tot(ws.getCell(r1, 4)); ws.getCell(r1, 4).value = rows.length;

  // ── Total estudiantes solicitados ──
  const r2 = r1 + 1;
  ws.getRow(r2).height = 36;
  ws.mergeCells(r2, 2, r2, 3); tot(ws.getCell(r2, 2)); ws.getCell(r2, 2).value = `TOTAL ESTUDIANTES SOLICITADOS\nPARA EL ${periodLabel}`;
  tot(ws.getCell(r2, 4)); ws.getCell(r2, 4).value = totalEst;

  return workbook;
}

export async function generateRelacionEmpresasWorkbook(
  rows: RelacionEmpresaExcelRow[],
  periodLabel: string,
): Promise<Workbook> {
  const workbook = new ExcelJS.Workbook();
  const TOTAL = 9; // A-I

  if (rows.length === 0) {
    const ws = workbook.addWorksheet('Sin Datos');
    addEmptySheet(ws, 'No se encontraron registros para el período seleccionado.');
    return workbook;
  }

  const ws = workbook.addWorksheet('RELACIÓN');
  const FONT = 'Arial';
  const HDR_BG = 'FF8DB3E2';
  const SUB_BG = 'FF76923C';
  const TOTAL_BG = 'FFD6E3BC';

  // ── Fila 1: Membrete (120px) + logos ──
  ws.getRow(1).height = 120;
  ws.mergeCells(1, 1, 1, TOTAL);
  const mem = ws.getCell(1, 1);
  mem.value = MEMBRETE_TEXT;
  mem.font = { name: FONT, size: 9 };
  mem.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  addLogos(workbook, ws, TOTAL);

  // ── Fila 2: spacer ──
  ws.getRow(2).height = 6;

  // ── Fila 3: Form code ──
  ws.getRow(3).height = 18;
  ws.mergeCells(3, 1, 3, TOTAL);
  const code = ws.getCell(3, 1);
  code.value = 'Form-002-2019 CPA-VAC_jp';
  code.font = { name: FONT, size: 8, bold: true };
  code.alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Fila 4: spacer ──
  ws.getRow(4).height = 6;

  // ── Fila 5: Título (60px) ──
  ws.getRow(5).height = 60;
  ws.mergeCells(5, 1, 5, TOTAL);
  const title = ws.getCell(5, 1);
  title.value = {
    richText: [
      { text: 'RELACIÓN DE EMPRESAS O INSTITUCIONES QUE DEMANDA ASIGNACIÓN DE PASANTES', font: { name: FONT, size: 11, bold: true } },
      { text: `\nPARA EL PERÍODO ACADÉMICO ${periodLabel}`, font: { name: FONT, size: 11, bold: true, color: { argb: 'FFFF0000' } } },
    ],
  };
  title.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // ── Estilo header ──
  const hdr = {
    font: { name: FONT, size: 9, bold: true },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: HDR_BG } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: { top: { style: 'thin' as const }, bottom: { style: 'thin' as const }, left: { style: 'thin' as const }, right: { style: 'thin' as const } },
  };
  const setH = (c: any, v: string) => { c.value = v; c.font = hdr.font; c.fill = hdr.fill; c.alignment = hdr.alignment; c.border = hdr.border; };

  // ── Fila 6: HEADER ROW 1 (36px) — rowspan implícito via merge ──
  ws.getRow(6).height = 36;
  setH(ws.getCell(6, 1), 'REGIÓN');          ws.mergeCells(6, 1, 7, 1);
  setH(ws.getCell(6, 2), 'NÚCLEO');          ws.mergeCells(6, 2, 7, 2);
  setH(ws.getCell(6, 3), 'EXTENSIÓN');       ws.mergeCells(6, 3, 7, 3);
  setH(ws.getCell(6, 4), 'NOMBRE DE LA EMPRESA O INSTITUCIÓN'); ws.mergeCells(6, 4, 7, 4);
  setH(ws.getCell(6, 5), 'RIF');             ws.mergeCells(6, 5, 7, 5);
  ws.mergeCells(6, 6, 6, 7);                 setH(ws.getCell(6, 6), 'TIPO DE EMPRESA');
  setH(ws.getCell(6, 8), 'CARRERA');         ws.mergeCells(6, 8, 7, 8);
  setH(ws.getCell(6, 9), 'CANTIDAD DE\nESTUDIANTES\nSOLICITADOS'); ws.mergeCells(6, 9, 7, 9);

  // ── Fila 7: HEADER ROW 2 (50px) ──
  ws.getRow(7).height = 50;
  setH(ws.getCell(7, 6), 'PÚBLICA\n(Marque con una "X"\nsegún sea el caso)');
  setH(ws.getCell(7, 7), 'PRIVADA\n(Marque con una "X"\nsegún sea el caso)');

  // ── Column widths ──
  const empresaW = Math.min(Math.max(...rows.map(r => (r.empresa || '').length), 10) + 3, 55);
  const carreraW = Math.min(Math.max(...rows.map(r => (r.carrera || '').length), 10) + 3, 35);
  [12, 16, 16, empresaW, 16, 10, 10, carreraW, 10].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // ── Data rows ──
  const center = { vertical: 'middle' as const, wrapText: true, horizontal: 'center' as const };
  const left = { vertical: 'middle' as const, wrapText: true, horizontal: 'left' as const };
  const dataStyle = { font: { name: FONT, size: 9 }, border: { top: { style: 'thin' as const }, bottom: { style: 'thin' as const }, left: { style: 'thin' as const }, right: { style: 'thin' as const } } };

  rows.forEach((r, i) => {
    const er = ws.getRow(8 + i);
    er.height = 24;
    const vals = [r.region, r.nucleo, r.extension, r.empresa, r.rif, r.publica || '', r.privada || '', r.carrera, r.cantidadEstudiantes];
    vals.forEach((v, ci) => {
      const cell = er.getCell(ci + 1);
      cell.value = v !== null && v !== undefined ? (typeof v === 'string' ? v.toUpperCase() : v) : '';
      cell.font = dataStyle.font;
      cell.alignment = [6, 7, 9].includes(ci + 1) ? center : left;
      cell.border = dataStyle.border;
    });
  });

  // ── Merge region across entire column A (rowspan=rows.length) ──
  if (rows.length > 1) {
    ws.mergeCells(8, 1, 8 + rows.length - 1, 1);
  }

  // ── Subtotals ──
  const dataEnd = 8 + rows.length;
  const pub = rows.filter(r => r.publica === 'X').length;
  const priv = rows.filter(r => r.privada === 'X').length;
  const careers = new Set(rows.map(r => r.carrera)).size;
  const totalEst = rows.reduce((s, r) => s + (r.cantidadEstudiantes || 0), 0);

  const sub = (c: any) => {
    c.font = { name: FONT, size: 10, bold: true, color: { argb: 'FF000000' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_BG } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };

  ws.getRow(dataEnd).height = 24;
  ws.mergeCells(dataEnd, 2, dataEnd, 3);
  sub(ws.getCell(dataEnd, 2)); ws.getCell(dataEnd, 2).value = 'SUB-TOTALES';
  [{ c: 4, v: rows.length }, { c: 5, v: rows.length }, { c: 6, v: pub }, { c: 7, v: priv }, { c: 8, v: careers }, { c: 9, v: totalEst }].forEach(({ c, v }) => {
    sub(ws.getCell(dataEnd, c));
    ws.getCell(dataEnd, c).value = v;
  });

  // ── Total instituciones ──
  const r1 = dataEnd + 1;
  ws.getRow(r1).height = 28;
  const tot = (c: any) => {
    c.font = { name: FONT, size: 11, bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };
  ws.mergeCells(r1, 2, r1, 3); tot(ws.getCell(r1, 2)); ws.getCell(r1, 2).value = 'TOTAL INSTITUCIONES';
  tot(ws.getCell(r1, 4)); ws.getCell(r1, 4).value = rows.length;

  // ── Total estudiantes solicitados ──
  const r2 = r1 + 1;
  ws.getRow(r2).height = 36;
  ws.mergeCells(r2, 2, r2, 3); tot(ws.getCell(r2, 2)); ws.getCell(r2, 2).value = `TOTAL ESTUDIANTES SOLICITADOS\nPARA EL ${periodLabel}`;
  tot(ws.getCell(r2, 4)); ws.getCell(r2, 4).value = totalEst;

  return workbook;
}

export async function generateResumenPasantiasWorkbook(
  rows: ResumenPasantiaRow[],
  periodLabel: string,
): Promise<Workbook> {
  const workbook = new ExcelJS.Workbook();

  if (rows.length === 0) {
    const ws = workbook.addWorksheet('Sin Datos');
    addEmptySheet(ws, 'No se encontraron registros para el período seleccionado.');
    return workbook;
  }

  const ws = workbook.addWorksheet('RESUMEN');
  const TOTAL = 11; // A-K

  // ============================================================
  // Estilos
  // ============================================================
  const FONT = 'Arial';

  const STYLE_HEADER = {
    font: { name: FONT, size: 8, bold: true },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF99CC00' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  };

  // ============================================================
  // Anchos de columna (A-K)
  // ============================================================
  const COL_WIDTHS = [14, 14, 14, 24, 12, 12, 24, 8, 8, 12, 20];
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // ============================================================
  // FILA 1: espacio superior
  // ============================================================
  ws.getRow(1).height = 10;

  // ============================================================
  // FILA 2 (100px): membrete + logos
  // ============================================================
  ws.getRow(2).height = 100;

  ws.mergeCells(2, 1, 2, TOTAL);
  const membreteCell = ws.getCell(2, 1);
  membreteCell.value = MEMBRETE_TEXT;
  membreteCell.font = { name: FONT, size: 9 };
  membreteCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  addResumenLogos(workbook, ws);

  // ============================================================
  // FILA 3: espacio
  // ============================================================
  ws.getRow(3).height = 6;

  // ============================================================
  // FILA 4 (60px): TÍTULO + período (período en rojo)
  // ============================================================
  ws.getRow(4).height = 60;
  ws.mergeCells(4, 1, 4, TOTAL);
  const titleCell = ws.getCell(4, 1);
  titleCell.value = {
    richText: [
      { text: 'RESUMEN PASANTIAS', font: { name: FONT, size: 12, bold: true } },
      { text: `\n${periodLabel}`, font: { name: FONT, size: 12, bold: true, color: { argb: 'FFFF0000' } } },
    ],
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  titleCell.border = {
    top: { style: 'thin' },
    bottom: { style: 'medium' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };

  // ============================================================
  // FILA 5: espacio
  // ============================================================
  ws.getRow(5).height = 4;

  // ============================================================
  // FILA 6 (42px): HEADER ROW 1 (rowspan 2 en A-F)
  // A=REGIÓN, B=NÚCLEO, C=EXRTENSIÓN, D=NOMBRE DE LA CARRERA,
  // E=CANTIDAD DE TUTORES ACADEMICOS, F=CANTIDAD DE ESTUDIANTES,
  // G-K merged = CENTRO DE PRACTICA PROFESIONAL
  // ============================================================
  const h1 = ws.getRow(6);
  h1.height = 42;

  const setH = (cell: any, val: string) => {
    cell.value = val;
    cell.font = STYLE_HEADER.font;
    cell.fill = STYLE_HEADER.fill;
    cell.alignment = STYLE_HEADER.alignment;
    cell.border = STYLE_HEADER.border;
  };

  // A-F: rowspan 2 (merge row 6-7)
  setH(ws.getCell(6, 1), 'REGIÓN');         ws.mergeCells(6, 1, 7, 1);
  setH(ws.getCell(6, 2), 'NÚCLEO');         ws.mergeCells(6, 2, 7, 2);
  setH(ws.getCell(6, 3), 'EXRTENSIÓN');     ws.mergeCells(6, 3, 7, 3);
  setH(ws.getCell(6, 4), 'NOMBRE DE\nLA CARRERA'); ws.mergeCells(6, 4, 7, 4);
  setH(ws.getCell(6, 5), 'CANTIDAD DE\nTUTORES\nACADEMICOS'); ws.mergeCells(6, 5, 7, 5);
  setH(ws.getCell(6, 6), 'CANTIDAD\nDE\nESTUDIANTES'); ws.mergeCells(6, 6, 7, 6);

  // G-K: merged "CENTRO DE PRACTICA PROFESIONAL"
  ws.mergeCells(6, 7, 6, 11);
  setH(ws.getCell(6, 7), 'CENTRO DE PRACTICA PROFESIONAL');

  // ============================================================
  // FILA 7 (42px): HEADER ROW 2 — sub-headers bajo CENTRO
  // G=NOMBRE DE LA EMPRESA / INSTITUCION, H=PÚBLICA, I=PRIVADA,
  // J=CANTIDAD DE TUTORES INSTITUCIONALES, K=OBSERVACION
  // ============================================================
  const h2 = ws.getRow(7);
  h2.height = 42;

  setH(ws.getCell(7, 7), 'NOMBRE DE LA\nEMPRESA / INSTITUCION');
  setH(ws.getCell(7, 8), 'PÚBLICA');
  setH(ws.getCell(7, 9), 'PRIVADA');
  setH(ws.getCell(7, 10), 'CANTIDAD DE\nTUTORES\nINSTITUCIONALES');
  setH(ws.getCell(7, 11), 'OBSERVACION');

  // ============================================================
  // FILAS DE DATOS (desde fila 8) — TODO centrado
  // ============================================================
  rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(8 + rowIdx);
    excelRow.height = 28;

    const isLastRow = rowIdx === rows.length - 1;
    const noBoldBorder = isLastRow ? { style: 'medium' as const } : { style: 'thin' as const };

    const cellVals: (string | number)[] = [
      row.region,
      row.nucleo,
      row.extension,
      row.carrera,
      row.cantidadTutoresAcad,
      row.cantidadEstudiantes,
      row.empresa,
      (row.tipo || '').toUpperCase() === 'PÚBLICA' ? 'X' : '',
      (row.tipo || '').toUpperCase() === 'PRIVADA' ? 'X' : '',
      row.cantidadTutoresInst,
      row.observacion,
    ];

    cellVals.forEach((val, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.value = val ?? '';
      cell.font = { name: FONT, size: 9 };
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
        horizontal: 'center',
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: noBoldBorder,
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  return workbook;
}

// ============================================================
// Logos para hoja resumen (posicionados sobre fila 2, 11 cols)
// ============================================================

function addResumenLogos(workbook: Workbook, ws: Worksheet): void {
  const logoPaths = findLogoPaths();
  if (!logoPaths) return;

  try {
    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: 0.1, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }

    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: 9.8, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }
  } catch (err) {
    console.warn('[excel-export] No se pudieron cargar las imágenes:', (err as Error).message);
  }
}

// ============================================================
// Hoja individual de tutor (formato RELACIÓN INDIVIDUAL)
// ============================================================

function addIndividualTutorSheet(workbook: Workbook, ws: Worksheet, config: IndividualTutorSheetConfig): void {
  const totalCols = INDIVIDUAL_TOTAL_COLS;
  const rows = config.rows;

  // ── Fila 1: Membrete ──
  ws.mergeCells(ROW_MEMBRETE, 1, ROW_MEMBRETE, totalCols);
  const membreteCell = ws.getCell(ROW_MEMBRETE, 1);
  membreteCell.value = MEMBRETE_TEXT;
  membreteCell.font = STYLES.membrete.font;
  membreteCell.alignment = STYLES.membrete.alignment;
  ws.getRow(ROW_MEMBRETE).height = 80;

  addLogos(workbook, ws, totalCols);

  // ── Fila 3: espacio ──
  ws.getRow(ROW_BLANK_1).height = 6;

  // ── Fila 4: Título ──
  ws.mergeCells(ROW_TITLE, 1, ROW_TITLE, totalCols);
  const titleCell = ws.getCell(ROW_TITLE, 1);
  titleCell.value = {
    richText: [
      { text: 'FORMATO DE RELACIÓN INDIVIDUAL\nDE DOCENTES CONTRATADOS U ORDINARIOS CON DEDICACIÓN MEDIO TIEMPO (MT), TIEMPO COMPLETO (TC) Y DEDICACIÓN EXCLUSIVA (DE) QUE SE ENCUENTRAN TUTORANDO ESTUDIANTES DE PRACTICAS PROFESIONALES ( PASANTIAS )', font: { name: FONT_NAME, size: 10, bold: true } },
    ],
  };
  titleCell.font = STYLES.title.font;
  titleCell.alignment = STYLES.title.alignment;
  ws.getRow(ROW_TITLE).height = 48;

  // ── Fila 5: Período ──
  ws.mergeCells(ROW_CODE, 1, ROW_CODE, totalCols);
  const codeCell = ws.getCell(ROW_CODE, 1);
  codeCell.value = `PERIODO ACADÉMICO ${config.periodLabel}`;
  codeCell.font = { name: FONT_NAME, size: 9, bold: true, color: { argb: 'FFFF0000' } };
  codeCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(ROW_CODE).height = 18;

  // ── Fila 6: espacio ──
  ws.getRow(ROW_BLANK_2).height = 4;

  // ── Fila 7: Nombre del tutor (celda combinada con fondo amarillo) ──
  ws.mergeCells(ROW_TUTOR_NAME, 1, ROW_TUTOR_NAME, totalCols);
  const tutorNameCell = ws.getCell(ROW_TUTOR_NAME, 1);
  const tutorFullName = `${config.tutorName} ${config.tutorApellido}`.trim();
  tutorNameCell.value = `NOMBRE DEL TUTOR (A) ACADÉMICO: ${tutorFullName.toUpperCase()}`;
  tutorNameCell.font = { name: FONT_NAME, size: 10, bold: true };
  tutorNameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  tutorNameCell.alignment = { horizontal: 'left', vertical: 'middle' };
  tutorNameCell.border = {
    top: { style: 'medium' },
    bottom: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  ws.getRow(ROW_TUTOR_NAME).height = 22;

  // ── Fila 8: Encabezados principales (fila 1) ──
  const h1 = ws.getRow(ROW_INDIVIDUAL_HEADER_1);
  h1.height = 36;

  const g = headerCell(HDR_GREEN);

  // Col 1: N° (rowspan 2 → merge)
  setCell(h1.getCell(1), 'N°', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 1, ROW_INDIVIDUAL_HEADER_2, 1);

  setCell(h1.getCell(2), 'REGIÓN', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 2, ROW_INDIVIDUAL_HEADER_2, 2);

  setCell(h1.getCell(3), 'NÚCLEO', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 3, ROW_INDIVIDUAL_HEADER_2, 3);

  setCell(h1.getCell(4), 'EXTENSIÓN', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 4, ROW_INDIVIDUAL_HEADER_2, 4);

  setCell(h1.getCell(5), 'CARRERA', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 5, ROW_INDIVIDUAL_HEADER_2, 5);

  setCell(h1.getCell(6), 'NOMBRE DEL (DE LA) ESTUDIANTE', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 6, ROW_INDIVIDUAL_HEADER_2, 6);

  setCell(h1.getCell(7), 'APELLIDO DEL (DE LA) ESTUDIANTE', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 7, ROW_INDIVIDUAL_HEADER_2, 7);

  setCell(h1.getCell(8), 'CÉDULA', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 8, ROW_INDIVIDUAL_HEADER_2, 8);

  // Col 9-10: SEXO (colspan=2, no rowspan)
  setCell(h1.getCell(9), 'SEXO', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 9, ROW_INDIVIDUAL_HEADER_1, 10);

  // Col 11-13: TIPO DE ESTUDIANTE (colspan=3)
  setCell(h1.getCell(11), 'TIPO DE ESTUDIANTE', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 11, ROW_INDIVIDUAL_HEADER_1, 13);

  setCell(h1.getCell(14), 'TELÉFONO', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 14, ROW_INDIVIDUAL_HEADER_2, 14);

  setCell(h1.getCell(15), 'INSTITUCIÓN', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 15, ROW_INDIVIDUAL_HEADER_2, 15);

  // Col 16: TIPO DE INSTITUCIÓN (solo fila 1, la fila 2 tendrá sub-header)
  setCell(h1.getCell(16), 'TIPO DE INSTITUCIÓN', g);

  setCell(h1.getCell(17), 'TUTOR INSTITUCIONAL', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 17, ROW_INDIVIDUAL_HEADER_2, 17);

  setCell(h1.getCell(18), 'DIRECCIÓN DE UBICACIÓN DEL CENTRO DE PRÁCTICA PROFESIONAL', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 18, ROW_INDIVIDUAL_HEADER_2, 18);

  setCell(h1.getCell(19), 'OBSERVACIONES', g);
  ws.mergeCells(ROW_INDIVIDUAL_HEADER_1, 19, ROW_INDIVIDUAL_HEADER_2, 19);

  // ── Fila 9: Sub-encabezados ──
  const h2 = ws.getRow(ROW_INDIVIDUAL_HEADER_2);
  h2.height = 50;

  // Col 9-10: sub de SEXO
  setCell(h2.getCell(9), 'FEMENINO', g);
  setCell(h2.getCell(10), 'MASCULINO', g);

  // Col 11-13: sub de TIPO
  setCell(h2.getCell(11), 'CIVIL', g);
  setCell(h2.getCell(12), 'MILITAR', g);
  setCell(h2.getCell(13), 'RANGO\n(EN CASO DE SER MILITAR)', g);

  // Col 16: sub de TIPO DE INSTITUCIÓN
  setCell(h2.getCell(16), 'PÚBLICA / PRIVADA / MIXTA', g);

  // ── Ancho de columnas ──
  const colWidths = [5, 12, 14, 14, 22, 18, 18, 14, 10, 10, 8, 8, 14, 14, 22, 16, 24, 26, 18];
  colWidths.forEach((w, idx) => { ws.getColumn(idx + 1).width = w; });

  // ── Filas de datos ──
  rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(ROW_INDIVIDUAL_DATA_START + rowIdx);
    excelRow.height = 47;
    const data = [
      row.nro,
      row.region,
      row.nucleo,
      row.extension,
      row.carrera,
      row.estudianteNombre,
      row.estudianteApellido,
      row.estudianteCi,
      row.sexo === 'F' ? 'X' : '',
      row.sexo === 'M' ? 'X' : '',
      row.tipo === 'CIV' || row.tipo === 'CIVIL' ? 'X' : '',
      row.tipo === 'MILITAR' ? 'X' : '',
      row.rango || '',
      row.telefono,
      row.institucion,
      row.tipoInstitucion,
      row.tutorInst,
      row.direccion,
      row.observaciones,
    ];

    data.forEach((val, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.value = val !== null && val !== undefined
        ? (typeof val === 'string' ? val.toUpperCase() : val)
        : '';
      cell.font = INDIVIDUAL_DATA_STYLE.font;
      cell.alignment = {
        ...INDIVIDUAL_DATA_STYLE.alignment,
        horizontal: 'center',
      };
      cell.border = INDIVIDUAL_DATA_STYLE.border;
    });
  });

  // ponytail: sin altura fija en filas → Excel auto-ajusta para cadenas largas
}

// ============================================================
// Hoja RELACIÓN GENERAL (formato oficial UNEFA ANEXO)
// ============================================================

/** Hoja general de tutores académicos — 18 columnas (A=margen, B‑R=datos) */
function addGeneralTutorSheet(workbook: Workbook, ws: Worksheet, section: SheetSection): void {
  const DATA_KEYS = section.columns.map(c => c.key);
  // columnas físicas: 1=A(margen), 2‑18=B‑R
  const COL_FIRST = 2; // B
  const COL_LAST = 18; // R
  const TOTAL = COL_LAST;

  // ── Estilos ──
  const FONT = 'Arial';
  const STYLE_HEADER = {
    font: { name: FONT, size: 8, bold: true },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF99CC00' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  };
  const STYLE_HEADER_LAST = {
    ...STYLE_HEADER,
    border: { ...STYLE_HEADER.border, right: { style: 'medium' as const } },
  };
  const STYLE_CELL = {
    font: { name: FONT, size: 8 },
    alignment: { vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  };
  const STYLE_CELL_LEFT = { ...STYLE_CELL, border: { ...STYLE_CELL.border, left: { style: 'medium' as const } } };
  const STYLE_CELL_RIGHT = { ...STYLE_CELL, border: { ...STYLE_CELL.border, right: { style: 'medium' as const } } };
  const STYLE_CELL_BOTH = { ...STYLE_CELL, border: { ...STYLE_CELL.border, left: { style: 'medium' as const }, right: { style: 'medium' as const } } };

  // ── Anchos de columna ──
  const COL_WIDTHS = [3, 5, 14, 14, 14, 24, 14, 14, 14, 14, 14, 14, 14, 14, 14, 20, 14, 18];
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // ============================================================
  // FILA 1: vacía (espaciado superior)
  // ============================================================
  ws.getRow(1).height = 16;

  // ============================================================
  // FILA 2 (100px): membrete — SOA code + UNEFA header + logos
  // ============================================================
  ws.getRow(2).height = 100;

  // Código "SOA-PP-001-3" en col C (col 3)
  const codeCell = ws.getCell(2, 3);
  codeCell.value = 'SOA-PP-001-3';
  codeCell.font = { name: FONT, size: 8, bold: true };
  codeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // UNEFA header — merge D(4) a R(18)
  ws.mergeCells(2, 4, 2, TOTAL);
  const unefaCell = ws.getCell(2, 4);
  unefaCell.value = MEMBRETE_TEXT;
  unefaCell.font = { name: FONT, size: 9 };
  unefaCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Logos (posicionados sobre esta fila)
  addGeneralTutorLogos(workbook, ws);

  // ============================================================
  // FILA 3: espacio 6px
  // ============================================================
  ws.getRow(3).height = 6;

  // ============================================================
  // FILA 4 (74px): TÍTULO + período (bottom border medium)
  // ============================================================
  ws.getRow(4).height = 74;
  ws.mergeCells(4, COL_FIRST, 4, COL_LAST);
  const titleCell = ws.getCell(4, COL_FIRST);
  const titleText = section.title;
  const periodText = section.periodLabel;
  titleCell.value = {
    richText: [
      { text: titleText.toUpperCase(), font: { name: FONT, size: 11, bold: true } },
      { text: `\n${periodText}`, font: { name: FONT, size: 11, bold: true } },
    ],
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  titleCell.border = {
    top: { style: 'thin' },
    bottom: { style: 'medium' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };

  // ============================================================
  // FILA 5 (50px): ENCABEZADOS VERDES #99CC00
  // ============================================================
  ws.getRow(5).height = 50;

  // Cabeceras con merges: NOMBRE(2cols), APELLIDO(2cols), CORREO(2cols)
  const headers: { text: string; col: number; colspan: number }[] = [
    { text: 'N°', col: 2, colspan: 1 },
    { text: 'REGIÓN', col: 3, colspan: 1 },
    { text: 'NÚCLEO', col: 4, colspan: 1 },
    { text: 'EXTENSIÓN', col: 5, colspan: 1 },
    { text: 'CARRERA', col: 6, colspan: 1 },
    { text: 'NOMBRE DEL TUTOR (A)', col: 7, colspan: 2 },
    { text: 'APELLIDO DEL TUTOR (A)', col: 9, colspan: 2 },
    { text: 'CÉDULA', col: 11, colspan: 1 },
    { text: 'CONDICIÓN', col: 12, colspan: 1 },
    { text: 'DEDICACIÓN', col: 13, colspan: 1 },
    { text: 'CATEGORÍA', col: 14, colspan: 1 },
    { text: 'TELÉFONO', col: 15, colspan: 1 },
    { text: 'CORREO ELECTRÓNICO', col: 16, colspan: 2 },
    { text: 'CANTIDAD DE ESTUDIANTES ATENDIDOS', col: 18, colspan: 1 },
  ];

  headers.forEach((h, idx) => {
    const isLast = (idx === headers.length - 1);
    const style = isLast ? STYLE_HEADER_LAST : STYLE_HEADER;
    const col = h.col;
    if (h.colspan > 1) {
      ws.mergeCells(5, col, 5, col + h.colspan - 1);
    }
    const cell = ws.getCell(5, col);
    cell.value = h.text;
    cell.font = style.font;
    cell.fill = style.fill;
    cell.alignment = style.alignment;
    cell.border = isLast
      ? { ...style.border, right: { style: 'medium' } }
      : h.col === 5
        ? { ...style.border, right: { style: 'medium' } }
        : style.border;
  });

  // ============================================================
  // FILAS DE DATOS (47px) con bordes
  // ============================================================
  section.rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(6 + rowIdx);
    excelRow.height = 47;

    const isLastRow = rowIdx === section.rows.length - 1;

    // Mapa: key → valor
    const val = (key: string) => {
      const v = row[key];
      return v !== null && v !== undefined
        ? (typeof v === 'string' ? v.toUpperCase() : v)
        : '';
    };

    const dataCols: { key: string; physCol: number }[] = [
      { key: 'nro', physCol: 2 },
      { key: 'region', physCol: 3 },
      { key: 'nucleo', physCol: 4 },
      { key: 'extension', physCol: 5 },
      { key: 'carrera', physCol: 6 },
      { key: 'nombreTutor', physCol: 7 },  // NOMBRE (col 7-8 merged)
      { key: 'apellidoTutor', physCol: 9 }, // APELLIDO (col 9-10 merged)
      { key: 'cedula', physCol: 11 },
      { key: 'condicion', physCol: 12 },
      { key: 'dedicacion', physCol: 13 },
      { key: 'categoria', physCol: 14 },
      { key: 'telefono', physCol: 15 },
      { key: 'correo', physCol: 16 },       // CORREO (col 16-17 merged)
      { key: 'cantidadEstudiantes', physCol: 18 },
    ];

    // Merges de datos: nombreTutor → cols 7-8, apellidoTutor → cols 9-10, correo → cols 16-17
    // Los merges se aplican a TODAS las filas de datos, no solo a la primera
    const dataRow = 6 + rowIdx;
    ws.mergeCells(dataRow, 7, dataRow, 8);   // nombreTutor
    ws.mergeCells(dataRow, 9, dataRow, 10);  // apellidoTutor
    ws.mergeCells(dataRow, 16, dataRow, 17); // correo

    dataCols.forEach(({ key, physCol }) => {
      const cell = excelRow.getCell(physCol);
      cell.value = val(key);
      cell.font = STYLE_CELL.font;
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
        horizontal: 'center',
      };
      // Bordes: medium en laterales
      const isFirstDataCol = (physCol === COL_FIRST);
      const isLastDataCol = (physCol === COL_LAST);
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: isLastRow ? 'medium' : 'thin' },
        left: { style: isFirstDataCol ? 'medium' : 'thin' },
        right: { style: isLastDataCol ? 'medium' : 'thin' },
      };
    });
  });

  // ============================================================
  // FILA post‑datos: código "MA/JR.ENE.2014"
  // ============================================================
  const codeRow = 6 + section.rows.length;
  ws.getRow(codeRow).height = 18;
  const footerCodeCell = ws.getCell(codeRow, 15);
  footerCodeCell.value = 'MA/JR.ENE.2014';
  footerCodeCell.font = { name: FONT, size: 8 };
  footerCodeCell.alignment = { horizontal: 'right', vertical: 'middle' };

  // ============================================================
  // NOTAS al pie (fondo amarillo #FFCC00)
  // ============================================================
  const notes = section.footerNotes ?? DEFAULT_FOOTER_NOTES;
  const noteStartRow = codeRow + 1;
  notes.forEach((note, idx) => {
    const r = noteStartRow + idx;
    ws.getRow(r).height = 20;
    ws.mergeCells(r, COL_FIRST, r, COL_LAST);
    const cell = ws.getCell(r, COL_FIRST);

    // La nota 3 (Debe realizar un archivo por cada carrera) en rojo
    const isRed = note.includes('archivo por cada carrera');
    cell.value = `Nota: ${isRed ? note.replace('Nota:', '') : note}`;
    cell.font = { name: FONT, size: 8, italic: !isRed, color: isRed ? { argb: 'FFFF0000' } : undefined };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } };
    cell.alignment = { vertical: 'top', wrapText: true };
  });

  // ── Fila en blanco para separar notas de las firmas ──
  const blankBeforeSig = noteStartRow + notes.length + 1;
  ws.getRow(blankBeforeSig).height = 28;

  // ============================================================
  // FIRMAS — una fila, 3 firmantes con separación
  // ============================================================
  const sigLabels = section.signatures ?? DEFAULT_SIGNATURES;
  const sigRow = blankBeforeSig + 1;
  const sigRowObj = ws.getRow(sigRow);
  sigRowObj.height = 54;

  // cada firmante tiene su rango con espacio separador entre sí
  const sigSections = [
    { text: sigLabels[0] || '', start: 2, end: 5, sepAfter: 6 },
    { text: sigLabels[1] || '', start: 7, end: 10, sepAfter: 11 },
    { text: sigLabels[2] || '', start: 12, end: 17, sepAfter: null },
  ];

  sigSections.forEach(({ text, start, end, sepAfter }) => {
    // Línea de firma (borde superior) en el rango del firmante
    for (let c = start; c <= end; c++) {
      const cell = ws.getCell(sigRow, c);
      cell.border = { top: { style: 'thin' } };
    }
    // Borrar borde en la columna separadora (sin línea)
    if (sepAfter) {
      ws.getCell(sigRow, sepAfter).border = {};
    }
    // Etiqueta centrada
    if (end > start) {
      ws.mergeCells(sigRow, start, sigRow, end);
    }
    const cell = ws.getCell(sigRow, start);
    cell.value = text;
    cell.font = { name: FONT, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
}

// ============================================================
// Logos para la hoja general (posicionados sobre fila 2)
// ============================================================

function addGeneralTutorLogos(workbook: Workbook, ws: Worksheet): void {
  const logoPaths = findLogoPaths();
  if (!logoPaths) return;

  try {
    // Logo UNEFA (izquierda) — col A-B, row 2
    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: 0.2, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }

    // Escudo (derecha) — col Q-R row 2
    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: 16.5, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }
  } catch (err) {
    console.warn('[excel-export] No se pudieron cargar las imágenes:', (err as Error).message);
  }
}

function setCell(cell: any, value: string, style: any): void {
  cell.value = value;
  cell.font = style.font;
  cell.fill = style.fill;
  cell.alignment = style.alignment;
  cell.border = style.border;
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
