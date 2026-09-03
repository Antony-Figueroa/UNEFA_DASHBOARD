/**
 * @file unefaExcelReports.test.ts
 * @description Tests para generateProyeccionExcel — verifica que genera el Excel sin errores
 *   con datos mock realistas, incluyendo múltiples núcleos y carreras cortas/largas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';

// Mock file-saver antes de importar el módulo
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

/** Lee un Blob jsdom a ArrayBuffer (arrayBuffer() no está en el Blob de jsdom). */
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/** Carga el workbook generado a partir del Blob capturado por el mock de file-saver. */
async function loadGeneratedWorkbook(): Promise<ExcelJS.Workbook> {
  const { saveAs } = await import('file-saver');
  const blob = (saveAs as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
  const buf = await blobToArrayBuffer(blob);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb;
}

/** Devuelve el texto plano de un valor de celda (string | richText | number). */
function cellPlainText(cell: ExcelJS.Cell): string {
  const v = cell.value as any;
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v?.richText)) return v.richText.map((r: any) => r.text).join('');
  return String(v);
}

describe('generateProyeccionExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería generar Excel sin errores con datos completos (múltiples núcleos, carreras cortas+largas)', async () => {
    const { generateProyeccionExcel } = await import('../unefaExcelReports');

    const mockData = {
      periodDescription: '2025-1',
      nuclei: [
        {
          region: 'LOS LLANOS',
          name: 'PORTUGUESA',
          extension: 'ACARIGUA',
          shortCareers: [
            { careerName: 'Administración', proyectados: 15 },
            { careerName: 'Contaduría Pública', proyectados: 22 },
          ],
          longCareers: [
            { careerName: 'Ingeniería en Informática', proyectados: 30 },
            { careerName: 'Licenciatura en Educación', proyectados: 18 },
          ],
        },
        {
          region: 'LOS LLANOS',
          name: 'PORTUGUESA',
          extension: 'GUANARE',
          shortCareers: [
            { careerName: 'Administración', proyectados: 10 },
          ],
          longCareers: [
            { careerName: 'Ingeniería Agronómica', proyectados: 12 },
          ],
        },
        {
          region: 'CAPITAL',
          name: 'DISTRITO CAPITAL',
          extension: 'CARACAS',
          shortCareers: [],
          longCareers: [
            { careerName: 'Derecho', proyectados: 45 },
            { careerName: 'Medicina', proyectados: 60 },
            { careerName: 'Ingeniería Civil', proyectados: 35 },
          ],
        },
      ],
    };

    // Debería ejecutarse sin lanzar excepción
    await expect(
      generateProyeccionExcel(mockData, '2025-1', 'test-proyeccion')
    ).resolves.toBeUndefined();

    // Verificar que file-saver.saveAs fue llamado
    const { saveAs } = await import('file-saver');
    expect(saveAs).toHaveBeenCalledOnce();
    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'test-proyeccion.xlsx'
    );
  });

  it('debería manejar núcleo sin carreras (shortCareers y longCareers vacíos)', async () => {
    const { generateProyeccionExcel } = await import('../unefaExcelReports');

    const mockData = {
      periodDescription: '2025-2',
      nuclei: [
        {
          region: 'LOS LLANOS',
          name: 'PORTUGUESA',
          extension: 'ACARIGUA',
          shortCareers: [],
          longCareers: [],
        },
      ],
    };

    await expect(
      generateProyeccionExcel(mockData, '2025-2', 'test-vacio')
    ).resolves.toBeUndefined();

    const { saveAs } = await import('file-saver');
    expect(saveAs).toHaveBeenCalledOnce();
  });

  it('debería manejar datos vacíos (nuclei array vacío)', async () => {
    const { generateProyeccionExcel } = await import('../unefaExcelReports');

    const mockData = {
      periodDescription: '2025-3',
      nuclei: [],
    };

    await expect(
      generateProyeccionExcel(mockData, '2025-3', 'test-vacio-total')
    ).resolves.toBeUndefined();
  });
});

describe('generateRelacionInstitucionesSolicitanExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // mock global fetch para addLogos (jsdom no tiene servidor); se ignora el resultado.
  const realFetch = global.fetch;
  beforeEach(() => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down (mock)')) as any;
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  async function generateAndLoad(rows: any[], period = '2026-1') {
    const { generateRelacionInstitucionesSolicitanExcel } = await import('../unefaExcelReports');
    await generateRelacionInstitucionesSolicitanExcel(rows, period, 'test-r-i');
    return loadGeneratedWorkbook();
  }

  it('usa el fill de encabezado más claro FF9CC3E5', async () => {
    const wb = await generateAndLoad([]);
    const ws = wb.getWorksheet('Relacion Instituciones');
    // Encabezado REGIÓN en la fila de hdrRow1 (10)
    const cell = ws.getCell(10, 1);
    const fill = (cell.style.fill as any)?.fgColor?.argb;
    expect(fill).toBe('FF9CC3E5');
  });

  it('título = string exacto del spec con ${period} sustituido', async () => {
    const wb = await generateAndLoad([]);
    const ws = wb.getWorksheet('Relacion Instituciones');
    const titleText = cellPlainText(ws.getCell(9, 1));
    expect(titleText).toBe(
      'RELACIÓN DE INSTITUCIONES QUE SOLICITAN ASIGNACIÓN DE PASANTES PARA EL PERÍODO 2026-1'
    );
  });

  it('form code en fila propia bajo el escudo (A7), no crammed en la última línea del membrete', async () => {
    const wb = await generateAndLoad([]);
    const ws = wb.getWorksheet('Relacion Instituciones');
    // Última línea del membrete (A6) NO debe contener el form code
    expect(cellPlainText(ws.getCell(6, 1))).not.toContain('form-002-2019');
    // Fila 7 (su propia fila) contiene el form code en col A, con fuente itálica size 7
    const v = ws.getCell(7, 1).value as any;
    const rich = Array.isArray(v?.richText) ? v.richText : [
      { text: typeof v === 'string' ? v : '', font: undefined as any },
    ];
    const formRun = rich.find((r: any) => (r.text || '').includes('form-002-2019'));
    expect(formRun).toBeTruthy();
    expect(formRun.font?.italic).toBe(true);
    expect(formRun.font?.size).toBe(7);
  });

  it('inserta una fila vacía entre el membrete y el título (fila 8)', async () => {
    const wb = await generateAndLoad([]);
    const ws = wb.getWorksheet('Relacion Instituciones');
    expect(ws.getCell(7, 1).value).toBeTruthy(); // form code
    expect(ws.getCell(8, 1).value).toBeNull(); // fila vacía de espaciado
    expect(cellPlainText(ws.getCell(9, 1))).toContain('RELACIÓN DE INSTITUCIONES QUE SOLICITAN');
  });

  it('responsable title-before-name y teléfono separado 0000 - 0000000', async () => {
    const rows = [
      {
        region: 'LOS LLANOS', nucleo: 'PORTUGUESA', extension: 'ACARIGUA',
        empresa: 'EMPRESA A', responsable: 'María Montero', responsableTitulo: 'Licenciada',
        numeroContacto: '0000 - 0000000', tipoEmpresa: 'Privada', carreras: 'Ingeniería',
        cantidadEstudiantes: 3,
      },
    ];
    const wb = await generateAndLoad(rows);
    const ws = wb.getWorksheet('Relacion Instituciones');
    // dataStart = 12 → primera fila de datos
    expect(cellPlainText(ws.getCell(12, 5)).toUpperCase()).toContain('LICENCIADA MARÍA MONTERO');
    expect(cellPlainText(ws.getCell(12, 6))).toBe('0000 - 0000000');
    expect(Number(cellPlainText(ws.getCell(12, 9)))).toBe(3);
  });

  it('emite una fila por institución×carrera×responsable con la cuota de cada responsable', async () => {
    // 1 institución × 2 carreras × 2 responsables = 4 filas, cada una con su cuota
    const rows = [
      { region: 'LOS LLANOS', nucleo: 'PORTUGUESA', extension: 'ACARIGUA', empresa: 'EMPRESA A', responsable: 'R1', responsableTitulo: '', numeroContacto: '0000', tipoEmpresa: 'Privada', carreras: 'Carrera 1', cantidadEstudiantes: 3 },
      { region: 'LOS LLANOS', nucleo: 'PORTUGUESA', extension: 'ACARIGUA', empresa: 'EMPRESA A', responsable: 'R1', responsableTitulo: '', numeroContacto: '0000', tipoEmpresa: 'Privada', carreras: 'Carrera 2', cantidadEstudiantes: 3 },
      { region: 'LOS LLANOS', nucleo: 'PORTUGUESA', extension: 'ACARIGUA', empresa: 'EMPRESA A', responsable: 'R2', responsableTitulo: '', numeroContacto: '0000', tipoEmpresa: 'Privada', carreras: 'Carrera 1', cantidadEstudiantes: 2 },
      { region: 'LOS LLANOS', nucleo: 'PORTUGUESA', extension: 'ACARIGUA', empresa: 'EMPRESA A', responsable: 'R2', responsableTitulo: '', numeroContacto: '0000', tipoEmpresa: 'Privada', carreras: 'Carrera 2', cantidadEstudiantes: 2 },
    ];
    const wb = await generateAndLoad(rows);
    const ws = wb.getWorksheet('Relacion Instituciones');
    expect(cellPlainText(ws.getCell(12, 9))).toBe('3');
    expect(cellPlainText(ws.getCell(13, 9))).toBe('3');
    expect(cellPlainText(ws.getCell(14, 9))).toBe('2');
    expect(cellPlainText(ws.getCell(15, 9))).toBe('2');
  });
});
