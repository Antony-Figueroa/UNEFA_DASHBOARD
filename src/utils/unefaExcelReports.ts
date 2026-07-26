import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const INSTITUTIONAL_HEADER = [
  'REPÚBLICA BOLIVARIANA DE VENEZUELA',
  'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
  'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
  'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
  'VICERRECTORADO DE LA REGIÓN LOS LLANOS',
  'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA',
  'EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES',
];

const DEFAULT_FONT = { name: 'Arial', size: 9 };
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } };
const GREEN_DARK_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF76923C' } };
const GREEN_LIGHT_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC2D69B' } };
const BLUE_MEDIUM_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4472C4' } };
const BLUE_LIGHT_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFBDD7EE' } };
const THIN_BORDER = {
  top: { style: 'thin' as const },
  left: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  right: { style: 'thin' as const },
};
const HEADER_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 8 },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
  fill: HEADER_FILL,
  border: THIN_BORDER,
};
const DATA_STYLE = {
  font: { ...DEFAULT_FONT, size: 11 },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
  border: THIN_BORDER,
};
const SUBTOTAL_LABEL_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 7, color: { argb: 'FF000000' } },
  alignment: { horizontal: 'right' as const, vertical: 'middle' as const, wrapText: true },
  fill: GREEN_DARK_FILL,
  border: THIN_BORDER,
};
const SUBTOTAL_VALUE_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 10 },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  fill: GREEN_DARK_FILL,
  border: THIN_BORDER,
};
const TOTAL_CARRERAS_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 7, color: { argb: 'FF000000' } },
  alignment: { horizontal: 'right' as const, vertical: 'middle' as const, wrapText: true },
  fill: GREEN_LIGHT_FILL,
  border: THIN_BORDER,
};
const TOTAL_CARRERAS_VALUE_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 10 },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  fill: GREEN_LIGHT_FILL,
  border: THIN_BORDER,
};
const SUBTOTAL_BLUE_LABEL_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 7, color: { argb: 'FFFFFFFF' } },
  alignment: { horizontal: 'right' as const, vertical: 'middle' as const, wrapText: true },
  fill: BLUE_MEDIUM_FILL,
  border: THIN_BORDER,
};
const SUBTOTAL_BLUE_VALUE_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  fill: BLUE_MEDIUM_FILL,
  border: THIN_BORDER,
};
const TOTAL_BLUE_LABEL_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 7, color: { argb: 'FF000000' } },
  alignment: { horizontal: 'right' as const, vertical: 'middle' as const, wrapText: true },
  fill: BLUE_LIGHT_FILL,
  border: THIN_BORDER,
};
const TOTAL_BLUE_VALUE_STYLE = {
  font: { ...DEFAULT_FONT, bold: true, size: 10 },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  fill: BLUE_LIGHT_FILL,
  border: THIN_BORDER,
};

