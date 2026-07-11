/**
 * @file justifiedWithdrawalService.test.ts
 * @description Tests para justifiedWithdrawalService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../api/apiClient';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: mockGet,
    post: mockPost,
  },
}));

describe('justifiedWithdrawalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingWithdrawals', () => {
    it('debería retornar la lista de retiros pendientes', async () => {
      const { getPendingWithdrawals } = await import('../justifiedWithdrawalService');
      const mockData = [
        {
          practiceId: 1,
          studentName: 'Juan Pérez',
          studentCi: 'V-12345678',
          practiceType: 'HOSP',
          period: '1-2026',
          retiroDate: '2026-03-15',
          originalEndDate: '2026-05-08',
          startDate: '2026-01-15',
          observation: 'Retiro justificado',
        },
      ];
      mockGet.mockResolvedValue({ data: { success: true, data: mockData } });

      const result = await getPendingWithdrawals();

      expect(mockGet).toHaveBeenCalledWith('/justified-withdrawal/pending');
      expect(result).toEqual(mockData);
    });

    it('debería propagar errores de API', async () => {
      const { getPendingWithdrawals } = await import('../justifiedWithdrawalService');
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(getPendingWithdrawals()).rejects.toThrow();
    });
  });

  describe('extendWithdrawal', () => {
    it('debería extender un retiro justificado', async () => {
      const { extendWithdrawal } = await import('../justifiedWithdrawalService');
      mockPost.mockResolvedValue({ data: { success: true } });

      await extendWithdrawal(1, '2026-06-01', 'Extensión por recuperación médica');

      expect(mockPost).toHaveBeenCalledWith('/justified-withdrawal/1/extend', {
        newEndDate: '2026-06-01',
        reason: 'Extensión por recuperación médica',
      });
    });
  });

  describe('reprobarWithdrawal', () => {
    it('debería reprobar un retiro justificado', async () => {
      const { reprobarWithdrawal } = await import('../justifiedWithdrawalService');
      mockPost.mockResolvedValue({ data: { success: true } });

      await reprobarWithdrawal(1, 'Abandono del programa');

      expect(mockPost).toHaveBeenCalledWith('/justified-withdrawal/1/reprobar', {
        reason: 'Abandono del programa',
      });
    });
  });

  describe('batchWithdrawalAction', () => {
    it('debería enviar acción en lote y retornar resultados', async () => {
      const { batchWithdrawalAction } = await import('../justifiedWithdrawalService');
      const mockResult = {
        total: 2,
        successes: 2,
        failures: 0,
        details: [
          { practiceId: 1, success: true },
          { practiceId: 2, success: true },
        ],
      };
      mockPost.mockResolvedValue({ data: { success: true, data: mockResult } });

      const result = await batchWithdrawalAction({
        ids: [1, 2],
        action: 'reprobar',
        reason: 'Abandono masivo',
      });

      expect(mockPost).toHaveBeenCalledWith('/justified-withdrawal/batch', {
        ids: [1, 2],
        action: 'reprobar',
        reason: 'Abandono masivo',
      });
      expect(result).toEqual(mockResult);
    });
  });
});
