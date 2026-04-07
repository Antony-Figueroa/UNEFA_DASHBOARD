import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

/**
 * Genera el reporte Excel ANEXO 4 para Tutores Académicos
 * con encabezado institucional y estructura específica.
 */
export function generateAnexo4Excel(data: any[], fileName: string) {
  const wb = XLSX.utils.book_new();
  
  // Encabezado Institucional
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

  // Cabeceras de la Tabla
  const tableHeaders = [
    'N°', 
    'REGIÓN', 
    'NÚCLEO', 
    'EXTENSIÓN', 
    'CARRERA', 
    'NOMBRE', 
    'APELLIDO', 
    'CÉDULA', 
    'CONDICIÓN', 
    'DEDICACIÓN', 
    'CATEGORÍA', 
    'TELÉFONO', 
    'CORREO', 
    'ESTUDIANTES'
  ];

  // Mapeo de datos
  const rows = data.map(item => [
    item.nro || '',
    (item.region || '').toUpperCase(),
    (item.nucleo || '').toUpperCase(),
    (item.extension || '').toUpperCase(),
    (item.carrera || '').toUpperCase(),
    (item.nombreTutor || '').toUpperCase(),
    (item.apellidoTutor || '').toUpperCase(),
    item.cedula || '',
    (item.condicion || '').toUpperCase(),
    (item.dedicacion || '').toUpperCase(),
    (item.categoria || '').toUpperCase(),
    item.telefono || '',
    item.correo || '',
    item.cantidadEstudiantes || 0
  ]);

  const wsData = [
    ...institutionalHeader,
    tableHeaders,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Configuración de anchos de columna
  const cols = [
    { wch: 6 },   // N°
    { wch: 18 },  // Región
    { wch: 22 },  // Núcleo
    { wch: 22 },  // Extensión
    { wch: 35 },  // Carrera
    { wch: 22 },  // Nombre
    { wch: 22 },  // Apellido
    { wch: 16 },  // Cédula
    { wch: 15 },  // Condición
    { wch: 15 },  // Dedicación
    { wch: 15 },  // Categoría
    { wch: 15 },  // Teléfono
    { wch: 30 },  // Correo
    { wch: 14 }   // Estudiantes
  ];
  ws['!cols'] = cols;

  // Uniones de celdas para el encabezado (centrar título)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:N1');
  const lastColIndex = range.e.c;

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } }, // Fila 1
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } }, // Fila 2
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } }, // Fila 3
    { s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } }, // Fila 4
    { s: { r: 4, c: 0 }, e: { r: 4, c: lastColIndex } }, // Fila 5
    { s: { r: 6, c: 0 }, e: { r: 6, c: lastColIndex } }, // Título ANEXO 4
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Anexo 4');
  
  // Guardamos como .xlsx para mejor compatibilidad moderna
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Genera el reporte Excel RESUMEN PASANTIAS
 * con el formato exacto (colores, bordes, celdas combinadas) usando ExcelJS.
 */
