/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentModal from "../StudentModal";
import { ThemeProvider } from "../../../../context/ThemeContext";
import { ToastProvider } from "../../../../context/ToastContext";

interface MockFlatpickrProps {
  value: string;
  onChange: (dates: Date[]) => void;
  placeholder?: string;
}

// Mock FlatpickrDatePicker to avoid theme context issues in tests
vi.mock("../../../../components/form/FlatpickrDatePicker", () => ({
  default: ({ value, onChange, placeholder }: MockFlatpickrProps) => (
    <input
      data-testid="flatpickr-mock"
      value={value}
      onChange={(e) => onChange([new Date(e.target.value)])}
      placeholder={placeholder}
    />
  ),
}));

const careerOptions = [
  { value: "1", label: "Ingeniería" },
  { value: "2", label: "Derecho" },
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </ThemeProvider>
  );
};

describe("StudentModal", () => {
  it("muestra error si la dirección está vacía al intentar guardar", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    
    renderWithProviders(
      <StudentModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        careerOptions={careerOptions}
      />
    );

    const saveBtn = await screen.findByRole("button", { name: /guardar/i });
    
    // Forzamos el submit haciendo click en el botón
    await userEvent.click(saveBtn);

    // Esperamos a que la validación se ejecute y el mensaje aparezca
    const errorMessage = await screen.findByText(/la dirección es obligatoria/i);
    expect(errorMessage).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("comportamiento del Rango Militar para estudiantes de tipo CIVIL", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    
    renderWithProviders(
      <StudentModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        careerOptions={careerOptions}
      />
    );

    // 1. Verificar que por defecto es CIVIL (o seleccionarlo si no lo fuera)
    const studentTypeSelect = screen.getByLabelText(/tipo estudiante \*/i) as HTMLSelectElement;
    await userEvent.selectOptions(studentTypeSelect, "CIVIL");

    // 2. Verificar que militaryRank sea "NO APLICA" y esté deshabilitado
    const militaryRankSelect = screen.getByLabelText(/rango militar \*/i) as HTMLSelectElement;
    expect(militaryRankSelect.value).toBe("NO APLICA");
    expect(militaryRankSelect.disabled).toBe(true);

    // 3. Verificar que la única opción disponible sea "NO APLICA" (más el placeholder vacío)
    const options = Array.from(militaryRankSelect.options).map(opt => opt.value);
    expect(options).toContain("NO APLICA");
    expect(options).not.toContain("SOLDADO");
    expect(options).not.toContain("CABO");
  });

  it("comportamiento del Rango Militar para estudiantes de tipo MILITAR", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    
    renderWithProviders(
      <StudentModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        careerOptions={careerOptions}
      />
    );

    // 1. Cambiar tipo de estudiante a MILITAR
    const studentTypeSelect = screen.getByLabelText(/tipo estudiante \*/i) as HTMLSelectElement;
    await userEvent.selectOptions(studentTypeSelect, "MILITAR");

    // 2. Verificar que militaryRank esté habilitado y ya no sea "NO APLICA" (debería estar vacío para obligar selección)
    const militaryRankSelect = screen.getByLabelText(/rango militar \*/i) as HTMLSelectElement;
    expect(militaryRankSelect.value).toBe("");
    expect(militaryRankSelect.disabled).toBe(false);

    // 3. Verificar que "NO APLICA" NO esté en las opciones
    const options = Array.from(militaryRankSelect.options).map(opt => opt.value);
    expect(options).not.toContain("NO APLICA");
    expect(options).toContain("SOLDADO");
    expect(options).toContain("CABO");
  });

  it("permite guardar cuando todos los campos requeridos están llenos", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    
    renderWithProviders(
      <StudentModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        careerOptions={careerOptions}
      />
    );

    // Llenar campos básicos
     await userEvent.type(screen.getByPlaceholderText(/Número/i), "12345678");
     await userEvent.type(screen.getByPlaceholderText(/Ej: Juan/i), "Juan");
     await userEvent.type(screen.getByPlaceholderText(/Ej: Pérez/i), "Perez");
    
    // Sexo
    await userEvent.selectOptions(screen.getByLabelText(/sexo \*/i), "MASCULINO");
    
    // Fecha Nacimiento (usando el mock de flatpickr)
    const dateInput = screen.getByTestId("flatpickr-mock");
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });
    
    // Estado Civil
    await userEvent.selectOptions(screen.getByLabelText(/estado civil \*/i), "SOLTERO");
    
    // Teléfono
    await userEvent.type(screen.getByPlaceholderText(/1234567/i), "1234567");
    
    // Email
    await userEvent.type(screen.getByPlaceholderText(/ejemplo@gmail.com/i), "juan.perez@gmail.com");
    
    // Dirección
    await userEvent.type(screen.getByPlaceholderText(/Calle, Avenida, Casa\/Apto, Ciudad/i), "Calle Falsa 123, Ciudad de México");
    
    // Académico
    await userEvent.selectOptions(screen.getByLabelText(/carrera \*/i), "1");
    await userEvent.type(screen.getByPlaceholderText(/ej: 04/i), "01");
    await userEvent.type(screen.getByPlaceholderText(/ej: 236/i), "01");
    await userEvent.selectOptions(screen.getByLabelText(/régimen \*/i), "DIURNO");
    
    // Enviar
    const saveBtn = screen.getByRole("button", { name: /guardar/i });
    await userEvent.click(saveBtn);

    // Verificar que onSave fue llamado
    // Nota: A veces RHF necesita un tick para procesar el submit
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const calledData = onSave.mock.calls[0][0];
    expect(calledData.identificationNumber).toBe("12345678");
    expect(calledData.firstName).toBe("Juan");
    expect(calledData.address).toBe("Calle Falsa 123, Ciudad de México");
  });
});
