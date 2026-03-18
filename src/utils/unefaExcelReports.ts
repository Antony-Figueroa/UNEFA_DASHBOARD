import * as XLSX from 'xlsx';

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
