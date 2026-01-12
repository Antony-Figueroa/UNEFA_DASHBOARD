import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useUnsavedChanges } from "../useUnsavedChanges";

describe("useUnsavedChanges", () => {
  it("should not show confirmation and call onClose if form is not dirty", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useUnsavedChanges(false, onClose));

    act(() => {
      result.current.handleCloseAttempt();
    });

    expect(result.current.showConfirmation).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show confirmation and not call onClose if form is dirty", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useUnsavedChanges(true, onClose));

    act(() => {
      result.current.handleCloseAttempt();
    });

    expect(result.current.showConfirmation).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should close and hide confirmation when confirmClose is called", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useUnsavedChanges(true, onClose));

    // Abrir confirmación
    act(() => {
      result.current.handleCloseAttempt();
    });

    expect(result.current.showConfirmation).toBe(true);

    // Confirmar cierre
    act(() => {
      result.current.confirmClose();
    });

    expect(result.current.showConfirmation).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should hide confirmation and not call onClose when cancelClose is called", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useUnsavedChanges(true, onClose));

    // Abrir confirmación
    act(() => {
      result.current.handleCloseAttempt();
    });

    expect(result.current.showConfirmation).toBe(true);

    // Cancelar cierre
    act(() => {
      result.current.cancelClose();
    });

    expect(result.current.showConfirmation).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });
});
