import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CustomSelect from "../CustomSelect";

describe("CustomSelect", () => {
  const options = [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
    { value: "P", label: "P", disabled: true, disabledReason: "Disabled reason" },
  ];

  it("renders with placeholder when no value is selected", () => {
    render(<CustomSelect options={options} onChange={() => {}} placeholder="Select option" />);
    expect(screen.getByText("Select option")).toBeDefined();
  });

  it("renders the selected value label", () => {
    render(<CustomSelect options={options} onChange={() => {}} value="V" />);
    expect(screen.getByText("V")).toBeDefined();
  });

  it("opens the dropdown when clicked", () => {
    render(<CustomSelect options={options} onChange={() => {}} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getByText("V")).toBeDefined();
    expect(screen.getByText("E")).toBeDefined();
    expect(screen.getByText("P")).toBeDefined();
  });

  it("calls onChange when an active option is clicked", () => {
    const onChange = vi.fn();
    render(<CustomSelect options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("E"));
    expect(onChange).toHaveBeenCalledWith("E");
  });

  it("does NOT call onChange when a disabled option is clicked", () => {
    const onChange = vi.fn();
    render(<CustomSelect options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("P"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies specific styles to disabled options", () => {
    render(<CustomSelect options={options} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    const disabledOption = screen.getByText("P");
    
    // Check for styles (using computed styles or classes)
    // In Tailwind, we can check for classes or specific hex colors if applied via style
    expect(disabledOption.className).toContain("cursor-not-allowed");
    expect(disabledOption.className).toContain("bg-[#f5f5f5]");
    expect(disabledOption.className).toContain("text-[#808080]");
    expect(disabledOption.className).toContain("opacity-50");
    expect(disabledOption.className).toContain("line-through");
  });

  it("has correct accessibility attributes when disabled", () => {
    render(<CustomSelect options={options} onChange={() => {}} disabled={true} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("has correct aria-disabled on individual options", () => {
    render(<CustomSelect options={options} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    const disabledOption = screen.getByText("P");
    expect(disabledOption.getAttribute("aria-disabled")).toBe("true");
  });
});
