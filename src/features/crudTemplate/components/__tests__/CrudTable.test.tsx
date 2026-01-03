/* @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrudTable } from "../CrudTable";
import type { CrudColumn } from "../../types";

interface Item {
  id: string;
  name: string;
  code: string;
}

const items: Item[] = [
  { id: "1", name: "B", code: "C002" },
  { id: "2", name: "A", code: "C001" },
];

const columns: CrudColumn<Item>[] = [
  {
    id: "name",
    header: "Nombre",
    sortable: true,
    accessor: (item) => item.name,
  },
  {
    id: "code",
    header: "Código",
    sortable: true,
    accessor: (item) => item.code,
  },
];

describe("CrudTable", () => {
  it("renderiza filas correctamente", () => {
    render(
      <CrudTable
        items={items}
        columns={columns}
      />,
    );

    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("B")).toBeDefined();
  });

  it("ordena por columna al hacer clic en el encabezado", () => {
    render(
      <CrudTable
        items={items}
        columns={columns}
      />,
    );

    const [nameHeaderButton] = screen.getAllByRole("button", { name: /Nombre/ });

    expect(nameHeaderButton.getAttribute("aria-sort")).toBe("none");

    fireEvent.click(nameHeaderButton);
    expect(nameHeaderButton.getAttribute("aria-sort")).toBe("ascending");

    fireEvent.click(nameHeaderButton);
    expect(nameHeaderButton.getAttribute("aria-sort")).toBe("descending");
  });
});
