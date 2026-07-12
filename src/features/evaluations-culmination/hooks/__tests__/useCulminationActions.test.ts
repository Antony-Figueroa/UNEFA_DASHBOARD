/**
 * @file useCulminationActions.test.ts
 * @description TDD tests for useCulminationActions — wraps service calls
 * with loading states and toast notifications for culmination actions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useCulminationActions } from '../useCulminationActions';

// --- Mocks ---

const {
  mockApproveCulmination,
  mockGenerateCertificate,
  mockReverseFailed,
  mockBulkGrantExtension,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockApproveCulmination: vi.fn(),
  mockGenerateCertificate: vi.fn(),
  mockReverseFailed: vi.fn(),
  mockBulkGrantExtension: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('../../services/evaluationsCulminationService', () => ({
  evaluationsCulminationService: {
    approveCulmination: mockApproveCulmination,
    generateCertificate: mockGenerateCertificate,
    reverseFailed: mockReverseFailed,
  },
}));

vi.mock('../../../evaluations/services/evaluationService', () => ({
  evaluationService: {
    bulkGrantExtension: mockBulkGrantExtension,
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mockToastSuccess,
    error: mockToastError,
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('useCulminationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveCulmination.mockResolvedValue({ success: true, message: 'Culminación aprobada' });
    mockGenerateCertificate.mockResolvedValue({ success: true, message: 'Certificado generado', certificate: { number: 'CERT-001' } });
    mockReverseFailed.mockResolvedValue({ success: true, message: 'Reversión exitosa' });
    mockBulkGrantExtension.mockResolvedValue({ grantedCount: 2 });
  });

  // ─── Initial State ─────────────────────────────────────────

  it('returns all loading states as false and error as null initially', () => {
    const { result } = renderHook(() => useCulminationActions());

    expect(result.current.approving).toBe(false);
    expect(result.current.certifying).toBe(false);
    expect(result.current.reversing).toBe(false);
    expect(result.current.bulkExtending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns all action functions', () => {
    const { result } = renderHook(() => useCulminationActions());

    expect(typeof result.current.approveCulmination).toBe('function');
    expect(typeof result.current.certifyPractice).toBe('function');
    expect(typeof result.current.reverseCulmination).toBe('function');
    expect(typeof result.current.bulkExtend).toBe('function');
  });

  // ─── approveCulmination ───────────────────────────────────

  it('approveCulmination calls service with correct practiceId', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.approveCulmination(42);
    });

    expect(mockApproveCulmination).toHaveBeenCalledWith(42);
  });

  it('approveCulmentation sets approving=true during call', async () => {
    let resolvePromise: (value: any) => void;
    mockApproveCulmination.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useCulminationActions());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.approveCulmination(42);
    });

    // During the call, approving should be true
    expect(result.current.approving).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ success: true });
      await promise;
    });

    expect(result.current.approving).toBe(false);
  });

  it('approveCulmination shows toast.success on success', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.approveCulmination(42);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Culminación aprobada');
  });

  it('approveCulmination calls onSuccess callback after success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCulminationActions(onSuccess));

    await act(async () => {
      await result.current.approveCulmination(42);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('approveCulmination shows toast.error on failure', async () => {
    mockApproveCulmination.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.approveCulmination(42);
    });

    expect(mockToastError).toHaveBeenCalled();
    expect(result.current.error).toBe('Network error');
  });

  it('approveCulmination does not call onSuccess on failure', async () => {
    const onSuccess = vi.fn();
    mockApproveCulmination.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useCulminationActions(onSuccess));

    await act(async () => {
      await result.current.approveCulmination(42);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  // ─── certifyPractice ──────────────────────────────────────

  it('certifyPractice calls service with correct practiceId', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.certifyPractice(42);
    });

    expect(mockGenerateCertificate).toHaveBeenCalledWith(42);
  });

  it('certifyPractice sets certifying=true during call', async () => {
    let resolvePromise: (value: any) => void;
    mockGenerateCertificate.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useCulminationActions());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.certifyPractice(42);
    });

    expect(result.current.certifying).toBe(true);

    await act(async () => {
      resolvePromise!({ success: true });
      await promise;
    });

    expect(result.current.certifying).toBe(false);
  });

  it('certifyPractice shows toast.success on success', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.certifyPractice(42);
    });

    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('certifyPractice calls onSuccess callback after success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCulminationActions(onSuccess));

    await act(async () => {
      await result.current.certifyPractice(42);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('certifyPractice shows toast.error on failure', async () => {
    mockGenerateCertificate.mockRejectedValueOnce(new Error('Cert error'));
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.certifyPractice(42);
    });

    expect(mockToastError).toHaveBeenCalled();
    expect(result.current.error).toBe('Cert error');
  });

  // ─── reverseCulmination ───────────────────────────────────

  it('reverseCulmination calls service with reason and resolution number', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.reverseCulmination(42, 'Error administrativo', 'RES-2026-010');
    });

    expect(mockReverseFailed).toHaveBeenCalledWith(42, 'Error administrativo', 'RES-2026-010');
  });

  it('reverseCulmination sets reversing=true during call', async () => {
    let resolvePromise: (value: any) => void;
    mockReverseFailed.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useCulminationActions());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.reverseCulmination(42, 'reason', 'RES-001');
    });

    expect(result.current.reversing).toBe(true);

    await act(async () => {
      resolvePromise!({ success: true });
      await promise;
    });

    expect(result.current.reversing).toBe(false);
  });

  it('reverseCulmination shows toast.success on success', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.reverseCulmination(42, 'reason', 'RES-001');
    });

    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('reverseCulmination calls onSuccess callback after success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCulminationActions(onSuccess));

    await act(async () => {
      await result.current.reverseCulmination(42, 'reason', 'RES-001');
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('reverseCulmination shows toast.error on failure', async () => {
    mockReverseFailed.mockRejectedValueOnce(new Error('Reverse error'));
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.reverseCulmination(42, 'reason', 'RES-001');
    });

    expect(mockToastError).toHaveBeenCalled();
    expect(result.current.error).toBe('Reverse error');
  });

  // ─── bulkExtend ───────────────────────────────────────────

  it('bulkExtend calls service with practiceIds and days', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.bulkExtend([1, 2, 3], 15);
    });

    expect(mockBulkGrantExtension).toHaveBeenCalledWith({
      practiceIds: [1, 2, 3],
      reason: expect.stringContaining('15'),
    });
  });

  it('bulkExtend sets bulkExtending=true during call', async () => {
    let resolvePromise: (value: any) => void;
    mockBulkGrantExtension.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useCulminationActions());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.bulkExtend([1, 2], 10);
    });

    expect(result.current.bulkExtending).toBe(true);

    await act(async () => {
      resolvePromise!({ grantedCount: 2 });
      await promise;
    });

    expect(result.current.bulkExtending).toBe(false);
  });

  it('bulkExtend shows toast.success on success', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.bulkExtend([1, 2], 15);
    });

    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('bulkExtend calls onSuccess callback after success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCulminationActions(onSuccess));

    await act(async () => {
      await result.current.bulkExtend([1, 2], 15);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('bulkExtend shows toast.error on failure', async () => {
    mockBulkGrantExtension.mockRejectedValueOnce(new Error('Bulk error'));
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.bulkExtend([1, 2], 15);
    });

    expect(mockToastError).toHaveBeenCalled();
    expect(result.current.error).toBe('Bulk error');
  });

  // ─── Error State ──────────────────────────────────────────

  it('error state is set on any action failure', async () => {
    const { result } = renderHook(() => useCulminationActions());

    // First action fails
    mockApproveCulmination.mockRejectedValueOnce(new Error('Error 1'));
    await act(async () => {
      await result.current.approveCulmination(1);
    });
    expect(result.current.error).toBe('Error 1');

    // Second action succeeds — error should be cleared
    mockApproveCulmination.mockResolvedValueOnce({ success: true });
    await act(async () => {
      await result.current.approveCulmination(2);
    });
    expect(result.current.error).toBeNull();
  });

  it('returns false from action on failure', async () => {
    mockApproveCulmination.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useCulminationActions());

    let returnValue: boolean = true;
    await act(async () => {
      returnValue = await result.current.approveCulmination(1);
    });

    expect(returnValue).toBe(false);
  });

  it('returns true from action on success', async () => {
    const { result } = renderHook(() => useCulminationActions());

    let returnValue: boolean = false;
    await act(async () => {
      returnValue = await result.current.approveCulmination(1);
    });

    expect(returnValue).toBe(true);
  });

  // ─── No onSuccess provided ────────────────────────────────

  it('works without onSuccess callback', async () => {
    const { result } = renderHook(() => useCulminationActions());

    await act(async () => {
      await result.current.approveCulmination(1);
    });

    expect(mockToastSuccess).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
