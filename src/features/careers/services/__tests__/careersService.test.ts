import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateCareer, deleteCareer } from "../careersService";
import type { Career } from "../../types";
import apiClient from "../../../../api/apiClient";

// Mock del apiClient
vi.mock("../../../../api/apiClient", () => ({
  default: {
    put: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Utilidad para construir una carrera válida
const buildCareer = (overrides: Partial<Career> = {}): Career => ({
  careerId: "123",
  careerCode: "ING-SIS",
  careerName: "Ingeniería de Sistemas",
  minimumGrade: 13,
  careerAbbreviation: "IS",
  internshipTypeIds: ["1", "2"],
  creationDate: new Date("2024-01-01T00:00:00.000Z"),
  status: true,
  ...overrides,
});

describe("careersService - update & delete", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lanza error si falta careerId en updateCareer", async () => {
    const c = buildCareer({ careerId: "" });
    await expect(updateCareer(c)).rejects.toThrow(/careerId es requerido/);
  });

  it("propaga error 400 con mensaje informativo en updateCareer", async () => {
    const c = buildCareer();
    vi.mocked(apiClient.put).mockRejectedValueOnce({
      response: {
        status: 400,
        data: "Bad Request",
      },
      isAxiosError: true,
    });

    await expect(updateCareer(c)).rejects.toThrow();
    expect(apiClient.put).toHaveBeenCalledTimes(1);
    const urlArg = vi.mocked(apiClient.put).mock.calls[0][0] as string;
    expect(urlArg).toMatch(/\/careers\/123$/);
  });

  it("actualiza correctamente y mapea la respuesta", async () => {
    const c = buildCareer();
    const payloadFromApi = {
      id: "123",
      careerCode: c.careerCode,
      careerName: c.careerName,
      minimumGrade: c.minimumGrade,
      careerAbbreviation: c.careerAbbreviation,
      internshipTypeIds: c.internshipTypeIds,
      creationDate: c.creationDate.toISOString(),
      status: false,
    };

    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: payloadFromApi,
      status: 200,
    });

    const updated = await updateCareer({ ...c, status: false });
    expect(updated.careerId).toBe("123");
    expect(updated.status).toBe(false);
  });

  it("deleteCareer envía status=false y usa updateCareer internamente", async () => {
    const c = buildCareer({ status: true });
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: { id: "123", status: false },
      status: 200,
    });

    const res = await deleteCareer(c);
    expect(res.status).toBe(false);
    expect(apiClient.put).toHaveBeenCalledTimes(1);
    const bodyArg = vi.mocked(apiClient.put).mock.calls[0][1] as Record<string, unknown>;
    expect(bodyArg.status).toBe(false);
  });
});