export async function generateResumenPasantiasExcel(data: any[], period: string, fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Resumen Pasantias');

  // Configurar ancho de columnas
  worksheet.columns = [
    { key: 'region', width: 15 },
    { key: 'nucleo', width: 15 },
    { key: 'extension', width: 15 },
    { key: 'carrera', width: 30 },
    { key: 'tutoresAcad', width: 15 },
    { key: 'estudiantes', width: 15 },
    { key: 'empresa', width: 35 },
    { key: 'publica', width: 10 },
    { key: 'privada', width: 10 },
    { key: 'tutoresInst', width: 15 },
    { key: 'observacion', width: 20 },
  ];

  // Estilo de fuente global
  const defaultFont = { name: 'Arial', size: 9 };

  // 1. Encabezado Institucional (Filas 1 a 5)
  const headerLines = [
    'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
    'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
    'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
    'VICERRECTORADO ACADÉMICO',
    'COORDINACIÓN DE PLANIFICACIÓN ACADÉMICA'
  ];

  headerLines.forEach((line, index) => {
    const row = worksheet.getRow(index + 1);
    worksheet.mergeCells(`A${index + 1}:K${index + 1}`);
    const cell = row.getCell(1);
    cell.value = line;
    cell.font = { ...defaultFont, size: 9, bold: false };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Título del Reporte (Fila 7)
  worksheet.mergeCells('A7:K7');
  const titleRow = worksheet.getRow(7);
  titleRow.height = 25;
  titleRow.getCell(1).value = {
    richText: [
      { text: 'RESUMEN PASANTIAS ', font: { ...defaultFont, size: 11, bold: true } },
      { text: period, font: { ...defaultFont, size: 11, bold: true, color: { argb: 'FFFF0000' } } }
    ]
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Intentar cargar y agregar logo si es posible (Opcional, en frontend requiere fetch)
  try {
    // Logo izquierdo
    const responseLogo = await fetch('/logo-nuevo.png');
    const bufferLogo = await responseLogo.arrayBuffer();
    const imageIdLogo = workbook.addImage({
      buffer: bufferLogo,
      extension: 'png',
    });
    
    // Logo a la izquierda (usando coordenadas exactas para no distorsionar)
    worksheet.addImage(imageIdLogo, {
      tl: { col: 1, row: 0.2 }, // Columna B
      ext: { width: 85, height: 85 }
    });

    // Escudo derecho
    const responseEscudo = await fetch('/unefa-img/Escudo.png');
    const bufferEscudo = await responseEscudo.arrayBuffer();
    const imageIdEscudo = workbook.addImage({
      buffer: bufferEscudo,
      extension: 'png',
    });

    // Escudo a la derecha
    worksheet.addImage(imageIdEscudo, {
      tl: { col: 8.5, row: 0.2 }, // Entre I y J
      ext: { width: 85, height: 85 }
    });
  } catch (error) {
    console.warn('No se pudo cargar las imágenes para el Excel', error);
  }

  // 2. Cabeceras de la tabla (Fila 9 y 10)
  const headerStyle = {
    font: { ...defaultFont, bold: true, size: 8 },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF92D050' } // Verde claro
    },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  };

  const row9 = worksheet.getRow(9);
  const row10 = worksheet.getRow(10);
  row9.height = 20;
  row10.height = 40;

  // Celda Centro de Práctica (Abarca G9:J9)
  worksheet.mergeCells('G9:J9');
  const centroPracticaCell = row9.getCell('G');
  centroPracticaCell.value = 'CENTRO DE PRACTICA PROFESIONAL';
  centroPracticaCell.style = headerStyle;
  // Aplicar bordes a las celdas combinadas
  ['H','I','J'].forEach(col => {
    row9.getCell(col).style = headerStyle;
  });

  const columnsDef = [
    { col: 'A', text: 'REGIÓN', merge: true },
    { col: 'B', text: 'NÚCLEO', merge: true },
    { col: 'C', text: 'EXTENSIÓN', merge: true },
    { col: 'D', text: 'NOMBRE DE LA CARRERA', merge: true },
    { col: 'E', text: 'CANTIDAD DE\nTUTORES\nACADEMICOS', merge: true },
    { col: 'F', text: 'CANTIDAD\nDE\nESTUDIANTES', merge: true },
    { col: 'G', text: 'NOMBRE DE LA EMPRESA\n/ INSTITUCION', merge: false },
    { col: 'H', text: 'PÚBLICA', merge: false },
    { col: 'I', text: 'PRIVADA', merge: false },
    { col: 'J', text: 'CANTIDAD DE\nTUTORES\nINSTITUCIONALES', merge: false },
    { col: 'K', text: 'OBSERVACION', merge: true },
  ];

  columnsDef.forEach(def => {
    if (def.merge) {
      worksheet.mergeCells(`${def.col}9:${def.col}10`);
      const cell = row9.getCell(def.col);
      cell.value = def.text;
      cell.style = headerStyle;
      row10.getCell(def.col).style = headerStyle;
    } else {
      const cell = row10.getCell(def.col);
      cell.value = def.text;
      cell.style = headerStyle;
    }
  });

  // 3. Insertar los Datos
  const dataStyle = {
    font: { ...defaultFont, size: 8 },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  };

  let currentRow = 11;
  data.forEach(item => {
    const row = worksheet.getRow(currentRow);
    row.height = 35; // Alto para que el texto se ajuste

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
    
    // La cantidad de tutores institucionales suele ir en rojo según el ejemplo
    const tutoresInstCell = row.getCell('J');
    tutoresInstCell.value = item.cantidadTutoresInst || 0;
    tutoresInstCell.style = {
      ...dataStyle,
      font: { ...defaultFont, size: 8, bold: true, color: { argb: 'FFFF0000' } } // Rojo
    };

    row.getCell('K').value = item.observacion || '';

    // Aplicar estilos a las demás celdas
    ['A','B','C','D','E','F','G','H','I','K'].forEach(col => {
      row.getCell(col).style = dataStyle;
    });

    currentRow++;
  });

  // Guardar archivo usando FileSaver
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Guardado compatible con navegador
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, `${fileName}.xlsx`);
  }
}