function applyInstitutionalHeader(worksheet: ExcelJS.Worksheet, totalCols: number, headerLines?: string[]) {
  const lines = headerLines || INSTITUTIONAL_HEADER;
  lines.forEach((line, index) => {
    const row = worksheet.getRow(index + 1);
    worksheet.mergeCells(`A${index + 1}:${String.fromCharCode(64 + totalCols)}${index + 1}`);
    const cell = row.getCell(1);
    cell.value = line;
    cell.font = { ...DEFAULT_FONT, size: 9, bold: false };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

async function addLogos(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, totalCols: number = 9, swap: boolean = false) {
  try {
    // Por defecto: logo (izquierda), escudo (derecha). Swap=true invierte.
    const escudoCol = swap ? 0.2 : totalCols - 1.5;
    const logoCol = swap ? totalCols - 1.5 : 0.2;

    const responseEscudo = await fetch('/unefa-img/Escudo.png');
    const bufferEscudo = await responseEscudo.arrayBuffer();
    const imageIdEscudo = workbook.addImage({ buffer: bufferEscudo, extension: 'png' });
    worksheet.addImage(imageIdEscudo, { tl: { col: escudoCol, row: 0.2 }, ext: { width: 85, height: 85 } });

    const responseLogo = await fetch('/logo-nuevo.png');
    const bufferLogo = await responseLogo.arrayBuffer();
    const imageIdLogo = workbook.addImage({ buffer: bufferLogo, extension: 'png' });
    worksheet.addImage(imageIdLogo, { tl: { col: logoCol, row: 0.2 }, ext: { width: 85, height: 85 } });
  } catch {
    console.warn('No se pudo cargar las imágenes para el Excel');
  }
}

function applyTitleRow(worksheet: ExcelJS.Worksheet, rowNum: number, text: string, totalCols: number) {
  worksheet.mergeCells(`A${rowNum}:${String.fromCharCode(64 + totalCols)}${rowNum}`);
  const row = worksheet.getRow(rowNum);
  row.height = 25;
  const cell = row.getCell(1);
  cell.value = { richText: [{ text, font: { ...DEFAULT_FONT, size: 11, bold: true } }] };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function applyHeaderRow(worksheet: ExcelJS.Worksheet, rowNum: number, columns: { col: number; text: string; width?: number }[]) {
  const row = worksheet.getRow(rowNum);
  row.height = 30;
  columns.forEach(({ col, text, width }) => {
    const cell = row.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
    if (width) worksheet.getColumn(col).width = width;
  });
}

function applyHeaderMerged(worksheet: ExcelJS.Worksheet, rowNum: number, merges: { from: number; to: number; text: string }[]) {
  const row = worksheet.getRow(rowNum);
  row.height = 20;
  merges.forEach(({ from, to, text }) => {
    if (from !== to) worksheet.mergeCells(rowNum, from, rowNum, to);
    const cell = row.getCell(from);
    cell.value = text;
    cell.style = HEADER_STYLE;
    for (let c = from; c <= to; c++) {
      row.getCell(c).style = HEADER_STYLE;
    }
  });
}

function applyDataCell(worksheet: ExcelJS.Worksheet, rowNum: number, colNum: number, value: unknown) {
  const cell = worksheet.getCell(rowNum, colNum);
  cell.value = (value ?? '') as ExcelJS.CellValue;
  cell.style = DATA_STYLE;
}

function applyDataRow(worksheet: ExcelJS.Worksheet, rowNum: number, values: unknown[], colStart = 1) {
  const row = worksheet.getRow(rowNum);
  row.height = 25;
  values.forEach((v, i) => {
    applyDataCell(worksheet, rowNum, colStart + i, v);
  });
}

function lastCol(count: number): string {
  return String.fromCharCode(64 + count);
}

/**
 * Genera el reporte Excel ANEXO 4 para Tutores Académicos
 * con encabezado institucional y estructura específica.
 */
export async function generateAnexo4Excel(data: any[], fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Anexo 4');
  const totalCols = 17; // Updated for new columns

  worksheet.columns = [
    { key: 'nro', width: 6 },
    { key: 'region', width: 18 },
    { key: 'nucleo', width: 22 },
    { key: 'extension', width: 22 },
    { key: 'carrera', width: 35 },
    { key: 'nombre', width: 22 },
    { key: 'apellido', width: 22 },
    { key: 'cedula', width: 16 },
    { key: 'condicion', width: 15 },
    { key: 'dedicacion', width: 15 },
    { key: 'categoria', width: 15 },
    { key: 'telefono', width: 15 },
    { key: 'correo', width: 30 },
    { key: 'estudiantes', width: 14 },
    { key: 'sexo', width: 10 },
    { key: 'codigoTutor', width: 14 },
    { key: 'titulo', width: 18 },
  ];

  // Institutional header (6 rows)
  const institutionalHeader = [
    ['REPÚBLICA BOLIVARIANA DE VENEZUELA'],
    ['MINISTERIO DEL PODER POPULAR PARA LA DEFENSA'],
    ['UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA'],
    ['DE LA FUERZA ARMADA NACIONAL BOLIVARIANA'],
    ['VICERRECTORADO DE LA REGIÓN LOS LLANOS'],
    ['NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA'],
    ['EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES'],
    [''],
    ['ANEXO 4 - RELACIÓN DE TUTORES ACADÉMICOS'],
    ['']
  ];

  institutionalHeader.forEach((row, i) => {
    const r = worksheet.getRow(i + 1);
    r.getCell(1).value = row[0];
    r.getCell(1).font = { ...DEFAULT_FONT, size: 11, bold: true };
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(i + 1, 1, i + 1, totalCols);
  });

  // Table headers row 9
  const headerRow = worksheet.getRow(9);
  const headers = [
    'N°', 'REGIÓN', 'NÚCLEO', 'EXTENSIÓN', 'CARRERA', 'NOMBRE',
    'APELLIDO', 'CÉDULA', 'CONDICIÓN', 'DEDICACIÓN', 'CATEGORÍA',
    'TELÉFONO', 'CORREO ELECTRÓNICO', 'ESTUDIANTES', 'SEXO', 'CÓDIGO TUTOR', 'TÍTULO'
  ];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.style = HEADER_STYLE;
  });
  headerRow.height = 25;

  // Data rows
  data.forEach((item, idx) => {
    const row = worksheet.getRow(10 + idx);
    row.values = [
      idx + 1,
      (item.region || '').toUpperCase(),
      (item.nucleo || '').toUpperCase(),
      (item.extension || '').toUpperCase(),
      (item.carrera || '').toUpperCase(),
      (item.nombreTutor || '').toUpperCase(),
      (item.apellidoTutor || '').toUpperCase(),
      (item.cedula || '').toUpperCase(),
      (item.condicion || '').toUpperCase(),
      (item.dedicacion || '').toUpperCase(),
      (item.categoria || '').toUpperCase(),
      (item.telefono || '').toUpperCase(),
      (item.correo || '').toUpperCase(),
      item.cantidadEstudiantes || 0,
      (item.sexo || '').toUpperCase(),
      item.codigoTutor || '',
      (item.titulo || '').toUpperCase()
    ];
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.style = { ...DATA_STYLE, alignment: { horizontal: 'center', vertical: 'middle' } };
      if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
        cell.alignment = { ...cell.alignment, horizontal: 'left' };
      }
    });
    // Yellow highlight for observations column (if needed in future)
    // const obsCell = row.getCell(totalCols);
    // obsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  });

  // Add observations column header and yellow highlight
  const obsHeaderCell = worksheet.getRow(9).getCell(totalCols);
  obsHeaderCell.value = 'OBSERVACIONES';
  obsHeaderCell.style = { ...HEADER_STYLE, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } };

  // Add empty observations with yellow background for data rows
  data.forEach((_, idx) => {
    const obsCell = worksheet.getRow(10 + idx).getCell(totalCols);
    obsCell.value = '';
    obsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  });

  await addLogos(workbook, worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileName}.xlsx`);
  }
}

/**
 * Genera el reporte Excel RESUMEN PASANTIAS
 * con el formato exacto (colores, bordes, celdas combinadas) usando ExcelJS.
 */
export async function generateResumenPasantiasExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Resumen Pasantias');
  const totalCols = 11;

  // Limpiar "Período: " del label si viene así
  const cleanPeriod = period.replace(/^Período:\s*/i, '');

  // Header sin "NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA"
  const resumenHeader = INSTITUTIONAL_HEADER.filter(l => l !== 'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA');

  worksheet.columns = [
    { key: 'region', width: 15 }, { key: 'nucleo', width: 15 },
    { key: 'extension', width: 15 }, { key: 'carrera', width: 45 },
    { key: 'tutoresAcad', width: 15 }, { key: 'estudiantes', width: 15 },
    { key: 'empresa', width: 50 }, { key: 'publica', width: 10 },
    { key: 'privada', width: 10 }, { key: 'tutoresInst', width: 22 },
    { key: 'observacion', width: 20 },
  ];

  applyInstitutionalHeader(worksheet, totalCols, resumenHeader);
  await addLogos(workbook, worksheet);

  const titleRow = 8;
  worksheet.mergeCells(`A${titleRow}:K${titleRow}`);
  const tRow = worksheet.getRow(titleRow);
  tRow.height = 30;
  tRow.getCell(1).value = {
    richText: [
      { text: 'Resumen Pasantías ', font: { ...DEFAULT_FONT, size: 11, bold: true } },
      { text: cleanPeriod, font: { ...DEFAULT_FONT, size: 11, bold: true, color: { argb: 'FFFF0000' } } },
    ],
  };
  tRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  const row9 = worksheet.getRow(9);
  const row10 = worksheet.getRow(10);
  row9.height = 20;
  row10.height = 40;

  worksheet.mergeCells('G9:J9');
  const centroPracticaCell = row9.getCell('G');
  centroPracticaCell.value = 'CENTRO DE PRACTICA PROFESIONAL';
  centroPracticaCell.style = HEADER_STYLE;
  ['H','I','J'].forEach(col => { row9.getCell(col).style = HEADER_STYLE; });

  const columnsDef = [
    { col: 'A', text: 'REGIÓN', merge: true }, { col: 'B', text: 'NÚCLEO', merge: true },
    { col: 'C', text: 'EXTENSIÓN', merge: true }, { col: 'D', text: 'NOMBRE DE LA CARRERA', merge: true },
    { col: 'E', text: 'CANTIDAD DE\nTUTORES\nACADÉMICOS', merge: true },
    { col: 'F', text: 'CANTIDAD\nDE\nESTUDIANTES', merge: true },
    { col: 'G', text: 'NOMBRE DE LA EMPRESA\n/ INSTITUCIÓN', merge: false },
    { col: 'H', text: 'PÚBLICA', merge: false }, { col: 'I', text: 'PRIVADA', merge: false },
    { col: 'J', text: 'CANTIDAD DE\nTUTORES\nINSTITUCIONALES', merge: false },
    { col: 'K', text: 'OBSERVACIÓN', merge: true },
  ];

  columnsDef.forEach(def => {
    if (def.merge) {
      worksheet.mergeCells(`${def.col}9:${def.col}10`);
      const cell = row9.getCell(def.col);
      cell.value = def.text;
      cell.style = HEADER_STYLE;
      row10.getCell(def.col).style = HEADER_STYLE;
    } else {
      const cell = row10.getCell(def.col);
      cell.value = def.text;
      cell.style = HEADER_STYLE;
    }
  });

  let currentRow = 11;
  data.forEach(item => {
    const row = worksheet.getRow(currentRow);
    row.height = 55;
    // Usar item.tipo (lo devuelve el backend desde INSTITUTION_TYPE)
    const tipo = (item.tipo || '').toUpperCase();
    const isPublica = tipo === 'PÚBLICA' || tipo === 'PUBLICA';
    const isPrivada = tipo === 'PRIVADA';

    row.getCell('A').value = (item.region || '').toUpperCase();
    row.getCell('B').value = (item.nucleo || '').toUpperCase();
    row.getCell('C').value = (item.extension || '').toUpperCase();
    row.getCell('D').value = (item.carrera || '').toUpperCase();
    row.getCell('E').value = item.cantidadTutoresAcad || 0;
    row.getCell('F').value = item.cantidadEstudiantes || 0;
    row.getCell('G').value = (item.empresa || '').toUpperCase();
    row.getCell('H').value = isPublica ? 'X' : '';
    row.getCell('I').value = isPrivada ? 'X' : '';

    const tutoresInstCell = row.getCell('J');
    tutoresInstCell.value = item.cantidadTutoresInst || 0;
    tutoresInstCell.style = { ...DATA_STYLE, font: { ...DEFAULT_FONT, size: 8, bold: true, color: { argb: 'FFFF0000' } } };

    row.getCell('K').value = (item.observacion || '').toUpperCase();
    ['A','B','C','D','E','F','G','H','I','K'].forEach(col => { row.getCell(col).style = DATA_STYLE; });
    currentRow++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}

/**
 * Genera el reporte Excel RELACIÓN GENERAL DE TUTORES (ANEXO 4)
 * con formato institucional: 18 columnas (B-R), firmas, Arial 11pt.
 */
export async function generateRelacionGeneralTutoresExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RELACIÓN GENERAL');
  const COL_FIRST = 2; // B
  const COL_LAST = 18; // R

  // ── Estilos compartidos ANEXO 4 ──
  const ANEXO4_FONT = { name: 'Arial', size: 11 };
  const ANEXO4_HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } };
  const ANEXO4_HEADER_BORDER = {
    top: { style: 'medium' as const }, bottom: { style: 'medium' as const },
    left: { style: 'medium' as const }, right: { style: 'medium' as const },
  };
  const ANEXO4_DATA_BORDER = {
    top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
    left: { style: 'thin' as const }, right: { style: 'thin' as const },
  };
  const ANEXO4_HEADER_TEXT = [
    'REPÚBLICA BOLIVARIANA DE VENEZUELA',
    'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
    'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
    'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
    'VICERRECTORADO DE LA REGIÓN LOS LLANOS',
    'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA',
  'COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA',
  ].join('\n');

  // ── Anchos de columna (A-R) ──
  const COL_WIDTHS: Record<number, number> = {
    1: 3.71, 2: 3.86, 3: 13.43, 4: 17.71, 5: 14.71, 6: 16.71,
    7: 15.86, 8: 14.86, 9: 11.43, 10: 15.71, 11: 15.57,
    12: 14, 13: 14, 14: 14, 15: 21.29, 16: 3.71, 17: 26.57, 18: 17.43,
  };
  Object.entries(COL_WIDTHS).forEach(([col, w]) => { worksheet.getColumn(Number(col)).width = w; });

  // ── Fila 1: vacía (height 12) ──
  worksheet.getRow(1).height = 12;

  // ── Fila 2 (height 75.75): código SOA + membrete ──
  worksheet.getRow(2).height = 75.75;
  const codeCell = worksheet.getCell(2, 3);
  codeCell.value = 'SOA-PP-001-3';
  codeCell.font = { ...ANEXO4_FONT, bold: true };
  codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(2, 4, 2, 17);
  const headerCell = worksheet.getCell(2, 4);
  headerCell.value = ANEXO4_HEADER_TEXT;
  headerCell.font = ANEXO4_FONT;
  headerCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  await addLogos(workbook, worksheet);

  // ── Fila 3: vacía (height 12) ──
  worksheet.getRow(3).height = 12;

  // ── Fila 4 (height 56.25): Título ──
  worksheet.getRow(4).height = 56.25;
  worksheet.mergeCells(4, COL_FIRST, 4, COL_LAST);
  const titleCell = worksheet.getCell(4, COL_FIRST);
  titleCell.value = {
    richText: [
      { text: 'RELACIÓN GENERAL\nDE TUTORES ACADÉMICOS CONTRATADOS U ORDINARIOS CON DEDICACIÓN MT, TC Y DE QUE SE ENCUENTRAN TUTORANDO  ESTUDIANTES DE PRACTICAS PROFESIONALES ( PASANTIAS )', font: { ...ANEXO4_FONT, bold: true } },
      { text: `\n${period}`, font: { ...ANEXO4_FONT, bold: true } },
    ],
  };
  (titleCell.alignment as any) = { horizontal: 'center', vertical: 'center', wrapText: true };
  titleCell.border = { bottom: { style: 'medium' } };

  // ── Fila 5: Encabezados (verde #92D050, Arial 11pt bold) ──
  worksheet.getRow(5).height = 50;

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

  const hdrStyle = {
    font: { ...ANEXO4_FONT, bold: true },
    fill: ANEXO4_HEADER_FILL,
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: ANEXO4_HEADER_BORDER,
  };

  headers.forEach((h) => {
    if (h.colspan > 1) {
      worksheet.mergeCells(5, h.col, 5, h.col + h.colspan - 1);
    }
    const cell = worksheet.getCell(5, h.col);
    cell.value = h.text;
    cell.font = hdrStyle.font;
    cell.fill = hdrStyle.fill;
    cell.alignment = hdrStyle.alignment;
    cell.border = hdrStyle.border;
  });

  // ── Filas de datos (height 54) ──
  data.forEach((item, idx) => {
    const excelRow = worksheet.getRow(6 + idx);
    excelRow.height = 54;

    // Merges para nombre (7-8), apellido (9-10), correo (16-17)
    const rowIdx = 6 + idx;
    worksheet.mergeCells(rowIdx, 7, rowIdx, 8);
    worksheet.mergeCells(rowIdx, 9, rowIdx, 10);
    worksheet.mergeCells(rowIdx, 16, rowIdx, 17);

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

    dataCols.forEach(({ key, physCol }) => {
      const cell = excelRow.getCell(physCol);
      let val = item[key];
      if (val !== null && val !== undefined) {
        val = typeof val === 'string' ? val.toUpperCase() : val;
      } else {
        val = '';
      }
      cell.value = val;
      cell.font = ANEXO4_FONT;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ANEXO4_DATA_BORDER;
    });
  });

  // ── Sección de firmas (posicionadas dinámicamente después de los datos) ──
  const lastDataRow = 5 + data.length;
  const sigSepRow = lastDataRow + 1;
  const sigLineRow = sigSepRow + 1;
  const sigLabelRow = sigLineRow + 1;

  worksheet.getRow(sigSepRow).height = 10;

  // Líneas de firma vacías
  worksheet.getRow(sigLineRow).height = 43.5;
  [
    { start: 2, end: 4 },
    { start: 6, end: 8 },
    { start: 10, end: 15 },
  ].forEach(({ start, end }) => {
    worksheet.mergeCells(sigLineRow, start, sigLineRow, end);
    const cell = worksheet.getCell(sigLineRow, start);
    cell.value = '';
    cell.font = ANEXO4_FONT;
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'thin' } };
  });

  // Etiquetas de firma
  worksheet.getRow(sigLabelRow).height = 48;
  [
    { start: 2, end: 4, text: 'NOMBRE APELLIDO\nFIRMA Y SELLO DEL COORDINADOR DE PRÁCTICAS PROFESIONALES' },
    { start: 6, end: 8, text: 'NOMBRE APELLIDO\nFIRMA Y SELLO DEL JEFE ÁREA ACADÉMICA' },
    { start: 10, end: 15, text: 'NOMBRE APELLIDO\nFIRMA Y SELLO DEL DECANO (A)' },
  ].forEach(({ start, end, text }) => {
    worksheet.mergeCells(sigLabelRow, start, sigLabelRow, end);
    const cell = worksheet.getCell(sigLabelRow, start);
    cell.value = text;
    cell.font = { ...ANEXO4_FONT, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
    cell.border = { top: { style: 'thin' } };
  });

  // ── Configuración de página ──
  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 1 as any,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.709, right: 0.709, top: 0.748, bottom: 0.748, header: 0, footer: 0 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileName}.xlsx`);
  }
}

