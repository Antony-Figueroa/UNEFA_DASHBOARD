import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateCareer, deleteCareer } from "../careersService";
import type { Career } from "../../types";

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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateCareer(c)).rejects.toThrow(/Error al actualizar: 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const urlArg = fetchMock.mock.calls[0][0] as string;
    const initArg = fetchMock.mock.calls[0][1] as RequestInit;
    expect(urlArg).toMatch(/\/careers\/123$/);
    expect(initArg.method).toBe("PUT");
    expect(initArg.headers).toMatchObject({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
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

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payloadFromApi),
    });
    vi.stubGlobal("fetch", fetchMock);

    const updated = await updateCareer({ ...c, status: false });
    expect(updated.careerId).toBe("123");
    expect(updated.status).toBe(false);
  });

  it("deleteCareer envía status=false y usa updateCareer internamente", async () => {
    const c = buildCareer({ status: true });
    let capturedInit: RequestInit | undefined;
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "123", status: false }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await deleteCareer(c);
    expect(res.status).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedInit?.method).toBe("PUT");
    const body = JSON.parse(String(capturedInit?.body));
    expect(body.status).toBe(false);
  });
});

