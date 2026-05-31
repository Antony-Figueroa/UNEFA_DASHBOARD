import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const INSTITUTIONAL_HEADER = [
  'REPÚBLICA BOLIVARIANA DE VENEZUELA',
  'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
  'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
  'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
  'VICERRECTORADO ACADÉMICO',
  'COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA',
];

const DEFAULT_FONT = { name: 'Arial', size: 9 };
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF92D050' } };
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
  font: { ...DEFAULT_FONT, size: 8 },
  alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
  border: THIN_BORDER,
};

function applyInstitutionalHeader(worksheet: ExcelJS.Worksheet, totalCols: number) {
  INSTITUTIONAL_HEADER.forEach((line, index) => {
    const row = worksheet.getRow(index + 1);
    worksheet.mergeCells(`A${index + 1}:${String.fromCharCode(64 + totalCols)}${index + 1}`);
    const cell = row.getCell(1);
    cell.value = line;
    cell.font = { ...DEFAULT_FONT, size: 9, bold: false };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

async function addLogos(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet) {
  try {
    const responseLogo = await fetch('/logo-nuevo.png');
    const bufferLogo = await responseLogo.arrayBuffer();
    const imageIdLogo = workbook.addImage({ buffer: bufferLogo, extension: 'png' });
    worksheet.addImage(imageIdLogo, { tl: { col: 1, row: 0.2 }, ext: { width: 85, height: 85 } });

    const responseEscudo = await fetch('/unefa-img/Escudo.png');
    const bufferEscudo = await responseEscudo.arrayBuffer();
    const imageIdEscudo = workbook.addImage({ buffer: bufferEscudo, extension: 'png' });
    worksheet.addImage(imageIdEscudo, { tl: { col: 8.5, row: 0.2 }, ext: { width: 85, height: 85 } });
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
  cell.value = value ?? '';
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
export function generateAnexo4Excel(data: any[], fileName: string) {
  const wb = XLSX.utils.book_new();
  const institutionalHeader = [
    ['REPÚBLICA BOLIVARIANA DE VENEZUELA'],
    ['MINISTERIO DEL PODER POPULAR PARA LA DEFENSA'],
    ['UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA'],
    ['DE LA FUERZA ARMADA NACIONAL BOLIVARIANA'],
    ['NÚCLEO PORTUGUESA - EXTENSIÓN ACARIGUA'],
    [''],
    ['ANEXO 4 - RELACIÓN DE TUTORES ACADÉMICOS'],
    ['']
  ];
  const tableHeaders = [
    'N°', 'REGIÓN', 'NÚCLEO', 'EXTENSIÓN', 'CARRERA', 'NOMBRE',
    'APELLIDO', 'CÉDULA', 'CONDICIÓN', 'DEDICACIÓN', 'CATEGORÍA',
    'TELÉFONO', 'CORREO', 'ESTUDIANTES'
  ];
  const rows = data.map(item => [
    item.nro || '', (item.region || '').toUpperCase(), (item.nucleo || '').toUpperCase(),
    (item.extension || '').toUpperCase(), (item.carrera || '').toUpperCase(),
    (item.nombreTutor || '').toUpperCase(), (item.apellidoTutor || '').toUpperCase(),
    item.cedula || '', (item.condicion || '').toUpperCase(), (item.dedicacion || '').toUpperCase(),
    (item.categoria || '').toUpperCase(), item.telefono || '', item.correo || '', item.cantidadEstudiantes || 0
  ]);
  const wsData = [...institutionalHeader, tableHeaders, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const cols = [
    { wch: 6 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 35 },
    { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 14 }
  ];
  ws['!cols'] = cols;
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:N1');
  const lastColIndex = range.e.c;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: lastColIndex } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: lastColIndex } },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Anexo 4');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Genera el reporte Excel RESUMEN PASANTIAS
 * con el formato exacto (colores, bordes, celdas combinadas) usando ExcelJS.
 */
export async function generateResumenPasantiasExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Resumen Pasantias');
  const totalCols = 11;

  worksheet.columns = [
    { key: 'region', width: 15 }, { key: 'nucleo', width: 15 },
    { key: 'extension', width: 15 }, { key: 'carrera', width: 30 },
    { key: 'tutoresAcad', width: 15 }, { key: 'estudiantes', width: 15 },
    { key: 'empresa', width: 35 }, { key: 'publica', width: 10 },
    { key: 'privada', width: 10 }, { key: 'tutoresInst', width: 15 },
    { key: 'observacion', width: 20 },
  ];

  applyInstitutionalHeader(worksheet, totalCols);
  await addLogos(workbook, worksheet);

  const titleRow = 7;
  worksheet.mergeCells(`A${titleRow}:K${titleRow}`);
  const tRow = worksheet.getRow(titleRow);
  tRow.height = 25;
  tRow.getCell(1).value = {
    richText: [
      { text: 'RESUMEN PASANTIAS ', font: { ...DEFAULT_FONT, size: 11, bold: true } },
      { text: period, font: { ...DEFAULT_FONT, size: 11, bold: true, color: { argb: 'FFFF0000' } } }
    ]
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
    { col: 'E', text: 'CANTIDAD DE\nTUTORES\nACADEMICOS', merge: true },
    { col: 'F', text: 'CANTIDAD\nDE\nESTUDIANTES', merge: true },
    { col: 'G', text: 'NOMBRE DE LA EMPRESA\n/ INSTITUCION', merge: false },
    { col: 'H', text: 'PÚBLICA', merge: false }, { col: 'I', text: 'PRIVADA', merge: false },
    { col: 'J', text: 'CANTIDAD DE\nTUTORES\nINSTITUCIONALES', merge: false },
    { col: 'K', text: 'OBSERVACION', merge: true },
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
    row.height = 35;
    const isPublica = item.tipoEmpresa?.toUpperCase() === 'PÚBLICA' || item.tipoEmpresa?.toUpperCase() === 'PUBLICA';
    const isPrivada = item.tipoEmpresa?.toUpperCase() === 'PRIVADA';

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

    row.getCell('K').value = item.observacion || '';
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

export async function generateRelacionGeneralTutoresExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relacion Tutores');
  const totalCols = 14;

  worksheet.columns = [
    { key: 'nro', width: 5 }, { key: 'region', width: 14 }, { key: 'nucleo', width: 16 },
    { key: 'extension', width: 16 }, { key: 'carrera', width: 30 }, { key: 'nombre', width: 22 },
    { key: 'apellido', width: 22 }, { key: 'cedula', width: 14 }, { key: 'condicion', width: 14 },
    { key: 'dedicacion', width: 14 }, { key: 'categoria', width: 14 }, { key: 'telefono', width: 15 },
    { key: 'correo', width: 28 }, { key: 'estudiantes', width: 12 },
  ];

  applyInstitutionalHeader(worksheet, totalCols);

  applyTitleRow(worksheet, 7, `RELACIÓN GENERAL DE TUTORES ACADÉMICOS - ${period}`, totalCols);

  applyHeaderRow(worksheet, 9, [
    { col: 1, text: 'N°' }, { col: 2, text: 'REGIÓN' }, { col: 3, text: 'NÚCLEO' },
    { col: 4, text: 'EXTENSIÓN' }, { col: 5, text: 'CARRERA' }, { col: 6, text: 'NOMBRE' },
    { col: 7, text: 'APELLIDO' }, { col: 8, text: 'CÉDULA' }, { col: 9, text: 'CONDICIÓN' },
    { col: 10, text: 'DEDICACIÓN' }, { col: 11, text: 'CATEGORÍA' }, { col: 12, text: 'TELÉFONO' },
    { col: 13, text: 'CORREO' }, { col: 14, text: 'ESTUDIANTES' },
  ]);

  let currentRow = 10;
  data.forEach((item, idx) => {
    applyDataRow(worksheet, currentRow, [
      idx + 1, (item.region || '').toUpperCase(), (item.nucleo || '').toUpperCase(),
      (item.extension || '').toUpperCase(), (item.carrera || '').toUpperCase(),
      (item.nombreTutor || item.nombre || '').toUpperCase(),
      (item.apellidoTutor || item.apellido || '').toUpperCase(),
      item.cedula || item.cedulaTutor || '', (item.condicion || '').toUpperCase(),
      (item.dedicacion || '').toUpperCase(), (item.categoria || '').toUpperCase(),
      item.telefono || '', item.correo || item.email || '', item.cantidadEstudiantes || 0,
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

export async function generateRelacionEmpresasExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relacion Empresas');
  const totalCols = 9;

  worksheet.columns = [
    { key: 'region', width: 14 }, { key: 'nucleo', width: 16 }, { key: 'extension', width: 16 },
    { key: 'empresa', width: 50 }, { key: 'rif', width: 18 }, { key: 'tipo', width: 12 },
    { key: 'publica', width: 10 }, { key: 'carrera', width: 30 }, { key: 'estudiantes', width: 14 },
  ];

  applyInstitutionalHeader(worksheet, totalCols);

  applyTitleRow(worksheet, 7, `RELACIÓN DE EMPRESAS O INSTITUCIONES QUE DEMANDAN ASIGNACIÓN DE PASANTES - ${period}`, totalCols);

  const row9 = worksheet.getRow(9);
  const row10 = worksheet.getRow(10);
  row9.height = 20;
  row10.height = 35;

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
      worksheet.mergeCells(`${def.col}9:${def.col}10`);
      const cell = row9.getCell(def.col);
      cell.value = def.text;
      cell.style = HEADER_STYLE;
      row10.getCell(def.col).style = HEADER_STYLE;
    }
  });

  const pubCell = row10.getCell('F');
  pubCell.value = 'PÚBLICA';
  pubCell.style = HEADER_STYLE;
  const privCell = row10.getCell('G');
  privCell.value = 'PRIVADA';
  privCell.style = HEADER_STYLE;
  const tipoCell = row9.getCell('F');
  tipoCell.value = 'TIPO DE\nEMPRESA';
  tipoCell.style = HEADER_STYLE;
  row9.getCell('G').style = HEADER_STYLE;

  let currentRow = 11;
  data.forEach(item => {
    const isPublica = item.tipo?.toUpperCase() === 'PÚBLICA' || item.tipo?.toUpperCase() === 'PUBLICA' || item.tipo === 'X';
    const isPrivada = item.tipo?.toUpperCase() === 'PRIVADA';

    const row = worksheet.getRow(currentRow);
    row.height = 25;

    applyDataCell(worksheet, currentRow, 1, (item.region || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 2, (item.nucleo || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 3, (item.extension || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 4, (item.empresa || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 5, item.rif || '');
    applyDataCell(worksheet, currentRow, 6, isPublica ? 'X' : '');
    applyDataCell(worksheet, currentRow, 7, isPrivada ? 'X' : '');
    applyDataCell(worksheet, currentRow, 8, (item.carrera || '').toUpperCase());
    applyDataCell(worksheet, currentRow, 9, item.cantidadEstudiantes || 0);

    currentRow++;
  });

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
    { col: 'F', text: 'CONTACTO' }, { col: 'G', text: 'EMAIL' },
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
      item.tutorAcademico?.contacto || '', item.tutorAcademico?.email || '',
      (item.tutorMetodologico?.nombre || '').toUpperCase(),
      item.tutorMetodologico?.contacto || '',
      (item.tutorMetodologico?.horario || '').toUpperCase(),
      (item.evaluador?.nombre || '').toUpperCase(), item.evaluador?.contacto || '',
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

export async function generateRelacionIndividualDocenteExcel(data: any[], period: string, tutorName: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relacion Individual');
  const totalCols = 14;

  worksheet.columns = [
    { key: 'nro', width: 5 }, { key: 'region', width: 14 }, { key: 'nucleo', width: 16 },
    { key: 'extension', width: 16 }, { key: 'carrera', width: 28 },
    { key: 'estNombre', width: 22 }, { key: 'estApellido', width: 22 },
    { key: 'estCi', width: 16 }, { key: 'estSexo', width: 8 },
    { key: 'estTipo', width: 14 }, { key: 'estTelefono', width: 14 },
    { key: 'instNombre', width: 30 }, { key: 'tutorInstNombre', width: 22 },
    { key: 'direccion', width: 30 },
  ];

  applyInstitutionalHeader(worksheet, totalCols);

  const titleText = tutorName
    ? `RELACIÓN INDIVIDUAL DEL DOCENTE - ${tutorName.toUpperCase()} - ${period}`
    : `RELACIÓN INDIVIDUAL DEL DOCENTE - ${period}`;
  applyTitleRow(worksheet, 7, titleText, totalCols);

  const row9 = worksheet.getRow(9);
  const row10 = worksheet.getRow(10);
  row9.height = 20;
  row10.height = 40;

  worksheet.mergeCells('A9:A10');
  worksheet.mergeCells('B9:B10');
  worksheet.mergeCells('C9:C10');
  worksheet.mergeCells('D9:D10');
  worksheet.mergeCells('E9:E10');
  worksheet.mergeCells('F9:K9');
  worksheet.mergeCells('L9:L10');
  worksheet.mergeCells('M9:M10');
  worksheet.mergeCells('N9:N10');

  const topCols = [
    { col: 'A', text: 'N°' }, { col: 'B', text: 'REGIÓN' }, { col: 'C', text: 'NÚCLEO' },
    { col: 'D', text: 'EXTENSIÓN' }, { col: 'E', text: 'CARRERA' },
  ];
  topCols.forEach(({ col, text }) => {
    const cell = row9.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
    row10.getCell(col).style = HEADER_STYLE;
  });

  const estCell = row9.getCell('F');
  estCell.value = 'ESTUDIANTE';
  estCell.style = HEADER_STYLE;
  for (let c = 7; c <= 11; c++) row9.getCell(c).style = HEADER_STYLE;

  const instCell = row9.getCell('L');
  instCell.value = 'INSTITUCIÓN';
  instCell.style = HEADER_STYLE;
  row10.getCell('L').style = HEADER_STYLE;

  const tutorInstCell = row9.getCell('M');
  tutorInstCell.value = 'TUTOR INSTITUCIONAL';
  tutorInstCell.style = HEADER_STYLE;
  row10.getCell('M').style = HEADER_STYLE;

  const dirCell = row9.getCell('N');
  dirCell.value = 'DIRECCIÓN';
  dirCell.style = HEADER_STYLE;
  row10.getCell('N').style = HEADER_STYLE;

  const subEst = [
    { col: 'F', text: 'NOMBRE' }, { col: 'G', text: 'APELLIDO' },
    { col: 'H', text: 'CÉDULA' }, { col: 'I', text: 'SEXO' },
    { col: 'J', text: 'TIPO' }, { col: 'K', text: 'TELÉFONO' },
  ];
  subEst.forEach(({ col, text }) => {
    const cell = row10.getCell(col);
    cell.value = text;
    cell.style = HEADER_STYLE;
  });

  let currentRow = 11;
  data.forEach(item => {
    applyDataRow(worksheet, currentRow, [
      item.nro, (item.region || '').toUpperCase(), (item.nucleo || '').toUpperCase(),
      (item.extension || '').toUpperCase(), (item.carrera || '').toUpperCase(),
      (item.estudiante?.nombre || '').toUpperCase(), (item.estudiante?.apellido || '').toUpperCase(),
      item.estudiante?.ci || '', (item.estudiante?.sexo || '').toUpperCase(),
      (item.estudiante?.tipo || '').toUpperCase(), item.estudiante?.telefono || '',
      (item.institucion?.nombre || '').toUpperCase(),
      `${(item.tutorInstitucional?.nombre || '').toUpperCase()} ${(item.tutorInstitucional?.apellido || '').toUpperCase()}`.trim(),
      (item.direccion || '').toUpperCase(),
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

export async function generateDistribucionTutoresV2Excel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Distribucion Tutores V2');
  const totalCols = 14;

  worksheet.columns = [
    { key: 'nro', width: 5 }, { key: 'carrera', width: 28 },
    { key: 'estudiante', width: 28 },
    { key: 'tutorAcadTitulo', width: 16 }, { key: 'tutorAcadNombre', width: 28 },
    { key: 'tutorAcadContacto', width: 14 },
    { key: 'tutorMetoNombre', width: 28 }, { key: 'tutorMetoContacto', width: 14 },
    { key: 'tutorMetoHorario', width: 18 }, { key: 'tutorMetoHorarioDet', width: 22 },
    { key: 'evalNombre', width: 28 }, { key: 'evalContacto', width: 14 },
  ];

  applyInstitutionalHeader(worksheet, totalCols);

  applyTitleRow(worksheet, 7, `DISTRIBUCIÓN DE TUTORES (V2) - ${period}`, totalCols);
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
  worksheet.mergeCells('K9:M9');

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
    { col: 'F', text: 'CONTACTO' }, { col: 'G', text: 'EMAIL' },
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
      item.tutorAcademico?.contacto || '', item.tutorAcademico?.email || '',
      (item.tutorMetodologico?.nombre || '').toUpperCase(),
      item.tutorMetodologico?.contacto || '',
      (item.tutorMetodologico?.horario || '').toUpperCase(),
      (item.horarioMetodologicoDetallado || item.tutorMetodologico?.horarioDetallado || '').toUpperCase(),
      (item.evaluador?.nombre || '').toUpperCase(), item.evaluador?.contacto || '',
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
