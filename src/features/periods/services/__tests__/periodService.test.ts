/**
 * @file periodService.test.ts
 * @description Tests para periodService — mapeo de typeDates desde API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../api/apiClient';

const mockGet = vi.fn();
vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: mockGet,
  },
}));

describe('periodService — typeDates mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('debería mapear typeDates desde la respuesta de getPeriods', async () => {
    const { getPeriods } = await import('../periodService');
    const mockApiResponse = {
      data: [
        {
          PERIOD_ID: '1',
          DESCRIPTION: '1-2026',
          START_DATE: 1767225600,
          END_DATE: 1782950400,
          PERIOD_STATUS: 1,
          STATUS: 1,
          T_INTERNSHIPS_CODE: '1-2026',
          typeDates: [
            { id: 1, periodId: 1, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' },
          ],
        },
      ],
    };
    mockGet.mockResolvedValue(mockApiResponse);

    const periods = await getPeriods();
    expect(periods).toHaveLength(1);
    expect(periods[0].typeDates).toBeDefined();
    expect(periods[0].typeDates).toHaveLength(1);
    expect(periods[0].typeDates![0].internshipTypeId).toBe(1);
    expect(periods[0].typeDates![0].startDate).toBe('2026-03-16');
  });

  it('debería mapear typeDates vacío cuando no hay typeDates en API', async () => {
    const { getPeriods } = await import('../periodService');
    const mockApiResponse = {
      data: [
        {
          PERIOD_ID: '2',
          DESCRIPTION: '2-2025',
          START_DATE: 1722470400,
          END_DATE: 1738195200,
          PERIOD_STATUS: 3,
          STATUS: 1,
          T_INTERNSHIPS_CODE: '2-2025',
        },
      ],
    };
    mockGet.mockResolvedValue(mockApiResponse);

    const periods = await getPeriods();
    expect(periods).toHaveLength(1);
    expect(periods[0].typeDates).toBeUndefined();
  });

  it('debería mapear typeDates con múltiples registros', async () => {
    const { getPeriods } = await import('../periodService');
    const mockApiResponse = {
      data: [
        {
          PERIOD_ID: '3',
          DESCRIPTION: '1-2026',
          START_DATE: 1767225600,
          END_DATE: 1782950400,
          PERIOD_STATUS: 1,
          STATUS: 1,
          T_INTERNSHIPS_CODE: '1-2026',
          typeDates: [
            { id: 1, periodId: 3, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' },
            { id: 2, periodId: 3, internshipTypeId: 2, startDate: '2026-05-01', endDate: '2026-07-03' },
          ],
        },
      ],
    };
    mockGet.mockResolvedValue(mockApiResponse);

    const periods = await getPeriods();
    expect(periods[0].typeDates).toHaveLength(2);
    expect(periods[0].typeDates![1].internshipTypeId).toBe(2);
  });

  it('debería mapear typeDates con campos nulos', async () => {
    const { getPeriods } = await import('../periodService');
    const mockApiResponse = {
      data: [
        {
          PERIOD_ID: '4',
          DESCRIPTION: '1-2026',
          START_DATE: 1767225600,
          END_DATE: 1782950400,
          PERIOD_STATUS: 1,
          STATUS: 1,
          T_INTERNSHIPS_CODE: '1-2026',
          typeDates: [
            { id: 3, periodId: 4, internshipTypeId: 3, startDate: null, endDate: null },
          ],
        },
      ],
    };
    mockGet.mockResolvedValue(mockApiResponse);

    const periods = await getPeriods();
    expect(periods[0].typeDates![0].startDate).toBeNull();
    expect(periods[0].typeDates![0].endDate).toBeNull();
  });
});
