/* @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Alert from "../Alert";
import { CATEGORY_COLORS } from "../../../../constants/designSystem";

describe("Alert Category Styling", () => {
  it("applies correct student category classes", () => {
    const { container } = render(
      <Alert
        category="ESTUDIANTE"
        title="Test Student Alert"
        message="Testing student category styling"
      />
    );

    const alertContainer = container.firstChild as HTMLElement;
    
    // Check for student-specific classes defined in designSystem.ts
    const expectedClasses = [
      CATEGORY_COLORS.ESTUDIANTE.border,
      CATEGORY_COLORS.ESTUDIANTE.bg,
      "dark:border-[#3498db]/30",
      "dark:bg-[#3498db]/20"
    ];

    expectedClasses.forEach(cls => {
      expect(alertContainer.className).toContain(cls);
    });

    // Check for student icon color
    const iconContainer = alertContainer.querySelector('svg');
    expect(iconContainer?.parentElement?.className).toContain(CATEGORY_COLORS.ESTUDIANTE.text);
  });

  it("falls back to variant classes when no category is provided", () => {
    const { container } = render(
      <Alert
        variant="success"
        title="Success Alert"
      />
    );

    const alertContainer = container.firstChild as HTMLElement;
    expect(alertContainer.className).toContain("border-success-500");
    expect(alertContainer.className).toContain("bg-success-50");
  });
});
