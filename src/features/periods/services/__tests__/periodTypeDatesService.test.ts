/**
 * @file periodTypeDatesService.test.ts
 * @description Tests para el servicio de fechas por tipo de pasantía.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../api/apiClient';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

describe('periodTypeDatesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByPeriod', () => {
    it('debería obtener fechas por periodo', async () => {
      const { getByPeriod } = await import('../periodTypeDatesService');
      const mockResponse = {
        data: [
          { id: 1, periodId: 42, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' },
        ],
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getByPeriod(42);

      expect(mockGet).toHaveBeenCalledWith('/period-type-dates?periodId=42');
      expect(result).toHaveLength(1);
      expect(result[0].periodId).toBe(42);
      expect(result[0].internshipTypeId).toBe(1);
    });

    it('debería retornar array vacío cuando no hay fechas', async () => {
      const { getByPeriod } = await import('../periodTypeDatesService');
      mockGet.mockResolvedValue({ data: [] });

      const result = await getByPeriod(99);

      expect(result).toEqual([]);
    });
  });

  describe('upsert', () => {
    it('debería crear/actualizar fechas para un tipo', async () => {
      const { upsert } = await import('../periodTypeDatesService');
      const payload = { periodId: 42, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' };
      const mockResponse = { data: { id: 1, ...payload } };
      mockPost.mockResolvedValue(mockResponse);

      const result = await upsert(payload);

      expect(mockPost).toHaveBeenCalledWith('/period-type-dates', payload);
      expect(result.id).toBe(1);
    });

    it('debería permitir fechas nulas', async () => {
      const { upsert } = await import('../periodTypeDatesService');
      const payload = { periodId: 42, internshipTypeId: 2, startDate: null, endDate: null };
      mockPost.mockResolvedValue({ data: { id: 2, ...payload } });

      const result = await upsert(payload);

      expect(mockPost).toHaveBeenCalledWith('/period-type-dates', payload);
      expect(result.startDate).toBeNull();
    });
  });

  describe('remove', () => {
    it('debería eliminar un registro por ID', async () => {
      const { remove } = await import('../periodTypeDatesService');
      mockDelete.mockResolvedValue({});

      await remove(5);

      expect(mockDelete).toHaveBeenCalledWith('/period-type-dates/5');
    });
  });

  describe('getByPeriodAndType', () => {
    it('debería obtener fechas por periodo y tipo', async () => {
      const { getByPeriodAndType } = await import('../periodTypeDatesService');
      const mockRecord = { id: 1, periodId: 42, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' };
      mockGet.mockResolvedValue({ data: mockRecord });

      const result = await getByPeriodAndType(42, 1);

      expect(mockGet).toHaveBeenCalledWith('/period-type-dates?periodId=42&internshipTypeId=1');
      expect(result?.internshipTypeId).toBe(1);
    });

    it('debería retornar null cuando no existe', async () => {
      const { getByPeriodAndType } = await import('../periodTypeDatesService');
      mockGet.mockResolvedValue({ data: null });

      const result = await getByPeriodAndType(42, 999);

      expect(result).toBeNull();
    });
  });
});
