/* @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CareerModal from "../../components/CareerModal";
import type { Career } from "../../types";

const sampleCareerFromBackend: Career = {
  careerId: "1",
  careerCode: "65" as unknown as string, // simulamos número recibido como string/number
  careerName: "CAREER_NAME 1" as unknown as string,
  minimumGrade: 12,
  careerAbbreviation: "CAREER_ABBREVIATION 1" as unknown as string,
  careerType: "LARGA",
  internshipTypeIds: ["1", "3", "2"], // normalizado en servicio
  creationDate: new Date(1767211511 * 1000),
  status: true,
};

const internshipOptions = [
  { id: 1, value: "HOSPITALARIA", label: "Hospitalaria", text: "Hospitalaria" },
  { id: 2, value: "COMUNITARIA", label: "Comunitaria", text: "Comunitaria" },
  { id: 3, value: "ORDINARIA", label: "Ordinaria", text: "Ordinaria" },
];

describe("CareerModal", () => {
  it("habilita Guardar y llama onSave con payload normalizado", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <CareerModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        editingCareer={sampleCareerFromBackend}
        internshipOptions={internshipOptions}
      />
    );

    const saveBtn = await screen.findByRole("button", { name: /guardar/i });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);

    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload).toMatchObject({
      careerCode: "65",
      careerName: "CAREER_NAME 1",
      minimumGrade: 12,
      careerAbbreviation: "CAREER_ABBREVIATION 1",
      status: true,
    });
    // internshipTypeIds normalizados a string[]
    expect(Array.isArray(payload.internshipTypeIds)).toBe(true);
    expect(payload.internshipTypeIds).toEqual(["1", "3", "2"]);
  });

  it("deshabilita Guardar si faltan campos requeridos", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <CareerModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        editingCareer={undefined}
        internshipOptions={internshipOptions}
      />
    );

    const saveBtn = await screen.findByRole("button", { name: /guardar/i });
    // Sin datos, minGrade vacío => no válido
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("auto-selecciona el nuevo tipo cuando llega lastCreatedInternshipTypeId y consume el estado", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const onConsume = vi.fn();

    render(
      <CareerModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        editingCareer={undefined}
        internshipOptions={internshipOptions}
        lastCreatedInternshipTypeId={99}
        onConsumeLastCreatedInternshipType={onConsume}
      />
    );

    const nameInput = await screen.findByPlaceholderText(/ingeniería de sistemas/i);
    await userEvent.type(nameInput, "INGENIERIA");

    const codeInput = await screen.findByPlaceholderText(/0501/i);
    await userEvent.type(codeInput, "1234");

    const abbrInput = await screen.findByPlaceholderText(/tsu-enf/i);
    await userEvent.type(abbrInput, "TSU-ING");

    const careerTypeSelect = await screen.findByPlaceholderText(/seleccione tipo/i);
    await userEvent.click(careerTypeSelect);
    const cortaOption = await screen.findByText(/corta/i);
    await userEvent.click(cortaOption);

    await waitFor(() => expect(onConsume).toHaveBeenCalledTimes(1));

    const saveBtn = await screen.findByRole("button", { name: /guardar/i });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload.internshipTypeIds).toContain("99");
  });
});
