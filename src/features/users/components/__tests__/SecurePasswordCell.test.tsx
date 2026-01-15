import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SecurePasswordCell from "../SecurePasswordCell";

// Mock del contexto de toast
vi.mock("../../../../context/toast", async () => {
  const actual = await vi.importActual("../../../../context/toast");
  return {
    ...actual,
    useToast: () => ({
      addToast: vi.fn(),
    }),
  };
});

// Mock de clipboard
const mockClipboard = {
  writeText: vi.fn().mockImplementation(() => Promise.resolve()),
};
Object.defineProperty(navigator, "clipboard", {
  value: mockClipboard,
  writable: true,
});

describe("SecurePasswordCell", () => {
  const mockOnReveal = vi.fn();
  const mockOnHide = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe mostrar puntos cuando no está revelado", () => {
    render(
      <SecurePasswordCell
        password="secretpassword"
        isRevealed={false}
        onReveal={mockOnReveal}
        onHide={mockOnHide}
      />
    );

    expect(screen.getByText("••••••••")).toBeDefined();
    expect(screen.queryByText("secretpassword")).toBeNull();
  });

  it("debe mostrar la contraseña cuando está revelado", () => {
    render(
      <SecurePasswordCell
        password="secretpassword"
        isRevealed={true}
        onReveal={mockOnReveal}
        onHide={mockOnHide}
      />
    );

    expect(screen.getByText("secretpassword")).toBeDefined();
    expect(screen.queryByText("••••••••")).toBeNull();
  });

  it("debe llamar a onReveal al hacer clic en el ojo si no está revelado", () => {
    render(
      <SecurePasswordCell
        password="secretpassword"
        isRevealed={false}
        onReveal={mockOnReveal}
        onHide={mockOnHide}
      />
    );

    const toggleButton = screen.getByLabelText("Mostrar contraseña");
    fireEvent.click(toggleButton);

    expect(mockOnReveal).toHaveBeenCalledTimes(1);
  });

  it("debe llamar a onHide al hacer clic en el ojo si está revelado", () => {
    render(
      <SecurePasswordCell
        password="secretpassword"
        isRevealed={true}
        onReveal={mockOnReveal}
        onHide={mockOnHide}
      />
    );

    const toggleButton = screen.getByLabelText("Ocultar contraseña");
    fireEvent.click(toggleButton);

    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it("debe copiar al portapapeles cuando se hace clic en el icono de copia", async () => {
    render(
      <SecurePasswordCell
        password="secretpassword"
        isRevealed={true}
        onReveal={mockOnReveal}
        onHide={mockOnHide}
      />
    );

    const copyButton = screen.getByLabelText("Copiar al portapapeles");
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith("secretpassword");
  });

  it("el botón de copia debe estar deshabilitado si no está revelado", () => {
    render(
      <SecurePasswordCell
        password="secretpassword"
        isRevealed={false}
        onReveal={mockOnReveal}
        onHide={mockOnHide}
      />
    );

    const copyButton = screen.getByLabelText("Copiar al portapapeles");
    expect(copyButton.hasAttribute("disabled")).toBe(true);
  });
});
