/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrudForm, type CrudFieldConfig } from "../CrudForm";

const fields: CrudFieldConfig[] = [
  { name: "name", label: "Nombre", type: "text", required: true, minLength: 3 },
  { name: "average", label: "Nota promedio", type: "number", required: true, min: 0, max: 20 },
  {
    name: "tags",
    label: "Etiquetas",
    type: "multi-select",
    options: [
      { value: "A", label: "Etiqueta A" },
      { value: "B", label: "Etiqueta B" },
    ],
    required: true,
  },
];

describe("CrudForm", () => {
  it("valida campos requeridos y llama onSubmit con valores normalizados", () => {
    const onSubmit = vi.fn();

    render(
      <CrudForm
        fields={fields}
        onSubmit={onSubmit}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    fireEvent.click(submitButton);

    expect(onSubmit).not.toHaveBeenCalled();

    const nameInput = screen.getByLabelText("Nombre") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "ABC" } });

    const averageInput = screen.getByLabelText("Nota promedio") as HTMLInputElement;
    fireEvent.change(averageInput, { target: { value: "15" } });

    const select = screen.getByLabelText("Etiquetas") as HTMLSelectElement;
    fireEvent.change(select, {
      target: {
        selectedOptions: [
          { value: "A" },
          { value: "B" },
        ],
      },
    });

    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe("ABC");
    expect(submitted.average).toBe("15");
    expect(submitted.tags).toEqual(["A", "B"]);
  });
});

