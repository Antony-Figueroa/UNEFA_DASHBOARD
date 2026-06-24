/**
 * @file unefaExcelReports.test.ts
 * @description Tests para generateProyeccionExcel — verifica que genera el Excel sin errores
 *   con datos mock realistas, incluyendo múltiples núcleos y carreras cortas/largas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock file-saver antes de importar el módulo
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

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
