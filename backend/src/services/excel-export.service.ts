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
  /** RIF de la institución */
  rifInstitucion?: string;
  tipoInstitucion: string;
  /** Marcar con X si es empresa de convenio */
  convenioX?: boolean;
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
  responsable: string;
  telefonoContacto: string;
  tipoEmpresa: string;
  carreras: string;
  cantidadEstudiantes: number;
  responsableTitulo?: string;
}

// ============================================================
// Membrete institucional
// ============================================================

const INSTITUTIONAL_HEADER = [
  'REPÚBLICA BOLIVARIANA DE VENEZUELA',
  'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
  'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
  'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
  'VICERRECTORADO DE LA REGIÓN LOS LLANOS',
  'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA',
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

function addLogos(workbook: Workbook, ws: Worksheet, totalCols: number, swap: boolean = false): void {
  const logoPaths = findLogoPaths();

  if (!logoPaths) return;

  try {
    const logoCol = swap ? totalCols - 1.5 : 0;
    const escudoCol = swap ? 0 : totalCols - 1.5;

    // Escudo
    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: escudoCol, row: ROW_MEMBRETE - 1 + 0.2 },
        ext: { width: 85, height: 85 },
      });
    }

    // Logo UNEFA
    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: logoCol, row: ROW_MEMBRETE - 1 + 0.2 },
        ext: { width: 85, height: 85 },
      });
    }
  } catch (err) {
    console.warn('[excel-export] No se pudieron cargar las imágenes:', (err as Error).message);
  }
}

function findLogoPaths(): { logo: string; escudo: string } | null {
  const candidates = [
    // 1) backend/public/ — self-contained, works in ALL deployments (Render, Docker, local)
    path.resolve(__dirname, '../../public/logo-nuevo.png'),
    path.resolve(__dirname, '../../public/unefa-img/Escudo.png'),
    // 2) Project root public/ — works when backend runs from repo root
    path.resolve(__dirname, '../../../public/logo-nuevo.png'),
    path.resolve(__dirname, '../../../public/unefa-img/Escudo.png'),
    // 3) Fallback desde backend/
    path.resolve(process.cwd(), '../public/logo-nuevo.png'),
    path.resolve(process.cwd(), '../public/unefa-img/Escudo.png'),
    // 4) Fallback directo
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

// ============================================================
// Estilos compartidos ANEXO 4 — Tutores Académicos
// ============================================================

const ANEXO4_FONT = { name: 'Arial', size: 11 };

const ANEXO4_HEADER_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF92D050' },
};

const ANEXO4_HEADER_BORDER = {
  top: { style: 'medium' as const },
  bottom: { style: 'medium' as const },
  left: { style: 'medium' as const },
  right: { style: 'medium' as const },
};

const ANEXO4_DATA_BORDER = {
  top: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
  right: { style: 'thin' as const },
};

const ANEXO4_YELLOW_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFFFFF00' },
};