function formatRif(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/\D/g, '');
  if (cleaned.length <= 8) return cleaned;
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 9)}`;
}

export async function generateRelacionEmpresasExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relacion Empresas');
  const totalCols = 9;

  worksheet.columns = [
    { key: 'region', width: 18 }, { key: 'nucleo', width: 18 }, { key: 'extension', width: 18 },
    { key: 'empresa', width: 50 }, { key: 'rif', width: 18 }, { key: 'tipo', width: 12 },
    { key: 'publica', width: 10 }, { key: 'privada', width: 10 },
    { key: 'carrera', width: 30 }, { key: 'estudiantes', width: 14 },
  ];

  // Header sin "NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA"
  const headerFiltrado = INSTITUTIONAL_HEADER.filter(l => l !== 'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA');
  applyInstitutionalHeader(worksheet, totalCols, headerFiltrado);
  await addLogos(workbook, worksheet, totalCols, true);

  // Título: solo RELACIÓN DE EMPRESAS, periodo sin label, todo negro
  const titleRowNum = 7;
  worksheet.mergeCells(`A${titleRowNum}:${String.fromCharCode(64 + totalCols)}${titleRowNum}`);
  const tRow = worksheet.getRow(titleRowNum);
  tRow.height = 25;
  tRow.getCell(1).value = {
    richText: [
      { text: 'RELACIÓN DE EMPRESAS O INSTITUCIONES QUE DEMANDAN ASIGNACIÓN DE PASANTES', font: { ...DEFAULT_FONT, size: 11, bold: true } },
      { text: `\n${period}`, font: { ...DEFAULT_FONT, size: 11, bold: true } },
    ],
  };
  tRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const row8 = worksheet.getRow(8);
  const row9 = worksheet.getRow(9);
  row8.height = 25;
  row9.height = 60;

  // REGIÓN, NÚCLEO, EXTENSIÓN merged vertically (8-9)
  // NOMBRE DE LA EMPRESA merged vertically
  // RIF merged vertically
  // TIPO DE EMPRESA header split into PÚBLICA/PRIVADA in row 9
  // CARRERA merged vertically
  // CANTIDAD DE ESTUDIANTES merged vertically

  const mergedCols = [
    { col: 'A', text: 'REGIÓN', merge: true }, { col: 'B', text: 'NÚCLEO', merge: true },
    { col: 'C', text: 'EXTENSIÓN', merge: true }, { col: 'D', text: 'NOMBRE DE LA EMPRESA O INSTITUCIÓN', merge: true },
    { col: 'E', text: 'RIF', merge: true },
    { col: 'F', text: 'TIPO DE\nEMPRESA', merge: false },
    { col: 'G', text: '', merge: false },
    { col: 'H', text: 'CARRERA', merge: true },
    { col: 'I', text: 'CANTIDAD DE\nESTUDIANTES', merge: true },
  ];

  mergedCols.forEach(def => {
    if (def.merge) {
      worksheet.mergeCells(`${def.col}8:${def.col}9`);
      const cell = row8.getCell(def.col);
      cell.value = def.text;
      cell.style = HEADER_STYLE;
      row9.getCell(def.col).style = HEADER_STYLE;
    }
  });

  const pubCell = row9.getCell('F');
  pubCell.value = 'PÚBLICA';
  pubCell.style = HEADER_STYLE;
  const privCell = row9.getCell('G');
  privCell.value = 'PRIVADA';
  privCell.style = HEADER_STYLE;
  const tipoCell = row8.getCell('F');
  tipoCell.value = 'TIPO DE\nEMPRESA';
  tipoCell.style = HEADER_STYLE;
  row8.getCell('G').style = HEADER_STYLE;

  const SUBTOTAL_LABEL_STYLE_LOCAL = {
    font: { ...DEFAULT_FONT, bold: true, size: 8 },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    fill: GREEN_DARK_FILL,
    border: THIN_BORDER,
  };
  const SUBTOTAL_VALUE_STYLE_LOCAL = {
    font: { ...DEFAULT_FONT, bold: true, size: 10 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: GREEN_DARK_FILL,
    border: THIN_BORDER,
  };
  const TOTAL_TITLE_STYLE = {
    font: { ...DEFAULT_FONT, size: 10, bold: false },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    fill: GREEN_LIGHT_FILL,
    border: THIN_BORDER,
  };
  const TOTAL_VALUE_STYLE = {
    font: { ...DEFAULT_FONT, size: 11, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: GREEN_LIGHT_FILL,
    border: THIN_BORDER,
  };

  let currentRow = 10;
  data.forEach(item => {
    const isPublica = item.tipo?.toUpperCase() === 'PÚBLICA' || item.tipo?.toUpperCase() === 'PUBLICA' || item.tipo === 'X';
    const isPrivada = item.tipo?.toUpperCase() === 'PRIVADA';
    const rifFormatted = formatRif(item.rif || '');

    const row = worksheet.getRow(currentRow);
    row.height = 25;

    applyDataCell(worksheet, currentRow, 1, (item.region || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 2, (item.nucleo || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 3, (item.extension || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 4, (item.empresa || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 5, rifFormatted);
    applyDataCell(worksheet, currentRow, 6, isPublica ? 'X' : '');
    applyDataCell(worksheet, currentRow, 7, isPrivada ? 'X' : '');
    applyDataCell(worksheet, currentRow, 8, (item.carrera || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 9, item.cantidadEstudiantes || 0);

    currentRow++;
  });

  const dataStart = 10;
  const dataEnd = currentRow - 1;
  const dataLen = data.length;

  // Merge vertical de REGIÓN desde primera fila datos hasta subtotal/totales
  if (dataLen > 0) {
    worksheet.mergeCells(`A${dataStart}:A${dataEnd + 3}`);
  }

  // ── SUBTOTALES ──
  const pubCount = data.filter((d: any) => d.tipo?.toUpperCase() === 'PÚBLICA' || d.tipo?.toUpperCase() === 'PUBLICA' || d.tipo === 'X').length;
  const privCount = data.filter((d: any) => d.tipo?.toUpperCase() === 'PRIVADA').length;
  const careersSet = new Set(data.map((d: any) => d.carrera).filter(Boolean));
  const totalEst = data.reduce((s: number, d: any) => s + (d.cantidadEstudiantes || 0), 0);

  const subRow = worksheet.getRow(currentRow);
  subRow.height = 24;
  worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
  const subLabel = subRow.getCell(2);
  subLabel.value = 'SUB-TOTALES';
  subLabel.font = SUBTOTAL_LABEL_STYLE_LOCAL.font;
  subLabel.fill = SUBTOTAL_LABEL_STYLE_LOCAL.fill;
  subLabel.alignment = SUBTOTAL_LABEL_STYLE_LOCAL.alignment;
  subLabel.border = SUBTOTAL_LABEL_STYLE_LOCAL.border;
  [
    { c: 4, v: dataLen }, { c: 5, v: dataLen },
    { c: 6, v: pubCount }, { c: 7, v: privCount },
    { c: 8, v: careersSet.size }, { c: 9, v: totalEst },
  ].forEach(({ c, v }) => {
    const cell = subRow.getCell(c);
    cell.value = v;
    cell.font = SUBTOTAL_VALUE_STYLE_LOCAL.font;
    cell.fill = SUBTOTAL_VALUE_STYLE_LOCAL.fill;
    cell.alignment = SUBTOTAL_VALUE_STYLE_LOCAL.alignment;
    cell.border = SUBTOTAL_VALUE_STYLE_LOCAL.border;
  });
  currentRow++;

  // ── TOTAL INSTITUCIONES (título normal, número bold) ──
  const t1Row = worksheet.getRow(currentRow);
  t1Row.height = 28;
  worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
  const t1Label = t1Row.getCell(2);
  t1Label.value = 'TOTAL INSTITUCIONES';
  t1Label.font = TOTAL_TITLE_STYLE.font;
  t1Label.fill = TOTAL_TITLE_STYLE.fill;
  t1Label.alignment = TOTAL_TITLE_STYLE.alignment;
  t1Label.border = TOTAL_TITLE_STYLE.border;
  const t1Val = t1Row.getCell(4);
  t1Val.value = dataLen;
  t1Val.font = TOTAL_VALUE_STYLE.font;
  t1Val.fill = TOTAL_VALUE_STYLE.fill;
  t1Val.alignment = TOTAL_VALUE_STYLE.alignment;
  t1Val.border = TOTAL_VALUE_STYLE.border;
  currentRow++;

  // ── TOTAL ESTUDIANTES SOLICITADOS (título normal, número bold) ──
  const t2Row = worksheet.getRow(currentRow);
  t2Row.height = 36;
  worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
  const t2Label = t2Row.getCell(2);
  t2Label.value = 'TOTAL ESTUDIANTES SOLICITADOS';
  t2Label.font = TOTAL_TITLE_STYLE.font;
  t2Label.fill = TOTAL_TITLE_STYLE.fill;
  t2Label.alignment = TOTAL_TITLE_STYLE.alignment;
  t2Label.border = TOTAL_TITLE_STYLE.border;
  const t2Val = t2Row.getCell(4);
  t2Val.value = totalEst;
  t2Val.font = TOTAL_VALUE_STYLE.font;
  t2Val.fill = TOTAL_VALUE_STYLE.fill;
  t2Val.alignment = TOTAL_VALUE_STYLE.alignment;
  t2Val.border = TOTAL_VALUE_STYLE.border;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}

export async function generateRelacionInstitucionesSolicitanExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relacion Instituciones');
  const totalCols = 9;

  // Membrete filtrado: sin NÚCLEO, sin EQUIPO, con COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA
  const instHeader = INSTITUTIONAL_HEADER
    .filter(l => l !== 'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA' && l !== 'EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES')
    .concat('COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA');
  const headerRows = instHeader.length; // 6

  worksheet.columns = [
    { key: 'region', width: 18 }, { key: 'nucleo', width: 18 },
    { key: 'extension', width: 18 }, { key: 'empresa', width: 65 },
    { key: 'responsable', width: 30 }, { key: 'numeroContacto', width: 20 },
    { key: 'tipoEmpresa', width: 18 },
    { key: 'carreras', width: 40 }, { key: 'estudiantes', width: 14 },
  ];

  applyInstitutionalHeader(worksheet, totalCols, instHeader);
  await addLogos(workbook, worksheet, totalCols, true);

  // Form code under left logo (now escudo on the left after swap)
  worksheet.getCell(headerRows, 1).value = {
    richText: [
      { text: (worksheet.getCell(headerRows, 1).value as string) || '' },
      { text: '\nform-002-2019 CPA-VAC_jp', font: { ...DEFAULT_FONT, size: 7, italic: true } },
    ],
  };

  const titleRow = headerRows + 1;       // 7
  const hdrRow1 = titleRow + 1;          // 8
  const hdrRow2 = hdrRow1 + 1;           // 9
  const dataStart = hdrRow2 + 1;         // 10

  applyTitleRow(worksheet, titleRow,
    `RELACIÓN DE EMPRESAS O INSTITUCIONES QUE DEMANDAN ASIGNACIONES DE PASANTES PARA EL PERIODO ACADÉMICO ${period}`,
    totalCols);

  const row1 = worksheet.getRow(hdrRow1);
  const row2 = worksheet.getRow(hdrRow2);
  row1.height = 20;
  row2.height = 35;

  // Blue header fill for this report
  const BLUE_HDR_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF8DB3E2' } };
  const HDR_STYLE_BLUE = {
    font: { ...DEFAULT_FONT, bold: true, size: 8 },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    fill: BLUE_HDR_FILL,
    border: THIN_BORDER,
  };

  // Merge all header columns vertically
  const mergedCols = [
    { col: 'A', text: 'REGIÓN' },
    { col: 'B', text: 'NÚCLEO' },
    { col: 'C', text: 'EXTENSIÓN' },
    { col: 'D', text: 'NOMBRE DE LA\nEMPRESA O INSTITUCIÓN' },
    { col: 'E', text: 'RESPONSABLE' },
    { col: 'F', text: 'NUMERO DE\nCONTACTO' },
    { col: 'H', text: 'CARRERAS' },
    { col: 'I', text: 'CANTIDAD DE\nESTUDIANTES' },
  ];
  mergedCols.forEach(def => {
    worksheet.mergeCells(`${def.col}${hdrRow1}:${def.col}${hdrRow2}`);
    const cell = row1.getCell(def.col);
    cell.value = def.text;
    cell.style = HDR_STYLE_BLUE;
    row2.getCell(def.col).style = HDR_STYLE_BLUE;
  });

  // TIPO DE EMPRESA: parent in row1, sub-header in row2
  const tipoCell = row1.getCell('G');
  tipoCell.value = 'TIPO DE\nEMPRESA';
  tipoCell.style = HDR_STYLE_BLUE;
  const tipoSubCell = row2.getCell('G');
  tipoSubCell.value = 'PÚBLICA\nPRIVADA';
  tipoSubCell.style = HDR_STYLE_BLUE;

  // ── Data rows with subtotals by REGIÓN + total ──
  let currentRow = dataStart;

  // Group by region
  const groups = new Map<string, any[]>();
  data.forEach(item => {
    const region = (item.region || 'SIN REGIÓN').toUpperCase();
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region)!.push(item);
  });

  for (const [region, regionRows] of groups) {
    let subTotal = 0;

    regionRows.forEach(item => {
      const responsable = item.responsableTitulo
        ? `${item.responsable || ''} - ${item.responsableTitulo}`.replace(/^ - /, '').replace(/ - $/, '')
        : (item.responsable || '');
      const row = worksheet.getRow(currentRow);
      row.height = 25;

      applyDataCell(worksheet, currentRow, 1, region);
      applyDataCell(worksheet, currentRow, 2, (item.nucleo || '').toUpperCase());
      applyDataCell(worksheet, currentRow, 3, (item.extension || '').toUpperCase());
      applyDataCell(worksheet, currentRow, 4, (item.empresa || '').toUpperCase());
      applyDataCell(worksheet, currentRow, 5, responsable.toUpperCase());
      applyDataCell(worksheet, currentRow, 6, (item.numeroContacto || '').toUpperCase());
      applyDataCell(worksheet, currentRow, 7, (item.tipoEmpresa || '').toUpperCase());
      applyDataCell(worksheet, currentRow, 8, (item.carreras || '').toUpperCase());
      applyDataCell(worksheet, currentRow, 9, item.cantidadEstudiantes || 0);

      subTotal += Number(item.cantidadEstudiantes) || 0;
      currentRow++;
    });

    // Subtotal row
    if (regionRows.length > 1) {
      worksheet.mergeCells(currentRow, 1, currentRow, 8);
      const lbl = worksheet.getCell(currentRow, 1);
      lbl.value = `SUBTOTAL ${region}`;
      lbl.style = SUBTOTAL_BLUE_LABEL_STYLE;
      const val = worksheet.getCell(currentRow, 9);
      val.value = subTotal;
      val.style = SUBTOTAL_BLUE_VALUE_STYLE;
      // apply border to merged cells
      for (let c = 2; c <= 8; c++) worksheet.getCell(currentRow, c).border = THIN_BORDER;
      currentRow++;
    }
  }

  // Grand total
  const grandTotal = data.reduce((s, r) => s + (Number(r.cantidadEstudiantes) || 0), 0);
  worksheet.mergeCells(currentRow, 1, currentRow, 8);
  const totLbl = worksheet.getCell(currentRow, 1);
  totLbl.value = 'TOTAL ESTUDIANTES SOLICITADOS';
  totLbl.style = TOTAL_BLUE_LABEL_STYLE;
  const totVal = worksheet.getCell(currentRow, 9);
  totVal.value = grandTotal;
  totVal.style = TOTAL_BLUE_VALUE_STYLE;
  for (let c = 2; c <= 8; c++) worksheet.getCell(currentRow, c).border = THIN_BORDER;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}

export async function generateDistribucionTutoresExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Distribucion Tutores');
  const totalCols = 13;

  worksheet.columns = [
    { key: 'nro', width: 5 }, { key: 'carrera', width: 28 },
    { key: 'estudiante', width: 28 },
    { key: 'tutorAcadTitulo', width: 16 }, { key: 'tutorAcadNombre', width: 28 },
    { key: 'tutorAcadContacto', width: 14 },
    { key: 'tutorMetoNombre', width: 28 }, { key: 'tutorMetoContacto', width: 14 },
    { key: 'tutorMetoHorario', width: 20 },
    { key: 'evalNombre', width: 28 }, { key: 'evalContacto', width: 14 },
  ];

  applyInstitutionalHeader(worksheet, totalCols);

  applyTitleRow(worksheet, 7, `DISTRIBUCIÓN DE TUTORES - ${period}`, totalCols);

  const row9 = worksheet.getRow(9);
  const row10 = worksheet.getRow(10);
  row9.height = 20;
  row10.height = 40;

  //
  worksheet.mergeCells('A9:A10');
  worksheet.mergeCells('B9:B10');
  worksheet.mergeCells('C9:C10');
  worksheet.mergeCells('D9:G9');
  worksheet.mergeCells('H9:J9');
  worksheet.mergeCells('K9:L9');

  const cols = [
    { col: 'A', text: 'N°' }, { col: 'B', text: 'CARRERA' }, { col: 'C', text: 'ESTUDIANTE' },
  ];
  cols.forEach(({ col, text }) => {
    const cell = row9.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
    row10.getCell(col).style = HEADER_STYLE;
  });

  const tutorAcadCell = row9.getCell('D');
  tutorAcadCell.value = 'TUTOR ACADÉMICO';
  tutorAcadCell.style = HEADER_STYLE;
  for (let c = 5; c <= 7; c++) row9.getCell(c).style = HEADER_STYLE;

  const tutorMetoCell = row9.getCell('H');
  tutorMetoCell.value = 'TUTOR METODOLÓGICO';
  tutorMetoCell.style = HEADER_STYLE;
  for (let c = 9; c <= 10; c++) row9.getCell(c).style = HEADER_STYLE;

  const evalCell = row9.getCell('K');
  evalCell.value = 'EVALUADOR';
  evalCell.style = HEADER_STYLE;
  for (let c = 12; c <= 13; c++) row9.getCell(c).style = HEADER_STYLE;

  const subHeaders = [
    { col: 'D', text: 'TÍTULO' }, { col: 'E', text: 'NOMBRE' },
    { col: 'F', text: 'CONTACTO' }, { col: 'G', text: 'CORREO ELECTRÓNICO' },
    { col: 'H', text: 'NOMBRE' }, { col: 'I', text: 'CONTACTO' },
    { col: 'J', text: 'HORARIO' },
    { col: 'K', text: 'NOMBRE' }, { col: 'L', text: 'CONTACTO' },
  ];
  subHeaders.forEach(({ col, text }) => {
    const cell = row10.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
  });

  let currentRow = 11;
  data.forEach(item => {
    applyDataRow(worksheet, currentRow, [
      item.nro, (item.carrera || '').toUpperCase(), (item.estudiante || '').toUpperCase(),
      (item.tutorAcademico?.titulo || '').toUpperCase(),
      (item.tutorAcademico?.nombre || '').toUpperCase(),
      (item.tutorAcademico?.contacto || '').toUpperCase(), (item.tutorAcademico?.email || '').toUpperCase(),
      (item.tutorMetodologico?.nombre || '').toUpperCase(),
      (item.tutorMetodologico?.contacto || '').toUpperCase(),
      (item.tutorMetodologico?.horario || '').toUpperCase(),
      (item.evaluador?.nombre || '').toUpperCase(), (item.evaluador?.contacto || '').toUpperCase(),
    ]);
    currentRow++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}

/**
 * Genera el reporte Excel RELACIÓN INDIVIDUAL DE TUTORES (ANEXO 4)
 * con formato institucional: 19 columnas (B-S), 2 filas de encabezado, Arial 11pt.
 */
export async function generateRelacionIndividualDocenteExcel(data: any[], period: string, tutorName: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RELACIÓN INDIVIDUAL');
  const COL_FIRST = 2; // B
  const COL_LAST = 19; // S

  // ── Estilos compartidos ANEXO 4 ──
  const ANEXO4_FONT = { name: 'Arial', size: 11 };
  const ANEXO4_HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } };
  const ANEXO4_HEADER_BORDER = {
    top: { style: 'medium' as const }, bottom: { style: 'medium' as const },
    left: { style: 'medium' as const }, right: { style: 'medium' as const },
  };
  const ANEXO4_DATA_BORDER = {
    top: { style: 'thin' as const }, bottom: { style: 'thin' as const },
    left: { style: 'thin' as const }, right: { style: 'thin' as const },
  };
  const ANEXO4_YELLOW_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFF00' } };

  // ── Anchos de columna (A-S) ──
  const COL_WIDTHS: Record<number, number> = {
    1: 3.71, 2: 3.86, 3: 13.43, 4: 18.57, 5: 11.43, 6: 16.71,
    7: 15.86, 8: 11.43, 9: 15.71, 10: 15.57, 11: 11.14,
    12: 13.86, 13: 11.57, 14: 13.57, 15: 14.29, 16: 3.71,
    17: 22.14, 18: 3.71, 19: 8.43,
  };
  Object.entries(COL_WIDTHS).forEach(([col, w]) => { worksheet.getColumn(Number(col)).width = w; });

  // ── Fila 1: vacía (height 12) ──
  worksheet.getRow(1).height = 12;

  // ── Fila 2 (height 107): membrete institucional completo ──
  worksheet.getRow(2).height = 107;
  worksheet.mergeCells(2, 3, 2, COL_LAST);
  const headerCell = worksheet.getCell(2, 3);
  headerCell.value = 'REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA DEFENSA\nUNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA\nDE LA FUERZA ARMADA NACIONAL BOLIVARIANA\nVICERRECTORADO DE LA REGIÓN LOS LLANOS\nNÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA\nEQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES';
  headerCell.font = { ...ANEXO4_FONT, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  await addLogos(workbook, worksheet);

  // ── Fila 3 (height 25.50): código SOA ──
  worksheet.getRow(3).height = 25.50;
  const codeCell = worksheet.getCell(3, 3);
  codeCell.value = 'SOA-PP-001-5';
  codeCell.font = { ...ANEXO4_FONT, bold: true };
  codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ── Fila 4 (height 78.75): Título ──
  worksheet.getRow(4).height = 78.75;
  worksheet.mergeCells(4, COL_FIRST, 4, COL_LAST);
  const titleCell = worksheet.getCell(4, COL_FIRST);
  titleCell.value = {
    richText: [
      { text: 'RELACIÓN INDIVIDUAL\nDE TUTORES ACADÉMICOS CONTRATADOS U ORDINARIOS CON DEDICACIÓN MT, TC Y DE QUE SE ENCUENTRAN TUTORANDO  ESTUDIANTES DE PRACTICAS PROFESIONALES ( PASANTIAS )', font: { ...ANEXO4_FONT, bold: true } },
      { text: `\n${period}`, font: { ...ANEXO4_FONT, bold: true } },
    ],
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // ── Fila 5 (height 43.50): Nombre del tutor + fondo amarillo + rojo ──
  worksheet.getRow(5).height = 43.50;
  worksheet.mergeCells(5, COL_FIRST, 5, 8);
  const tutorNameCell = worksheet.getCell(5, COL_FIRST);
  tutorNameCell.value = `TUTOR: ${tutorName?.toUpperCase() || ''}`;
  tutorNameCell.font = ANEXO4_FONT;
  tutorNameCell.fill = ANEXO4_YELLOW_FILL;
  tutorNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
  tutorNameCell.border = { ...ANEXO4_HEADER_BORDER };

  // Celdas vacías con fondo amarillo para completar B5:H5
  for (let c = 3; c <= 8; c++) {
    const cell = worksheet.getCell(5, c);
    cell.fill = ANEXO4_YELLOW_FILL;
    cell.border = { ...ANEXO4_HEADER_BORDER };
  }

  // Texto rojo en O5:Q5 (columnas 15:17)
  worksheet.mergeCells(5, 15, 5, 17);
  const redCell = worksheet.getCell(5, 15);
  redCell.value = 'MODALIDAD PRESENCIAL';
  redCell.font = { ...ANEXO4_FONT, color: { argb: 'FFFF0000' }, bold: true };
  redCell.alignment = { horizontal: 'center', vertical: 'middle' };
  redCell.fill = ANEXO4_YELLOW_FILL;
  redCell.border = { ...ANEXO4_HEADER_BORDER };

  // ── Fila 6: vacía (height 12.75) ──
  worksheet.getRow(6).height = 12.75;

  // ── Filas 7-8: Encabezados de tabla (verde #92D050) ──
  worksheet.getRow(7).height = 30;
  worksheet.getRow(8).height = 50;

  // Headers de 1 fila (sin merge vertical)
  const singleRowHeaders = [
    { text: 'N°', col: 2, rowspan: 2 },
    { text: 'REGIÓN', col: 3, rowspan: 2 },
    { text: 'NÚCLEO', col: 4, rowspan: 2 },
    { text: 'EXTENSIÓN', col: 5, rowspan: 2 },
    { text: 'CARRERA', col: 6, rowspan: 2 },
    { text: 'IDENTIFICACIÓN DEL ESTUDIANTE', col: 7, colspan: 2 },
    { text: 'SEXO', col: 9, rowspan: 2 },
    { text: 'CONDICIÓN', col: 10, rowspan: 2 },
    { text: 'TIPO DE ESTUDIANTE', col: 11, colspan: 2 },
    { text: 'TELÉFONO', col: 13, rowspan: 2 },
    { text: 'CORREO ELECTRÓNICO', col: 14, rowspan: 2 },
    { text: 'NOMBRE DE LA INSTITUCIÓN', col: 15, rowspan: 2 },
    { text: 'DIRECCIÓN', col: 16, rowspan: 2 },
    { text: 'RIF', col: 17, rowspan: 2 },
    { text: 'CONVENIO', col: 18, rowspan: 2 },
    { text: 'OBSERVACIÓN', col: 19, rowspan: 2 },
  ];

  singleRowHeaders.forEach((h) => {
    const cell = worksheet.getCell(7, h.col);
    cell.value = h.text;
    cell.font = { ...ANEXO4_FONT, bold: true };
    cell.fill = ANEXO4_HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ANEXO4_HEADER_BORDER;

    if (h.colspan) {
      worksheet.mergeCells(7, h.col, 7, h.col + h.colspan - 1);
    }
    if (h.rowspan === 2) {
      worksheet.mergeCells(7, h.col, 8, h.col);
    }
  });

  // Sub-headers en fila 8
  const subHeaders = [
    { text: 'NOMBRE', col: 7 },
    { text: 'APELLIDO', col: 8 },
    { text: 'CIVIL / MILITAR', col: 11 },
    { text: 'RANGO', col: 12 },
  ];

  subHeaders.forEach(({ text, col }) => {
    const cell = worksheet.getCell(8, col);
    cell.value = text;
    cell.font = { ...ANEXO4_FONT, bold: true };
    cell.fill = ANEXO4_HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ANEXO4_HEADER_BORDER;
  });

  // ── Filas de datos (height 30) ──
  data.forEach((item, idx) => {
    const rowIdx = 9 + idx;
    const excelRow = worksheet.getRow(rowIdx);
    excelRow.height = 30;

    // Merges para identificación del estudiante (7-8)
    worksheet.mergeCells(rowIdx, 7, rowIdx, 8);

    const dataCols: { key: string; physCol: number }[] = [
      { key: 'nro', physCol: 2 },
      { key: 'region', physCol: 3 },
      { key: 'nucleo', physCol: 4 },
      { key: 'extension', physCol: 5 },
      { key: 'carrera', physCol: 6 },
      { key: 'nombreEstudiante', physCol: 7 },
      { key: 'apellidoEstudiante', physCol: 8 },
      { key: 'sexo', physCol: 9 },
      { key: 'condicion', physCol: 10 },
      { key: 'tipoEstudiante', physCol: 11 },
      { key: 'rango', physCol: 12 },
      { key: 'telefono', physCol: 13 },
      { key: 'correo', physCol: 14 },
      { key: 'institucion', physCol: 15 },
      { key: 'direccion', physCol: 16 },
      { key: 'rif', physCol: 17 },
      { key: 'convenio', physCol: 18 },
      { key: 'observacion', physCol: 19 },
    ];

    dataCols.forEach(({ key, physCol }) => {
      const cell = excelRow.getCell(physCol);
      let val = item[key];
      if (val !== null && val !== undefined) {
        val = typeof val === 'string' ? val.toUpperCase() : val;
      } else {
        val = '';
      }
      cell.value = val;
      cell.font = ANEXO4_FONT;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ANEXO4_DATA_BORDER;
    });
  });

  // ── Configuración de página ──
  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 1 as any,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.709, right: 0.709, top: 0.748, bottom: 0.748, header: 0, footer: 0 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileName}.xlsx`);
  }
}

