/**
 * @file useCulminationUI.test.ts
 * @description Tests for useCulminationUI — pure UI state management hook
 * for culmination tab (row expansion, tabs, modals).
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCulminationUI } from '../useCulminationUI';

describe('useCulminationUI', () => {
  it('returns default values (no expanded row, default tab, no modal)', () => {
    const { result } = renderHook(() => useCulminationUI());

    expect(result.current.expandedStudentCi).toBeNull();
    expect(result.current.activeTab).toBe('evaluations');
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.modalType).toBeNull();
    expect(result.current.selectedPracticeId).toBeNull();
  });

  it('toggleRow expands a row when collapsed', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.toggleRow('V-12345678');
    });

    expect(result.current.expandedStudentCi).toBe('V-12345678');
  });

  it('toggleRow collapses already-expanded row', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.toggleRow('V-12345678');
    });
    expect(result.current.expandedStudentCi).toBe('V-12345678');

    act(() => {
      result.current.toggleRow('V-12345678');
    });
    expect(result.current.expandedStudentCi).toBeNull();
  });

  it('toggleRow switches to different row when another is expanded', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.toggleRow('V-11111111');
    });
    expect(result.current.expandedStudentCi).toBe('V-11111111');

    act(() => {
      result.current.toggleRow('V-22222222');
    });
    expect(result.current.expandedStudentCi).toBe('V-22222222');
  });

  it('setActiveTab changes tab', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.setActiveTab('culmination');
    });

    expect(result.current.activeTab).toBe('culmination');
  });

  it('setActiveTab can switch between all tabs', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => { result.current.setActiveTab('evaluations'); });
    expect(result.current.activeTab).toBe('evaluations');

    act(() => { result.current.setActiveTab('culmination'); });
    expect(result.current.activeTab).toBe('culmination');

    act(() => { result.current.setActiveTab('certification'); });
    expect(result.current.activeTab).toBe('certification');
  });

  it('openModal sets modalType without practiceId when not provided', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.openModal('confirm');
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.modalType).toBe('confirm');
    expect(result.current.selectedPracticeId).toBeNull();
  });

  it('openModal sets modalType and practiceId when provided', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.openModal('evaluation', 42);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.modalType).toBe('evaluation');
    expect(result.current.selectedPracticeId).toBe(42);
  });

  it('closeModal clears modal state', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.openModal('evaluation', 42);
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.modalType).toBeNull();
    expect(result.current.selectedPracticeId).toBeNull();
  });

  it('closeModal is safe to call when no modal is open', () => {
    const { result } = renderHook(() => useCulminationUI());

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.modalType).toBeNull();
    expect(result.current.selectedPracticeId).toBeNull();
  });
});
