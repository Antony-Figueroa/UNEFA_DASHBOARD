/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StudentsPage from "../students";
import { ThemeProvider } from "../../../context/ThemeContext";
import { ToastProvider } from "../../../context/ToastContext";
import { MemoryRouter } from "react-router";
import { AppWrapper } from "../../../components/common/PageMeta";
import { useStudents } from "../../../features/students/hooks/useStudents";

// Mocks de los hooks
vi.mock("../../../features/students/hooks/useStudents", () => ({
  useStudents: vi.fn(),
}));

vi.mock("../../../features/careers/hooks/useCareers", () => ({
  useCareers: vi.fn(() => ({
    careers: [],
    status: "success",
  })),
}));

vi.mock("../../../features/lists/hooks/useLists", () => ({
  useLists: vi.fn(() => ({
    fetchMultipleLists: vi.fn().mockResolvedValue({}),
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AppWrapper>
        <ThemeProvider>
          <ToastProvider>
            {ui}
          </ToastProvider>
        </ThemeProvider>
      </AppWrapper>
    </MemoryRouter>
  );
};

describe("StudentsPage", () => {
  const mockUseStudents = vi.mocked(useStudents);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStudents.mockReturnValue({
      students: [],
      status: "success",
      loadingAction: false,
      error: null,
      addStudent: vi.fn(),
      editStudent: vi.fn(),
      toggleStatus: vi.fn(),
      bulkRemoveStudents: vi.fn(),
      bulkRestoreStudents: vi.fn(),
      refreshStudents: vi.fn(),
    } as unknown as ReturnType<typeof useStudents>);
  });

  it("renderiza correctamente sin crashear cuando students es un array vacío", async () => {
    renderWithProviders(<StudentsPage />);
    // Usamos findByText para esperar a que el loader desaparezca
    expect(await screen.findByText(/Listado de Estudiantes/i)).toBeTruthy();
  });

  it("no crashea si 'students' no es un array (prevención de regresión)", async () => {
    mockUseStudents.mockReturnValue({
      students: null, // Simulamos el error reportado
      status: "success",
      loadingAction: false,
      refreshStudents: vi.fn(),
    } as unknown as ReturnType<typeof useStudents>);

    renderWithProviders(<StudentsPage />);
    // Usamos findByText para esperar a que el loader desaparezca
    expect(await screen.findByText(/Listado de Estudiantes/i)).toBeTruthy();
  });

  it("renderiza la tabla de estudiantes cuando hay datos", async () => {
    const mockStudents = [
      {
        studentId: "1",
        firstName: "Juan",
        lastName: "Perez",
        identificationNumber: "12345678",
        status: true,
        enrollmentDate: new Date().toISOString(),
        careerId: "1",
        studentType: "CIVIL",
        militaryRank: "NO APLICA",
      }
    ];
    mockUseStudents.mockReturnValue({
      students: mockStudents,
      status: "success",
      loadingAction: false,
      refreshStudents: vi.fn(),
    } as unknown as ReturnType<typeof useStudents>);

    renderWithProviders(<StudentsPage />);
    
    // Verificamos que aparezca el nombre en la tabla
    const nameElement = await screen.findByText(/Juan Perez/i);
    expect(nameElement).toBeTruthy();
  });
});