/**
 * Genera un Excel simple a partir de columnas y datos.
 * Incluye membrete institucional, header verde y datos en UPPERCASE.
 */
export async function generateSimpleExcel(
  data: any[],
  columns: { header: string; accessor: string | ((item: any) => string | number | boolean | null | undefined) }[],
  fileName: string,
  title?: string,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');
  const totalCols = columns.length;

  worksheet.columns = columns.map(() => ({
    width: 20,
  }));

  // Membrete institucional
  applyInstitutionalHeader(worksheet, totalCols);
  await addLogos(workbook, worksheet);

  const titleRow = 7;
  if (title) {
    applyTitleRow(worksheet, titleRow, title, totalCols);
  }

  const blankRow = title ? 8 : 7;
  const headerRow = blankRow + 1;
  applyHeaderRow(worksheet, headerRow, columns.map((col, i) => ({
    col: i + 1,
    text: col.header,
  })));

  let currentRow = headerRow + 1;
  data.forEach((item) => {
    const values = columns.map((col) => {
      let v: unknown;
      if (typeof col.accessor === 'function') {
        v = col.accessor(item) ?? '';
      } else {
        v = (item as any)[col.accessor] ?? '';
      }
      // UPPERCASE for strings
      return typeof v === 'string' ? v.toUpperCase() : v;
    });
    applyDataRow(worksheet, currentRow, values);
    currentRow++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}

/**
 * Generates the Proyección Prospectiva de Pasantías Excel report.
 * Formato: membrete 6 filas, título, código Form-002-2019,
 * tabla con REGIÓN | NÚCLEO | EXTENSIÓN | CARRERAS CORTAS | CANT. PROY. | CARRERAS LARGAS | CANT. PROY.
 * Rowspan para REGIÓN, NÚCLEO, EXTENSIÓN. Subtotales por núcleo.
 */
export async function generateProyeccionExcel(data: any, period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Proyeccion Pasantias');
  const totalCols = 7;

  worksheet.columns = [
    { key: 'region', width: 18 }, { key: 'nucleo', width: 20 },
    { key: 'extension', width: 20 }, { key: 'carrerasCortas', width: 30 },
    { key: 'cantCortas', width: 18 }, { key: 'carrerasLargas', width: 30 },
    { key: 'cantLargas', width: 18 },
  ];

  // Membrete institucional (6 filas)
  applyInstitutionalHeader(worksheet, totalCols);
  await addLogos(workbook, worksheet);

  // Título
  const titleRow = 7;
  worksheet.mergeCells(`A${titleRow}:${lastCol(totalCols)}${titleRow}`);
  const tRow = worksheet.getRow(titleRow);
  tRow.height = 30;
  const periodDesc = data.periodDescription || period;
  tRow.getCell(1).value = {
    richText: [
      { text: 'PROYECCIÓN', font: { ...DEFAULT_FONT, size: 14, bold: true } },
      { text: ' PROSPECTIVA DE LAS PASANTÍAS PARA EL PERÍODO ACADÉMICO ', font: { ...DEFAULT_FONT, size: 11, bold: true } },
      { text: periodDesc, font: { ...DEFAULT_FONT, size: 11, bold: true } }
    ]
  };
  tRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Código de formulario
  const codeRow = 8;
  worksheet.mergeCells(`A${codeRow}:${lastCol(totalCols)}${codeRow}`);
  const cRow = worksheet.getRow(codeRow);
  cRow.height = 20;
  cRow.getCell(1).value = 'Código: Form-002-2019 CPA-VAC_JP';
  cRow.getCell(1).font = { ...DEFAULT_FONT, size: 8, bold: true };
  cRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

  // Header row 9 (CARRERAS colspan 4) + row 10 sub-headers
  const row9 = worksheet.getRow(9);
  const row10 = worksheet.getRow(10);
  row9.height = 20;
  row10.height = 55;

  worksheet.mergeCells('A9:A10');
  worksheet.mergeCells('B9:B10');
  worksheet.mergeCells('C9:C10');
  worksheet.mergeCells('D9:G9');

  const headerCols = [
    { col: 'A', text: 'REGIÓN' }, { col: 'B', text: 'NÚCLEO' }, { col: 'C', text: 'EXTENSIÓN' },
  ];
  headerCols.forEach(({ col, text }) => {
    const cell = row9.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
    row10.getCell(col).style = HEADER_STYLE;
  });

  const carrerasCell = row9.getCell('D');
  carrerasCell.value = 'CARRERAS';
  carrerasCell.style = HEADER_STYLE;
  for (let c = 5; c <= 7; c++) row9.getCell(c).style = HEADER_STYLE;

  const subHeaders = [
    { col: 'D', text: 'REGISTRE NOMBRE DE LAS CARRERAS CORTAS' },
    { col: 'E', text: `CANTIDAD DE ESTUDIANTES PROYECTADOS A PASANTÍAS ${periodDesc}` },
    { col: 'F', text: 'REGISTRE NOMBRE DE LAS CARRERAS LARGAS' },
    { col: 'G', text: `CANTIDAD DE ESTUDIANTES PROYECTADOS A PASANTÍAS ${periodDesc}` },
  ];
  subHeaders.forEach(({ col, text }) => {
    const cell = row10.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
  });

  // Data rows — one career per row, nucleus+extension in every row
  let currentRow = 11;
  const nuclei = data.nuclei || [];

  nuclei.forEach((nucleus: any, nIdx: number) => {
    const shortCareers = nucleus.shortCareers || [];
    const longCareers = nucleus.longCareers || [];

    // Build flat career list: all short first, then all long
    const careerRows: { shortName: string; shortCount: number; longName: string; longCount: number }[] = [];
    shortCareers.forEach((c: any) =>
      careerRows.push({ shortName: c.careerName || '', shortCount: c.proyectados ?? 0, longName: '', longCount: 0 })
    );
    longCareers.forEach((c: any) =>
      careerRows.push({ shortName: '', shortCount: 0, longName: c.careerName || '', longCount: c.proyectados ?? 0 })
    );

    const startRow = currentRow;
    const dataRowCount = Math.max(careerRows.length, 1);
    const totalRows = dataRowCount + 4; // data + SUB-TOTALES + TOTAL CARRERAS + TOTAL ESTUDIANTES + blank

    // Region merged across ALL rows (data + subtotals)
    worksheet.mergeCells(`A${startRow}:A${startRow + totalRows - 1}`);
    worksheet.getCell(startRow, 1).value = (nucleus.region || '').toUpperCase();
    for (let r = 0; r < totalRows; r++) {
      worksheet.getRow(startRow + r).getCell('A').style = DATA_STYLE;
    }

    // Data rows
    if (careerRows.length === 0) {
      const r = worksheet.getRow(currentRow);
      r.height = 41;
      r.getCell('B').value = (nucleus.name || '').toUpperCase();
      r.getCell('B').style = DATA_STYLE;
      r.getCell('C').value = (nucleus.extension || '').toUpperCase();
      r.getCell('C').style = DATA_STYLE;
      for (let c = 4; c <= 7; c++) applyDataCell(worksheet, currentRow, c, '');
      currentRow++;
    } else {
      careerRows.forEach((row, i) => {
        const r = worksheet.getRow(currentRow);
        r.height = 41;
        r.getCell('B').value = (nucleus.name || '').toUpperCase();
        r.getCell('B').style = DATA_STYLE;
        r.getCell('C').value = (nucleus.extension || '').toUpperCase();
        r.getCell('C').style = DATA_STYLE;
        applyDataCell(worksheet, currentRow, 4, row.shortName.toUpperCase());
        applyDataCell(worksheet, currentRow, 5, row.shortCount);
        applyDataCell(worksheet, currentRow, 6, row.longName.toUpperCase());
        applyDataCell(worksheet, currentRow, 7, row.longCount);
        currentRow++;
      });
    }

    // Subtotals for this nucleus
    const totalShort = shortCareers.length;
    const totalShortEst = shortCareers.reduce((sum: number, c: any) => sum + (c.proyectados || 0), 0);
    const totalLong = longCareers.length;
    const totalLongEst = longCareers.reduce((sum: number, c: any) => sum + (c.proyectados || 0), 0);
    const totalCareers = totalShort + totalLong;
    const totalStudents = totalShortEst + totalLongEst;

    // 1. SUB-TOTALES — 4-column values (D/E/F/G), label B-C merged (A occupied by region)
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    const label1 = worksheet.getCell(currentRow, 2);
    label1.value = 'SUB-TOTALES';
    label1.style = SUBTOTAL_LABEL_STYLE;
    [totalShort, totalShortEst, totalLong, totalLongEst].forEach((v, i) => {
      const cell = worksheet.getCell(currentRow, 4 + i);
      cell.value = v;
      cell.style = SUBTOTAL_VALUE_STYLE;
    });
    currentRow++;

    // 2. TOTAL CARRERAS DEL NÚCLEO — B-C label, D value, E-G empty (white bg)
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    const label2 = worksheet.getCell(currentRow, 2);
    label2.value = 'TOTAL CARRERAS DEL NÚCLEO';
    label2.style = TOTAL_CARRERAS_STYLE;
    const v2 = worksheet.getCell(currentRow, 4);
    v2.value = totalCareers;
    v2.style = TOTAL_CARRERAS_VALUE_STYLE;
    currentRow++;

    // 3. TOTAL DE ESTUDIANTES PASANTES — B-C label, D-E value merged (2 cells)
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    const label3 = worksheet.getCell(currentRow, 2);
    label3.value = `TOTAL DE ESTUDIANTES PASANTES DEL NÚCLEO PROYECTADOS PARA EL ${periodDesc}`;
    label3.style = TOTAL_CARRERAS_STYLE;
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    const v3 = worksheet.getCell(currentRow, 4);
    v3.value = totalStudents;
    v3.style = TOTAL_CARRERAS_VALUE_STYLE;
    currentRow++;

    currentRow++; // blank row between nuclei
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}