/** Encabezado institucional ANEXO 4 (sin línea de MINISTERIO) */
const ANEXO4_HEADER_TEXT = [
  'REPÚBLICA BOLIVARIANA DE VENEZUELA',
  'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
  'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
  'VICERRECTORADO ACADÉMICO',
  'COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA',
].join('\n');

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
  const HDR_BG = 'FF8DB3E2';        // azul claro (se mantiene)
  const SUB_BG_BLUE = 'FF4472C4';    // azul medio (reemplaza verde)
  const TOTAL_BG_BLUE = 'FFBDD7EE';  // azul muy claro (reemplaza verde claro)

  // Membrete filtrado: sin NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA
  const instMembrete = INSTITUTIONAL_HEADER
    .filter(l => l !== 'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA')
    .join('\n');

  // ── Fila 1: Membrete (120px) + logos swapeados ──
  ws.getRow(1).height = 120;
  ws.mergeCells(1, 1, 1, TOTAL);
  const mem = ws.getCell(1, 1);
  mem.value = instMembrete;
  mem.font = { name: FONT, size: 9 };
  mem.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  addLogos(workbook, ws, TOTAL, true);

  // ── Fila 2: spacer ──
  ws.getRow(2).height = 6;

  // ── Fila 3: Form code bajo logo izquierdo ──
  ws.getRow(3).height = 18;
  ws.mergeCells(3, 1, 3, TOTAL);
  const code = ws.getCell(3, 1);
  code.value = 'form-002-2019 CPA-VAC_jp';
  code.font = { name: FONT, size: 8, bold: true };
  code.alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Fila 4: spacer ──
  ws.getRow(4).height = 6;

  // ── Fila 5: Título (60px) — todo negro ──
  ws.getRow(5).height = 60;
  ws.mergeCells(5, 1, 5, TOTAL);
  const title = ws.getCell(5, 1);
  title.value = {
    richText: [
      { text: 'RELACIÓN DE EMPRESAS O INSTITUCIONES QUE DEMANDAN ASIGNACIONES DE PASANTES', font: { name: FONT, size: 11, bold: true } },
      { text: `\nPARA EL PERIODO ACADÉMICO ${periodLabel}`, font: { name: FONT, size: 11, bold: true } },
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

  // ── Fila 6: HEADER ROW (24px) ──
  ws.getRow(6).height = 24;
  setH(ws.getCell(6, 1), 'REGIÓN');
  setH(ws.getCell(6, 2), 'NÚCLEO');
  setH(ws.getCell(6, 3), 'EXTENSIÓN');
  setH(ws.getCell(6, 4), 'NOMBRE DE LA EMPRESA\nO INSTITUCIÓN');
  setH(ws.getCell(6, 5), 'RESPONSABLE');
  setH(ws.getCell(6, 6), 'NUMERO DE\nCONTACTO');
  setH(ws.getCell(6, 7), 'TIPO DE\nEMPRESA');
  setH(ws.getCell(6, 9), 'CARRERAS');
  setH(ws.getCell(6, 10), 'CANTIDAD DE\nESTUDIANTES');

  // ── Fila 7: Sub-headers para TIPO DE EMPRESA (PÚBLICA | PRIVADA) ──
  ws.getRow(7).height = 20;
  setH(ws.getCell(7, 7), 'PÚBLICA');
  setH(ws.getCell(7, 8), 'PRIVADA');

  // Merge header cells for TIPO DE EMPRESA
  ws.mergeCells(6, 7, 6, 8); // "TIPO DE EMPRESA" spans columns 7-8

  // ── Column widths ──
  const empresaW = Math.min(Math.max(...rows.map(r => (r.empresa || '').length), 10) + 3, 65);
  const carrerasW = Math.min(Math.max(...rows.map(r => (r.carreras || '').length), 10) + 3, 35);
  [12, 16, 16, empresaW, 30, 16, 8, 8, carrerasW, 10].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // ── Phone format: 0000 - 0000000 ──
  const formatPhone = (phone: string): string => {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length >= 11) {
      return `${digits.slice(0, 4)} - ${digits.slice(4, 11)}`;
    }
    if (digits.length >= 7) {
      return `${digits.slice(0, 4)} - ${digits.slice(4)}`;
    }
    return phone || '';
  };

  // ── Data rows (start at row 8) ──
  const center = { vertical: 'middle' as const, wrapText: true, horizontal: 'center' as const };
  const left = { vertical: 'middle' as const, wrapText: true, horizontal: 'left' as const };
  const dataStyle = { font: { name: FONT, size: 9 }, border: { top: { style: 'thin' as const }, bottom: { style: 'thin' as const }, left: { style: 'thin' as const }, right: { style: 'thin' as const } } };

  rows.forEach((r, i) => {
    const er = ws.getRow(8 + i);
    er.height = 24;
    const tipo = (r.tipoEmpresa || '').toUpperCase();
    const vals = [
      r.region, r.nucleo, r.extension, r.empresa, r.responsable,
      formatPhone(r.telefonoContacto),
      tipo === 'PÚBLICA' ? 'X' : '',
      tipo === 'PRIVADA' ? 'X' : '',
      r.carreras,
      r.cantidadEstudiantes,
    ];
    vals.forEach((v, ci) => {
      const cell = er.getCell(ci + 1);
      cell.value = v !== null && v !== undefined ? (typeof v === 'string' ? v.toUpperCase() : v) : '';
      cell.font = dataStyle.font;
      cell.alignment = [7, 8, 10].includes(ci + 1) ? center : left;
      cell.border = dataStyle.border;
    });
  });

  // ── Merge vertical de REGIÓN ──
  if (rows.length > 1) {
    ws.mergeCells(8, 1, 8 + rows.length - 1, 1);
  }

  // ── Subtotals (bold todo) ──
  const dataEnd = 8 + rows.length;
  const pub = rows.filter(r => r.tipoEmpresa.toUpperCase() === 'PÚBLICA').length;
  const priv = rows.filter(r => r.tipoEmpresa.toUpperCase() === 'PRIVADA').length;
  const totalEst = rows.reduce((s, r) => s + (r.cantidadEstudiantes || 0), 0);

  const sub = (c: any) => {
    c.font = { name: FONT, size: 10, bold: true, color: { argb: 'FF000000' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_BG_BLUE } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };

  ws.getRow(dataEnd).height = 24;
  ws.mergeCells(dataEnd, 2, dataEnd, 3);
  sub(ws.getCell(dataEnd, 2)); ws.getCell(dataEnd, 2).value = 'SUB-TOTALES';
  [{ c: 4, v: rows.length }, { c: 7, v: pub }, { c: 8, v: priv }, { c: 10, v: totalEst }].forEach(({ c, v }) => {
    sub(ws.getCell(dataEnd, c));
    ws.getCell(dataEnd, c).value = v;
  });

  // ── Merge vertical REGIÓN hasta totales ──
  if (rows.length > 1) {
    ws.mergeCells(8, 1, dataEnd + 2, 1);
  }

  // ── Total instituciones (título normal, número bold) ──
  const r1 = dataEnd + 1;
  ws.getRow(r1).height = 28;
  const totTitle = (c: any) => {
    c.font = { name: FONT, size: 11, bold: false };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG_BLUE } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };
  const totValue = (c: any) => {
    c.font = { name: FONT, size: 11, bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG_BLUE } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };
  ws.mergeCells(r1, 2, r1, 3); totTitle(ws.getCell(r1, 2)); ws.getCell(r1, 2).value = 'TOTAL INSTITUCIONES';
  totValue(ws.getCell(r1, 4)); ws.getCell(r1, 4).value = rows.length;

  // ── Total estudiantes solicitados (título normal, número bold) ──
  const r2 = r1 + 1;
  ws.getRow(r2).height = 36;
  ws.mergeCells(r2, 2, r2, 3); totTitle(ws.getCell(r2, 2)); ws.getCell(r2, 2).value = 'TOTAL ESTUDIANTES SOLICITADOS';
  totValue(ws.getCell(r2, 4)); ws.getCell(r2, 4).value = totalEst;

  return workbook;
}

