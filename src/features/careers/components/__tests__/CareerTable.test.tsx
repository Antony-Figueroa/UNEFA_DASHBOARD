/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CareerTable from "../CareerTable";
import { CareerRowData } from "../../types";

const mockData: CareerRowData[] = [
  {
    careerId: "1",
    careerCode: "C001",
    careerName: "Engineering",
    minimumGrade: 10,
    careerAbbreviation: "ENG",
    careerType: "LARGA",
    status: true,
    creationDate: "2026-01-01",
    internshipTypeIds: ["HOSPITALARIA"],
  },
  {
    careerId: "2",
    careerCode: "C002",
    careerName: "Medicine",
    minimumGrade: 15,
    careerAbbreviation: "MED",
    careerType: "LARGA",
    status: true,
    creationDate: "2026-01-01",
    internshipTypeIds: ["COMUNITARIA"],
  },
];

describe("CareerTable", () => {
  it("renders table rows correctly", () => {
    render(
      <CareerTable
        data={mockData}
        status="success"
        error={null}
      />
    );

    expect(screen.getByText("Engineering")).toBeDefined();
    expect(screen.getByText("Medicine")).toBeDefined();
    expect(screen.getByText("C001")).toBeDefined();
    expect(screen.getByText("C002")).toBeDefined();
  });

  it("handles sorting when clicking headers", async () => {
    render(
      <CareerTable
        data={mockData}
        status="success"
        error={null}
      />
    );

    const nameHeader = screen.getByText("Carrera");
    fireEvent.click(nameHeader);

    // Check if it's sorted (Engineering should be first by default, Medicine second)
    const rows = screen.getAllByRole("row");
    expect(rows[2].textContent).toContain("Engineering"); // rows[0] is header, rows[1] is also header (TableRow)
    expect(rows[3].textContent).toContain("Medicine");

    fireEvent.click(nameHeader); // Toggle to desc
    const rowsDesc = screen.getAllByRole("row");
    expect(rowsDesc[2].textContent).toContain("Medicine");
    expect(rowsDesc[3].textContent).toContain("Engineering");
  });

  it("handles bulk selection", () => {
    const onBulkDelete = vi.fn();
    render(
      <CareerTable
        data={mockData}
        status="success"
        error={null}
        onBulkDelete={onBulkDelete}
        activeTab="Activas"
      />
    );

    // Find the "Select All" checkbox
    const selectAllCheckbox = screen.getByLabelText("Seleccionar todos los elementos de la página actual") as HTMLInputElement;
    fireEvent.click(selectAllCheckbox);

    // Check if bulk action button appears
    const deleteButton = screen.getByRole("button", { name: /eliminar/i });
    expect(deleteButton).toBeDefined();
    expect(screen.getByText("2 seleccionados")).toBeDefined();

    fireEvent.click(deleteButton);
    expect(onBulkDelete).toHaveBeenCalledWith(["1", "2"]);
  });

  it("handles individual selection", () => {
    render(
      <CareerTable
        data={mockData}
        status="success"
        error={null}
        activeTab="Activas"
      />
    );

    const firstRowCheckbox = screen.getByLabelText("Seleccionar carrera Engineering") as HTMLInputElement;
    fireEvent.click(firstRowCheckbox);

    expect(screen.getByText("1 seleccionados")).toBeDefined();
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeDefined();
  });
});
