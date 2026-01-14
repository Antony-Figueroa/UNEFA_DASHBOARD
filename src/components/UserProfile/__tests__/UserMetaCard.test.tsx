/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import UserMetaCard from "../UserMetaCard";
import { ThemeProvider } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

// Mock hooks
vi.mock("../../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockUser = {
  id: 1,
  userCi: "12345678",
  name: "Juan",
  secondName: "Carlos",
  surname: "Perez",
  secondSurname: "Rodriguez",
  email: "juan@example.com",
  phoneNumber: "04121234567",
  role: 1
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe("UserMetaCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it("muestra la información básica del usuario", () => {
    renderWithProviders(<UserMetaCard />);

    expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();
    expect(screen.getByText(/juan@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: 12345678/i)).toBeInTheDocument();
    expect(screen.getByText(/Usuario Activo/i)).toBeInTheDocument();
  });

  it("no muestra el botón de edición (removido según requerimiento)", () => {
    renderWithProviders(<UserMetaCard />);
    
    const editBtn = screen.queryByRole("button", { name: /editar perfil/i });
    expect(editBtn).not.toBeInTheDocument();
  });
});
