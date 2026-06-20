/**
 * @file reportsService.test.ts
 * @description Tests para reportsService — exportReportExcel con tutorId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../api/apiClient';

vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('reportsService — exportReportExcel (Task 4.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería enviar tutorId en la URL cuando se proporciona', async () => {
    const { reportsService } = await import('../reportsService');
    mockApiClient.get.mockResolvedValue({ data: new Blob() });

    await reportsService.exportReportExcel('relacion-individual-docente', 1, undefined, undefined, 42);

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    const calledUrl = decodeURIComponent(mockApiClient.get.mock.calls[0][0]);
    expect(calledUrl).toContain('tutorId=42');
    expect(calledUrl).toContain('/reports/export/relacion-individual-docente');
  });

  it('debería enviar tutorId junto con periodId y careerIds', async () => {
    const { reportsService } = await import('../reportsService');
    mockApiClient.get.mockResolvedValue({ data: new Blob() });

    await reportsService.exportReportExcel('distribucion-tutores', 5, undefined, [1, 2], 99);

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    const calledUrl = decodeURIComponent(mockApiClient.get.mock.calls[0][0]);
    expect(calledUrl).toContain('periodId=5');
    expect(calledUrl).toContain('careerIds=1,2');
    expect(calledUrl).toContain('tutorId=99');
  });

  it('debería NO incluir tutorId cuando no se proporciona', async () => {
    const { reportsService } = await import('../reportsService');
    mockApiClient.get.mockResolvedValue({ data: new Blob() });

    await reportsService.exportReportExcel('tutores-academicos', 1);

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    const calledUrl = mockApiClient.get.mock.calls[0][0];
    expect(calledUrl).not.toContain('tutorId');
  });

  it('debería retornar un Blob con responseType blob', async () => {
    const { reportsService } = await import('../reportsService');
    const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    mockApiClient.get.mockResolvedValue({ data: mockBlob });

    const result = await reportsService.exportReportExcel('tutores-academicos', 1);

    expect(result).toBeInstanceOf(Blob);
    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/reports/export/tutores-academicos'),
      expect.objectContaining({ responseType: 'blob' })
    );
  });
});
