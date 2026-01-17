/* @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InternshipTypeTable from "../InternshipTypeTable";
import { InternshipType } from "../../types";

const mockData: InternshipType[] = [
  {
    INTERNSHIP_TYPE_ID: 1,
    NAME: "Pasantía A",
    ABBREVIATION: "PA",
    PRIORITY: 1,
    STATUS: 1,
    CREATION_DATE: "2026-01-17",
  },
  {
    INTERNSHIP_TYPE_ID: 2,
    NAME: "Pasantía B",
    ABBREVIATION: "PB",
    PRIORITY: 2,
    STATUS: 1,
    CREATION_DATE: "2026-01-17",
  },
];

describe("InternshipTypeTable", () => {
  it("renderiza los datos correctamente", () => {
    render(
      <InternshipTypeTable
        data={mockData}
        status="success"
        error={null}
        activeTab="Activas"
        onEdit={() => {}}
        onToggleStatus={() => {}}
        onView={() => {}}
        onBulkDelete={() => {}}
        onBulkRestore={() => {}}
      />
    );

    expect(screen.getByText("Pasantía A")).toBeDefined();
    expect(screen.getByText("Pasantía B")).toBeDefined();
  });

  it("filtra por búsqueda", async () => {
    render(
      <InternshipTypeTable
        data={mockData}
        status="success"
        error={null}
        activeTab="Activas"
        onEdit={() => {}}
        onToggleStatus={() => {}}
        onView={() => {}}
        onBulkDelete={() => {}}
        onBulkRestore={() => {}}
      />
    );

    expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeDefined();
    expect(screen.getByText("Pasantía A")).toBeDefined();
  });

  it("muestra mensaje cuando no hay datos", () => {
    render(
      <InternshipTypeTable
        data={[]}
        status="success"
        error={null}
        activeTab="Activas"
        onEdit={() => {}}
        onToggleStatus={() => {}}
        onView={() => {}}
        onBulkDelete={() => {}}
        onBulkRestore={() => {}}
      />
    );

    expect(screen.getByText(/No se encontraron resultados/i)).toBeDefined();
  });
});
