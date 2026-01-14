/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserMetaCard from "../UserMetaCard";
import { ThemeProvider } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { SidebarProvider } from "../../../context/SidebarContext";
import { ToastProvider } from "../../../context/ToastContext";

// Mock hooks
vi.mock("../../../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock services
vi.mock("../../../features/auth/services/authService", () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
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
      <SidebarProvider>
        <ToastProvider>
          {ui}
        </ToastProvider>
      </SidebarProvider>
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

  it("muestra el botón de edición y abre el modal al hacer clic", () => {
    renderWithProviders(<UserMetaCard />);
    
    const editBtn = screen.getByRole("button", { name: /editar perfil/i });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);

    expect(screen.getByText(/Actualizar Perfil/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Primer Nombre/i)).toHaveValue("Juan");
    expect(screen.getByLabelText(/Primer Apellido/i)).toHaveValue("Perez");
  });

  it("muestra diálogo de confirmación al intentar cerrar con cambios", () => {
    renderWithProviders(<UserMetaCard />);
    
    // Abrir modal
    fireEvent.click(screen.getByRole("button", { name: /editar perfil/i }));

    // Realizar un cambio
    const nameInput = screen.getByLabelText(/Primer Nombre/i);
    fireEvent.change(nameInput, { target: { value: "Juan Modificado" } });

    // Intentar cerrar (usando el botón de cerrar que el Modal ya provee)
    const closeBtn = screen.getByLabelText(/Cerrar modal/i);
    fireEvent.click(closeBtn);

    // Verificar que aparezca el diálogo de confirmación
    expect(screen.getByRole("heading", { name: /Cambios sin guardar/i })).toBeInTheDocument();
    expect(screen.getByText(/¿Hay cambios sin guardar, seguro que desea cerrar\?/i)).toBeInTheDocument();
  });
});
