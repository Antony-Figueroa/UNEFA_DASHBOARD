/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionButton from "../ActionButton";

describe("ActionButton Consistency Tests", () => {
  const onClick = vi.fn();
  const MockIcon = ({ className }: { className?: string }) => (
    <svg data-testid="mock-icon" className={className} />
  );

  it("should render with correct tooltip and icon", () => {
    render(
      <ActionButton
        tooltip="Edit"
        onClick={onClick}
        icon={<MockIcon />}
      />
    );

    const button = screen.getByRole("button", { name: /edit/i });
    expect(button).toBeDefined();
    expect(screen.getByTestId("mock-icon")).toBeDefined();
  });

  it("should apply correct variant classes", () => {
    const { rerender } = render(
      <ActionButton
        tooltip="Edit"
        onClick={onClick}
        icon={<MockIcon />}
        variant="primary"
      />
    );

    let button = screen.getByRole("button");
    expect(button.className).toContain("text-brand-500");

    rerender(
      <ActionButton
        tooltip="Delete"
        onClick={onClick}
        icon={<MockIcon />}
        variant="danger"
      />
    );
    button = screen.getByRole("button");
    expect(button.className).toContain("text-error-500");

    rerender(
      <ActionButton
        tooltip="Save"
        onClick={onClick}
        icon={<MockIcon />}
        variant="success"
      />
    );
    button = screen.getByRole("button");
    expect(button.className).toContain("text-success-500");
  });

  it("should call onClick when clicked", () => {
    render(
      <ActionButton
        tooltip="Edit"
        onClick={onClick}
        icon={<MockIcon />}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <ActionButton
        tooltip="Edit"
        onClick={onClick}
        icon={<MockIcon />}
        disabled={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.className).toContain("disabled:opacity-50");
  });

  it("should inject w-5 h-5 classes into the icon", () => {
    render(
      <ActionButton
        tooltip="Edit"
        onClick={onClick}
        icon={<MockIcon />}
      />
    );

    const icon = screen.getByTestId("mock-icon");
    // Use getAttribute for SVG classes to avoid SVGAnimatedString issues
    const className = icon.getAttribute("class");
    expect(className).toContain("w-5");
    expect(className).toContain("h-5");
  });
});
