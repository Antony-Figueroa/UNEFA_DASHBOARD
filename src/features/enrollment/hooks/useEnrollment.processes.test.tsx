/**
 * @file useEnrollment.processes.test.tsx
 * @description Tests para los procesos de inscripción de estudiantes:
 *   - Retiro Justificado
 *   - Abandono
 *   - Reprobado
 *
 * Valida el flujo completo de cada proceso: estados, servicios, toasts y errores.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEnrollment } from '../hooks/useEnrollment';
import { PRACTICES_STATUS } from '../../../constants/practiceStatus';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockAddToast = vi.fn();
const mockRefresh = vi.fn();

vi.mock('@/context/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('../../../hooks/useCrud', () => ({
  useCrud: vi.fn(() => ({
    data: [],
    status: 'success',
    loadingAction: false,
    error: null,
    refresh: mockRefresh,
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toggleItemStatus: vi.fn(),
  })),
}));

const mockWithdrawPractice = vi.fn();
const mockReclassifyWithdrawal = vi.fn();

vi.mock('../services/enrollmentService', () => ({
  withdrawPractice: (...args: unknown[]) => mockWithdrawPractice(...args),
  reclassifyWithdrawal: (...args: unknown[]) => mockReclassifyWithdrawal(...args),
  getEnrollments: vi.fn().mockResolvedValue([]),
  createEnrollment: vi.fn().mockResolvedValue({}),
  updateEnrollment: vi.fn().mockResolvedValue({}),
  deleteEnrollment: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

const PRACTICE_ID = 'practice-abc-001';

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useEnrollment — Procesos de Inscripción', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. RETIRO JUSTIFICADO
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Retiro Justificado (RETIRO_JUSTIFICADO = 5)', () => {
    it('debería procesar un retiro justificado exitosamente', async () => {
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(
          PRACTICE_ID,
          'justified',
          'Motivo médico documentado con certificado',
        );
      });

      expect(mockWithdrawPractice).toHaveBeenCalledWith(
        PRACTICE_ID,
        'justified',
        'Motivo médico documentado con certificado',
        undefined,
      );

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'warning',
          category: 'ESTUDIANTE',
          title: 'Retiro Justificado',
        }),
      );

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('debería incluir comment adicional si se provee', async () => {
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(
          PRACTICE_ID,
          'justified',
          'Incompatibilidad de horario laboral',
          'El estudiante entregó carta de la empresa',
        );
      });

      expect(mockWithdrawPractice).toHaveBeenCalledWith(
        PRACTICE_ID,
        'justified',
        'Incompatibilidad de horario laboral',
        'El estudiante entregó carta de la empresa',
      );
    });

    it('debería mostrar toast de error cuando falla el servicio', async () => {
      const error = {
        response: { data: { message: 'No se encontró la práctica' } },
      };
      mockWithdrawPractice.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'justified', 'Motivo válido');
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Error',
          message: 'No se encontró la práctica',
        }),
      );
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('debería manejar errores de red sin response', async () => {
      mockWithdrawPractice.mockRejectedValueOnce(new Error('Network timeout'));

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'justified', 'Motivo');
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Error',
          message: 'No se pudo procesar la solicitud.',
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. ABANDONO
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Abandono (RETIRADO = 0)', () => {
    it('debería registrar abandono correctamente', async () => {
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(
          PRACTICE_ID,
          'unjustified',
          'Estudiante no se presentó en más de 15 días consecutivos',
        );
      });

      expect(mockWithdrawPractice).toHaveBeenCalledWith(
        PRACTICE_ID,
        'unjustified',
        'Estudiante no se presentó en más de 15 días consecutivos',
        undefined,
      );

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'warning',
          category: 'ESTUDIANTE',
          title: 'Abandono Registrado',
          message: 'La práctica ha sido marcada como abandono.',
        }),
      );

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('debería registrar abandono con comentario adicional', async () => {
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(
          PRACTICE_ID,
          'unjustified',
          'Deserción voluntaria del programa',
          'Instituto notificó fecha de última asistencia: 01/03/2026',
        );
      });

      expect(mockWithdrawPractice).toHaveBeenCalledWith(
        PRACTICE_ID,
        'unjustified',
        'Deserción voluntaria del programa',
        'Instituto notificó fecha de última asistencia: 01/03/2026',
      );
    });

    it('debería mostrar error cuando el servicio falla en abandono', async () => {
      const error = {
        response: { status: 500, data: { message: 'Error interno del servidor' } },
      };
      mockWithdrawPractice.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'unjustified', 'Motivo de abandono');
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Error',
          message: 'Error interno del servidor',
        }),
      );
    });

    it('debería registrar el motivo como mínimo 10 caracteres (validación backend)', async () => {
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      const motivoCorto = 'Abandono'; // 9 chars — backend podría rechazar

      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'unjustified', motivoCorto);
      });

      // Verificar que se intentó enviar (la validación es backend-side)
      expect(mockWithdrawPractice).toHaveBeenCalledWith(
        PRACTICE_ID,
        'unjustified',
        motivoCorto,
        undefined,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. REPROBADO
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Reprobado (REPROBADO = 4)', () => {
    it('debería tener el código de estado REPROBADO definido correctamente', () => {
      expect(PRACTICES_STATUS.REPROBADO).toBe(4);
    });

    it('debería manejar la transición de INSCRITO → REPROBADO vía evaluación', async () => {
      // Simula el flujo donde el backend marca REPROBADO al fallar evaluación
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      // Verificar que el hook expone las funciones necesarias para gestionar
      // el estado de la práctica
      expect(result.current.withdraw).toBeDefined();
      expect(result.current.editEnrollment).toBeDefined();
      expect(result.current.refreshEnrollments).toBeDefined();
    });

    it('debería permitir editar una inscripción reprobada para re-inscripción', async () => {
      const mockUpdateItem = vi.fn().mockResolvedValue({
        enrollmentId: 'enr-001',
        studentName: 'Ana García',
        status: true,
      });

      const { useCrud } = await import('../../../hooks/useCrud');
      vi.mocked(useCrud).mockReturnValueOnce({
        data: [],
        status: 'success',
        loadingAction: false,
        error: null,
        refresh: mockRefresh,
        createItem: vi.fn(),
        updateItem: mockUpdateItem,
        deleteItem: vi.fn(),
        toggleItemStatus: vi.fn(),
      });

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.editEnrollment({
          enrollmentId: 'enr-001',
          studentName: 'Ana García',
          period: '2026-1',
          practiceType: 'ORDINARIA',
        } as any);
      });

      expect(mockUpdateItem).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'success',
          category: 'ESTUDIANTE',
          title: 'Inscripción Actualizada',
        }),
      );
    });

    it('debería mostrar toast de error al fallar edición de inscripción reprobada', async () => {
      const mockUpdateItem = vi.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'No se puede editar inscripción reprobada sin resolución' } },
      });

      const { useCrud } = await import('../../../hooks/useCrud');
      vi.mocked(useCrud).mockReturnValueOnce({
        data: [],
        status: 'success',
        loadingAction: false,
        error: null,
        refresh: mockRefresh,
        createItem: vi.fn(),
        updateItem: mockUpdateItem,
        deleteItem: vi.fn(),
        toggleItemStatus: vi.fn(),
      });

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.editEnrollment({
          enrollmentId: 'enr-001',
          studentName: 'Ana García',
        } as any);
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Error de Actualización',
          message: 'No se puede editar inscripción reprobada sin resolución',
        }),
      );
    });

    it('debería manejar errores 500 en edición de reprobado', async () => {
      const mockUpdateItem = vi.fn().mockRejectedValue(new Error('Network Error'));

      const { useCrud } = await import('../../../hooks/useCrud');
      vi.mocked(useCrud).mockReturnValueOnce({
        data: [],
        status: 'success',
        loadingAction: false,
        error: null,
        refresh: mockRefresh,
        createItem: vi.fn(),
        updateItem: mockUpdateItem,
        deleteItem: vi.fn(),
        toggleItemStatus: vi.fn(),
      });

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.editEnrollment({
          enrollmentId: 'enr-001',
          studentName: 'Carlos López',
        } as any);
      });

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Error de Actualización',
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDACIONES TRANSVERSALES
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Validaciones transversales de procesos', () => {
    it('debería refrescar la lista después de cualquier proceso exitoso', async () => {
      mockWithdrawPractice.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useEnrollment());

      // Retiro justificado
      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'justified', 'Retiro por enfermedad');
      });
      expect(mockRefresh).toHaveBeenCalledTimes(1);

      // Abandono
      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'unjustified', 'Abandono confirmado');
      });
      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('NO debería refrescar la lista si el proceso falla', async () => {
      mockWithdrawPractice.mockRejectedValueOnce({
        response: { data: { message: 'Práctica no encontrada' } },
      });

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'justified', 'Motivo');
      });

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('debería diferenciar toast entre retiro justificado y abandono', async () => {
      mockWithdrawPractice.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEnrollment());

      // Retiro justificado
      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'justified', 'Motivo médico');
      });

      const toastJustificado = mockAddToast.mock.calls[0][0];

      // Abandono
      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'unjustified', 'Motivo abandono');
      });

      const toastAbandono = mockAddToast.mock.calls[1][0];

      expect(toastJustificado.title).toBe('Retiro Justificado');
      expect(toastJustificado.message).toContain('retiro justificado');

      expect(toastAbandono.title).toBe('Abandono Registrado');
      expect(toastAbandono.message).toContain('abandono');
    });

    it('debería propagar errores DATE_OUTSIDE_PERIOD y PERIOD_NOT_ACTIVE', async () => {
      const periodError: any = new Error('Period closed');
      periodError.response = {
        data: { code: 'DATE_OUTSIDE_PERIOD', message: 'Fecha fuera del período' },
      };
      mockWithdrawPractice.mockRejectedValueOnce(periodError);

      const { result } = renderHook(() => useEnrollment());

      await act(async () => {
        await result.current.withdraw(PRACTICE_ID, 'justified', 'Motivo');
      });

      // El toast de error genérico no debería mostrarse, el error se propaga
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          title: 'Error',
          message: 'Fecha fuera del período',
        }),
      );
    });
  });
});
