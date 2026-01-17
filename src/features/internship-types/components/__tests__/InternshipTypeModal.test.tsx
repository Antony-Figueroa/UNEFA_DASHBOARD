/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InternshipTypeModal from "../InternshipTypeModal";
import { InternshipType } from "../../types";

const sampleType: InternshipType = {
  INTERNSHIP_TYPE_ID: 1,
  NAME: "Pasantía de Prueba",
  ABBREVIATION: "PP",
  PRIORITY: 5,
  STATUS: 1,
  CREATION_DATE: "2026-01-17",
};

describe("InternshipTypeModal", () => {
  it("muestra el título correcto para registro", () => {
    render(
      <InternshipTypeModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        editingItem={null}
      />
    );
    expect(screen.getByText(/Registrar Tipo de Práctica/i)).toBeDefined();
  });

  it("muestra el título correcto para edición", () => {
    render(
      <InternshipTypeModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        editingItem={sampleType}
      />
    );
    expect(screen.getByText(/Editar Tipo de Práctica/i)).toBeDefined();
  });

  it("llama a onSave con los datos correctos al enviar el formulario", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    
    render(
      <InternshipTypeModal
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        editingItem={null}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Ingrese el nombre/i);
    const saveButton = screen.getByRole("button", { name: /Guardar Tipo/i });

    await user.type(nameInput, "Nueva Pasantía");
    
    // El select es nativo en el entorno de test
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "1");

    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        NAME: "NUEVA PASANTÍA",
        ABBREVIATION: "NUEVA PASA", // substring(0, 10) de "NUEVA PASANTÍA"
        PRIORITY: 1,
        STATUS: 1,
      });
    });
  });

  it("muestra error si el nombre ya existe", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    const existingTypes = [sampleType];
    
    render(
      <InternshipTypeModal
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        editingItem={null}
        existingTypes={existingTypes}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Ingrese el nombre/i);
    await user.type(nameInput, sampleType.NAME);
    
    await waitFor(() => {
      expect(screen.getByText(/Este tipo de práctica ya existe/i)).toBeDefined();
    });
  });

  it("muestra errores de validación si los campos están vacíos", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    
    render(
      <InternshipTypeModal
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        editingItem={null}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Guardar Tipo/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/El nombre es obligatorio/i)).toBeDefined();
      expect(screen.getByText(/La prioridad es obligatoria/i)).toBeDefined();
    });
    
    expect(onSave).not.toHaveBeenCalled();
  });
});