function formatRifBackend(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/\D/g, '');
  if (cleaned.length <= 8) return cleaned;
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 9)}`;
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

  // Membrete filtrado: sin "NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA"
  const empresaMembrete = INSTITUTIONAL_HEADER.filter(l => l !== 'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA').join('\n');

  // ── Fila 1: Membrete (120px) + logos (swapeados) ──
  ws.getRow(1).height = 120;
  ws.mergeCells(1, 1, 1, TOTAL);
  const mem = ws.getCell(1, 1);
  mem.value = empresaMembrete;
  mem.font = { name: FONT, size: 9 };
  mem.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  addLogos(workbook, ws, TOTAL, true);

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

  // ── Fila 5: Título (60px) — todo negro, sin "PARA EL PERÍODO ACADÉMICO" ──
  ws.getRow(5).height = 60;
  ws.mergeCells(5, 1, 5, TOTAL);
  const title = ws.getCell(5, 1);
  title.value = {
    richText: [
      { text: 'RELACIÓN DE EMPRESAS O INSTITUCIONES QUE DEMANDA ASIGNACIÓN DE PASANTES', font: { name: FONT, size: 11, bold: true } },
      { text: `\n${periodLabel}`, font: { name: FONT, size: 11, bold: true } },
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
  setH(ws.getCell(6, 8), 'CARRERA');        ws.mergeCells(6, 8, 7, 8);
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
    const rifFmt = formatRifBackend(r.rif || '');
    const vals: (string | number)[] = [r.region, r.nucleo, r.extension, r.empresa, rifFmt, r.publica || '', r.privada || '', r.carrera, r.cantidadEstudiantes];
    vals.forEach((v, ci) => {
      const cell = er.getCell(ci + 1);
      cell.value = v !== null && v !== undefined ? (typeof v === 'string' ? v.toUpperCase() : v) : '';
      cell.font = dataStyle.font;
      cell.alignment = [6, 7, 9].includes(ci + 1) ? center : left;
      cell.border = dataStyle.border;
    });
  });

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

  // ── Merge vertical de REGIÓN desde primera fila datos hasta subtotal+totales ──
  if (rows.length > 1) {
    ws.mergeCells(8, 1, dataEnd + 2, 1);
  }

  // ── Total instituciones (título normal, número bold) ──
  const r1 = dataEnd + 1;
  ws.getRow(r1).height = 28;
  const totTitle = (c: any) => {
    c.font = { name: FONT, size: 11, bold: false };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };
  const totValue = (c: any) => {
    c.font = { name: FONT, size: 11, bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  };
  ws.mergeCells(r1, 2, r1, 3); totTitle(ws.getCell(r1, 2)); ws.getCell(r1, 2).value = 'TOTAL INSTITUCIONES';
  totValue(ws.getCell(r1, 4)); ws.getCell(r1, 4).value = rows.length;

  // ── Total estudiantes solicitados (título normal, número bold) ──
  const r2 = r1 + 1;
  ws.getRow(r2).height = 36;
  ws.mergeCells(r2, 2, r2, 3); totTitle(ws.getCell(r2, 2)); ws.getCell(r2, 2).value = 'TOTAL ESTUDIANTES SOLICITADOS';
  totValue(ws.getCell(r2, 4)); ws.getCell(r2, 4).value = totalEst;

  return workbook;
}

export async function generateResumenPasantiasWorkbook(
  rows: ResumenPasantiaRow[],
  periodLabel: string,
): Promise<Workbook> {
  // Limpiar "Período: " si viene del backend
  const cleanPeriod = periodLabel.replace(/^Período:\s*/i, '');
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
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } },
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
  const COL_WIDTHS = [14, 14, 14, 28, 12, 12, 30, 8, 8, 14, 20];
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // ============================================================
  // FILA 1: espacio superior
  // ============================================================
  ws.getRow(1).height = 10;

  // ============================================================
  // FILA 2 (100px): membrete + logos (sin "NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA")
  // ============================================================
  ws.getRow(2).height = 100;

  ws.mergeCells(2, 1, 2, TOTAL);
  const membreteCell = ws.getCell(2, 1);
  const resumenMembrete = INSTITUTIONAL_HEADER.filter(l => l !== 'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA').join('\n');
  membreteCell.value = resumenMembrete;
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
      { text: 'RESUMEN PASANTÍAS ', font: { name: FONT, size: 12, bold: true } },
      { text: cleanPeriod, font: { name: FONT, size: 12, bold: true, color: { argb: 'FFFF0000' } } },
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
  // A=REGIÓN, B=NÚCLEO, C=EXTENSIÓN, D=NOMBRE DE LA CARRERA,
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
  setH(ws.getCell(6, 3), 'EXTENSIÓN');     ws.mergeCells(6, 3, 7, 3);
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
    excelRow.height = 32;

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
    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: 0.1, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }

    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
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

function addIndividualTutorLogos(workbook: Workbook, ws: Worksheet): void {
  const logoPaths = findLogoPaths();
  if (!logoPaths) return;

  try {
    // Escudo (izquierda)
    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: 0.2, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }

    // Logo UNEFA (derecha)
    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: 17.5, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }
  } catch (err) {
    console.warn('[excel-export] No se pudieron cargar las imágenes:', (err as Error).message);
  }
}

function addIndividualTutorSheet(workbook: Workbook, ws: Worksheet, config: IndividualTutorSheetConfig): void {
  const totalCols = INDIVIDUAL_TOTAL_COLS; // 19
  const COL_FIRST = 2; // B
  const COL_LAST = 19; // S
  const rows = config.rows;

  // ── Anchos de columna ──
  const COL_WIDTHS: Record<number, number> = {
    1: 3.71, 2: 3.86, 3: 17.71, 4: 14, 5: 14,
    6: 16.71, 7: 32.71, 8: 15.86, 9: 15.43,
    10: 10.71, 11: 16.57, 12: 19.86, 13: 22.29,
    14: 14, 15: 29.29, 16: 22.29, 17: 14,
    18: 41.86, 19: 40.57,
  };
  Object.entries(COL_WIDTHS).forEach(([col, w]) => { ws.getColumn(Number(col)).width = w; });

  // ── Fila 1 (height 8.25): vacía ──
  ws.getRow(1).height = 8.25;

  // ── Fila 2 (height 75): Membrete institucional (bold) — C2:S2 merged ──
  ws.getRow(2).height = 75;
  ws.mergeCells(2, 3, 2, COL_LAST); // C2:S2
  const headerCell = ws.getCell(2, 3);
  headerCell.value = ANEXO4_HEADER_TEXT;
  headerCell.font = { ...ANEXO4_FONT, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  addIndividualTutorLogos(workbook, ws);

  // ── Fila 3 (height 10.5): código SOA-PP-001-5 ──
  ws.getRow(3).height = 10.5;
  const codeCell = ws.getCell(3, 3); // C3
  codeCell.value = 'SOA-PP-001-5';
  codeCell.font = { ...ANEXO4_FONT, bold: true };
  codeCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Fila 4 (height 48): Título ──
  ws.getRow(4).height = 48;
  ws.mergeCells(4, COL_FIRST, 4, COL_LAST); // B4:S4
  const titleCell = ws.getCell(4, COL_FIRST);
  titleCell.value = {
    richText: [
      {
        text: `FORMATO DE RELACIÓN INDIVIDUAL\nDE DOCENTES CONTRATADOS U ORDINARIOS CON DEDICACIÓN MEDIO TIEMPO (MT), TIEMPO COMPLETO (TC) Y DEDICACIÓN EXCLUSIVA (DE) QUE SE ENCUENTRAN TUTORANDO  ESTUDIANTES DE PRACTICAS PROFESIONALES ( PASANTIAS )\nPERIODO ACADÉMICO `,
        font: { ...ANEXO4_FONT, bold: true },
      },
      {
        text: config.periodLabel,
        font: { ...ANEXO4_FONT, bold: true, color: { argb: 'FFFF0000' } },
      },
    ],
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // ── Fila 5: Nombre del tutor (fondo amarillo, B5:H5 merged) ──
  ws.getRow(5).height = 22;
  ws.mergeCells(5, COL_FIRST, 5, 8); // B5:H5
  const tutorNameCell = ws.getCell(5, COL_FIRST);
  const tutorFullName = `${config.tutorName} ${config.tutorApellido}`.trim();
  tutorNameCell.value = {
    richText: [
      { text: 'NOMBRE DEL TUTOR (A) ACADÉMICO: ', font: { ...ANEXO4_FONT, bold: true, underline: true } },
      { text: tutorFullName.toUpperCase(), font: { ...ANEXO4_FONT, bold: true } },
    ],
  };
  tutorNameCell.fill = ANEXO4_YELLOW_FILL;
  tutorNameCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  tutorNameCell.border = ANEXO4_DATA_BORDER;

  // O5:Q5 merged = empty, red font
  ws.mergeCells(5, 15, 5, 17); // O5:Q5
  const redFontCell = ws.getCell(5, 15);
  redFontCell.value = '';
  redFontCell.font = { ...ANEXO4_FONT, color: { argb: 'FF0000' } };

  // ── Fila 6: vacía ──
  ws.getRow(6).height = 6;

  // ============================================================
  // Filas 7-8: Encabezados de tabla (dos filas, merges verticales y horizontales)
  // ============================================================
  const h1 = ws.getRow(7);
  h1.height = 40;
  const h2 = ws.getRow(8);
  h2.height = 40;

  const g = {
    font: { ...ANEXO4_FONT, bold: true },
    fill: ANEXO4_HEADER_FILL,
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: ANEXO4_HEADER_BORDER,
  };

  // Helper para aplicar estilo de encabezado
  const setH = (cell: any, val: string) => {
    cell.value = val;
    cell.font = g.font;
    cell.fill = g.fill;
    cell.alignment = g.alignment;
    cell.border = g.border;
  };

  // Columnas con rowspan 2 (merge vertical 7→8)
  const verticalCols = [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19];
  verticalCols.forEach(c => {
    ws.mergeCells(7, c, 8, c);
  });

  // Fila 7 — encabezados principales
  setH(h1.getCell(2), 'N°');
  setH(h1.getCell(3), 'REGIÓN');
  setH(h1.getCell(4), 'NÚCLEO');
  setH(h1.getCell(5), 'EXTENSIÓN');
  setH(h1.getCell(6), 'CARRERA');
  setH(h1.getCell(7), 'NOMBRE Y APELLIDO DEL (DE LA) ESTUDIANTE');
  setH(h1.getCell(8), 'CÉDULA');
  setH(h1.getCell(9), 'SEXO FEMENINO MASCULINO');
  setH(h1.getCell(12), 'TELÉFONO');
  setH(h1.getCell(13), 'INSTITUCIÓN');
  setH(h1.getCell(14), 'RIF. INSTITUCIÓN');
  setH(h1.getCell(15), 'TIPO DE INSTITUCIÓN');
  setH(h1.getCell(16), 'MARCAR CON UNA X SI ES EMPRESA DE CONVENIO');
  setH(h1.getCell(17), 'TUTOR INSTITUCIONAL');
  setH(h1.getCell(18), 'DIRECCIÓN DE UBICACIÓN DEL CENTRO DE PRACTICA PROFESIONAL');
  // OBSERVACIONES con fondo amarillo
  const obsCell = h1.getCell(19);
  obsCell.value = 'OBSERVACIONES';
  obsCell.font = { ...ANEXO4_FONT, bold: true };
  obsCell.fill = ANEXO4_YELLOW_FILL;
  obsCell.alignment = g.alignment;
  obsCell.border = g.border;

  // J7:K7 merged = "TIPO DE ESTUDIANTE"
  ws.mergeCells(7, 10, 7, 11); // J7:K7
  setH(h1.getCell(10), 'TIPO DE ESTUDIANTE');

  // Fila 8 — sub-encabezados
  setH(h2.getCell(10), 'CIVIL / MILITAR');
  setH(h2.getCell(11), 'RANGO\n(EN CASO DE SER MILITAR)');
  setH(h2.getCell(15), 'PÚBLICA / PRIVADA');

  // ── Filas de datos (height 73.5-83.25, Arial 11pt, center, wrap, thin borders) ──
  rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(9 + rowIdx);
    excelRow.height = 73.5;
    const data = [
      row.nro,
      row.region,
      row.nucleo,
      row.extension,
      row.carrera,
      `${row.estudianteNombre} ${row.estudianteApellido}`.trim(),
      row.estudianteCi,
      row.sexo === 'F' ? 'FEMENINO' : row.sexo === 'M' ? 'MASCULINO' : '',
      row.tipo === 'CIVIL' || row.tipo === 'CIV' ? 'CIVIL' : row.tipo === 'MILITAR' || row.tipo === 'MIL' ? 'MILITAR' : (row.tipo || '').toUpperCase(),
      row.rango || '',
      row.telefono,
      row.institucion,
      row.rifInstitucion || '',
      row.tipoInstitucion,
      row.convenioX ? 'X' : '',
      row.tutorInst,
      row.direccion,
      row.observaciones,
    ];

    // Merges para SEXO (I→I, already single)
    // No additional merges needed for data rows

    data.forEach((val, colIdx) => {
      const cell = excelRow.getCell(colIdx + 2); // colIdx 0 → col B (2)
      cell.value = val !== null && val !== undefined
        ? (typeof val === 'string' ? val.toUpperCase() : val)
        : '';
      cell.font = ANEXO4_FONT;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ANEXO4_DATA_BORDER;
    });
  });

  // ── Configuración de página ──
  ws.pageSetup = {
    orientation: 'landscape',
    margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0, footer: 0 },
  };
}

// ============================================================
// Hoja RELACIÓN GENERAL (formato oficial UNEFA ANEXO)
// ============================================================

/** Hoja general de tutores académicos — 18 columnas (A=margen, B‑R=datos) */
function addGeneralTutorSheet(workbook: Workbook, ws: Worksheet, section: SheetSection): void {
  const COL_FIRST = 2; // B
  const COL_LAST = 18; // R
  const TOTAL = COL_LAST;

  // ── Anchos de columna ──
  const COL_WIDTHS: Record<number, number> = {
    1: 3.71, 2: 3.86, 3: 13.43, 4: 17.71, 5: 14.71, 6: 16.71,
    7: 15.86, 8: 14.86, 9: 11.43, 10: 15.71, 11: 15.57,
    12: 14, 13: 14, 14: 14, 15: 21.29, 16: 3.71, 17: 26.57, 18: 17.43,
  };
  Object.entries(COL_WIDTHS).forEach(([col, w]) => { ws.getColumn(Number(col)).width = w; });

  // ── Fila 1: vacía (espaciado superior, height 12) ──
  ws.getRow(1).height = 12;

  // ── Fila 2 (height 75.75): código SOA + membrete institucional ──
  ws.getRow(2).height = 75.75;

  // Código "SOA-PP-001-3" en C2
  const codeCell = ws.getCell(2, 3);
  codeCell.value = 'SOA-PP-001-3';
  codeCell.font = { ...ANEXO4_FONT, bold: true };
  codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Membrete institucional — D2:Q2 merged
  ws.mergeCells(2, 4, 2, 17); // D2:Q2
  const headerCell = ws.getCell(2, 4);
  const NORMAL_LINES_GEN = [0, 1, 2]; // REPÚBLICA..., UNIVERSIDAD..., DE LA FUERZA...
  const headerLinesGen = ANEXO4_HEADER_TEXT.split('\n');
  const richHeaderGen = headerLinesGen.map((line, idx) => ({
    text: line + (idx < headerLinesGen.length - 1 ? '\n' : ''),
    font: { ...ANEXO4_FONT, bold: !NORMAL_LINES_GEN.includes(idx) },
  }));
  headerCell.value = { richText: richHeaderGen };
  headerCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  addGeneralTutorLogos(workbook, ws);

  // ── Fila 3: vacía (height 12) ──
  ws.getRow(3).height = 12;

  // ── Fila 4 (height 56.25): Título + período ──
  ws.getRow(4).height = 56.25;
  ws.mergeCells(4, COL_FIRST, 4, COL_LAST); // B4:R4
  const titleCell = ws.getCell(4, COL_FIRST);
  titleCell.value = {
    richText: [
      { text: section.title.toUpperCase(), font: { ...ANEXO4_FONT, bold: true } },
      { text: `\n${section.periodLabel}`, font: { ...ANEXO4_FONT, bold: true } },
    ],
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  titleCell.border = { bottom: { style: 'medium' } };

  // ── Fila 5: Encabezados de columna (verde #92D050, Arial 11pt bold) ──
  ws.getRow(5).height = 50;

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

  const headerStyle = {
    font: { ...ANEXO4_FONT, bold: true },
    fill: ANEXO4_HEADER_FILL,
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: ANEXO4_HEADER_BORDER,
  };

  headers.forEach((h) => {
    if (h.colspan > 1) {
      ws.mergeCells(5, h.col, 5, h.col + h.colspan - 1);
    }
    const cell = ws.getCell(5, h.col);
    cell.value = h.text;
    cell.font = headerStyle.font;
    cell.fill = headerStyle.fill;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  });

  // ── Filas de datos (height 54, Arial 11pt, center, wrap, thin borders) ──
  const DATA_KEYS = section.columns.map(c => c.key);

  section.rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(6 + rowIdx);
    excelRow.height = 54;

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
      { key: 'nombreTutor', physCol: 7 },
      { key: 'apellidoTutor', physCol: 9 },
      { key: 'cedula', physCol: 11 },
      { key: 'condicion', physCol: 12 },
      { key: 'dedicacion', physCol: 13 },
      { key: 'categoria', physCol: 14 },
      { key: 'telefono', physCol: 15 },
      { key: 'correo', physCol: 16 },
      { key: 'cantidadEstudiantes', physCol: 18 },
    ];

    // Merges de datos: nombreTutor → cols 7-8, apellidoTutor → cols 9-10, correo → cols 16-17
    const dataRow = 6 + rowIdx;
    ws.mergeCells(dataRow, 7, dataRow, 8);
    ws.mergeCells(dataRow, 9, dataRow, 10);
    ws.mergeCells(dataRow, 16, dataRow, 17);

    dataCols.forEach(({ key, physCol }) => {
      const cell = excelRow.getCell(physCol);
      cell.value = val(key);
      cell.font = ANEXO4_FONT;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ANEXO4_DATA_BORDER;
    });
  });

  // ============================================================
  // Sección de firmas (posicionadas dinámicamente después de los datos)
  // ============================================================

  const lastDataRow = 5 + section.rows.length; // última fila de datos
  const sigSepRow = lastDataRow + 1;   // separador vacío
  const sigLineRow = sigSepRow + 1;    // líneas de firma
  const sigLabelRow = sigLineRow + 1;   // etiquetas de firma

  // Separador vacío
  ws.getRow(sigSepRow).height = 10;

  // Líneas de firma vacías (borde inferior thin)
  ws.getRow(sigLineRow).height = 43.5;
  const sigLineRanges = [
    { start: 2, end: 4 },    // B:D (izquierda)
    { start: 6, end: 8 },    // F:H (centro-izquierda)
    { start: 10, end: 15 },  // J:O (centro-derecha)
  ];
  sigLineRanges.forEach(({ start, end }) => {
    ws.mergeCells(sigLineRow, start, sigLineRow, end);
    const cell = ws.getCell(sigLineRow, start);
    cell.value = '';
    cell.font = ANEXO4_FONT;
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'thin' } };
  });

  // Etiquetas de firma (Arial 11pt bold, borde superior thin)
  ws.getRow(sigLabelRow).height = 48;
  const sigLabels = section.signatures ?? [
    'NOMBRE APELLIDO\nFIRMA Y SELLO DEL COORDINADOR DE PRÁCTICAS PROFESIONALES',
    'NOMBRE APELLIDO\nFIRMA Y SELLO DEL JEFE ÁREA ACADÉMICA',
    'NOMBRE APELLIDO\nFIRMA Y SELLO DEL DECANO (A)',
  ];
  const sigLabelRanges = [
    { start: 2, end: 4, text: sigLabels[0] || '' },
    { start: 6, end: 8, text: sigLabels[1] || '' },
    { start: 10, end: 15, text: sigLabels[2] || '' },
  ];
  sigLabelRanges.forEach(({ start, end, text }) => {
    ws.mergeCells(sigLabelRow, start, sigLabelRow, end);
    const cell = ws.getCell(sigLabelRow, start);
    cell.value = text;
    cell.font = { ...ANEXO4_FONT, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
    cell.border = { top: { style: 'thin' } };
  });

  // ── Configuración de página ──
  ws.pageSetup = {
    orientation: 'landscape',
    margins: { left: 0.709, right: 0.709, top: 0.748, bottom: 0.748, header: 0, footer: 0 },
    printArea: `A1:O${sigLabelRow}`,
  };
}

// ============================================================
// Logos para la hoja general (posicionados sobre fila 2)
// ============================================================

function addGeneralTutorLogos(workbook: Workbook, ws: Worksheet): void {
  const logoPaths = findLogoPaths();
  if (!logoPaths) return;

  try {
    // Escudo (izquierda) — col A-B, row 2
    if (logoPaths.escudo && fs.existsSync(logoPaths.escudo)) {
      const escudoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.escudo) as any, extension: 'png' });
      ws.addImage(escudoId, {
        tl: { col: 0.2, row: 1.1 },
        ext: { width: 70, height: 70 },
      });
    }

    // Logo UNEFA (derecha) — col Q-R row 2
    if (logoPaths.logo && fs.existsSync(logoPaths.logo)) {
      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPaths.logo) as any, extension: 'png' });
      ws.addImage(logoId, {
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
