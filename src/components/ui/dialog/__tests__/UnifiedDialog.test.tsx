/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UnifiedDialog from "../UnifiedDialog";
import { DIALOG_COLORS, STANDARD_TEXTS } from "../DialogConfig";

describe("UnifiedDialog Consistency Tests", () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  it("should use correct colors for success variant", () => {
    render(
      <UnifiedDialog
        isOpen={true}
        onClose={onClose}
        variant="success"
        title="Success"
        message="Operation successful"
      />
    );

    const iconContainer = document.querySelector(".rounded-full");
    expect(iconContainer?.className).toContain(DIALOG_COLORS.success.bg);
    
    const confirmButton = screen.getByRole("button", { name: /entendido/i });
    expect(confirmButton.className).toContain(DIALOG_COLORS.success.button);
  });

  it("should use correct colors for error variant", () => {
    render(
      <UnifiedDialog
        isOpen={true}
        onClose={onClose}
        variant="error"
        title="Error"
        message="Operation failed"
      />
    );

    const iconContainer = document.querySelector(".rounded-full");
    expect(iconContainer?.className).toContain(DIALOG_COLORS.error.bg);
    
    const confirmButton = screen.getByRole("button", { name: /entendido/i });
    expect(confirmButton.className).toContain(DIALOG_COLORS.error.button);
  });

  it("should match standard texts for delete confirmation", () => {
    render(
      <UnifiedDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        variant="warning"
        {...STANDARD_TEXTS.CONFIRM_DELETE}
      />
    );

    expect(screen.getByText(STANDARD_TEXTS.CONFIRM_DELETE.title)).toBeDefined();
    expect(screen.getByText(STANDARD_TEXTS.CONFIRM_DELETE.message)).toBeDefined();
    expect(screen.getByText(STANDARD_TEXTS.CONFIRM_DELETE.confirmLabel)).toBeDefined();
  });

  it("should match standard texts for restore confirmation", () => {
    render(
      <UnifiedDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        variant="success"
        {...STANDARD_TEXTS.CONFIRM_RESTORE}
      />
    );

    expect(screen.getByText(STANDARD_TEXTS.CONFIRM_RESTORE.title)).toBeDefined();
    expect(screen.getByText(STANDARD_TEXTS.CONFIRM_RESTORE.message)).toBeDefined();
    expect(screen.getByText(STANDARD_TEXTS.CONFIRM_RESTORE.confirmLabel)).toBeDefined();
  });

  it("should call onConfirm when action button is clicked", () => {
    render(
      <UnifiedDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        variant="confirm"
        title="Confirm"
        message="Are you sure?"
        confirmLabel="Yes"
      />
    );

    const confirmButton = screen.getByRole("button", { name: /yes/i });
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", () => {
    render(
      <UnifiedDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        variant="confirm"
        title="Confirm"
        message="Are you sure?"
        cancelLabel="No"
      />
    );

    const cancelButton = screen.getByRole("button", { name: /no/i });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });
});
