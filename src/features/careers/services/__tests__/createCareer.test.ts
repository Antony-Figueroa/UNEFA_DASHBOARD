import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCareer } from "../careersService";
import type { Career } from "../../types";

describe("careersService - createCareer y fromApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("envía payload normalizado y mapea respuesta con claves mayúsculas", async () => {
    const newCareer: Omit<Career, "careerId" | "creationDate"> = {
      careerCode: "65",
      careerName: "CAREER_NAME 1",
      minimumGrade: 12,
      careerAbbreviation: "CAREER_ABBREVIATION 1",
      careerType: "LARGA",
      internshipTypeIds: ["1", "3", "2"],
      status: true,
    };

    let capturedBody: Record<string, unknown> | null = null;
    const fetchMock = vi.fn().mockImplementation((_input: RequestInfo, init?: RequestInit) => {
      capturedBody = init?.body ? JSON.parse(String(init?.body)) : null;
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            ID: "1",
            CAREER_CODE: 65,
            CAREER_NAME: "CAREER_NAME 1",
            MINIMUM_GRADE: 12,
            CAREER_ABBREVIATION: "CAREER_ABBREVIATION 1",
            CAREER_TYPE: "LARGA",
            INTERNSHIP_TYPE_IDS: [1, 3, 2],
            CREATION_DATE: 1767211511,
            STATUS: true,
          }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const created = await createCareer(newCareer);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedBody).toMatchObject({
      careerCode: "65",
      careerName: "CAREER_NAME 1",
      minimumGrade: 12,
      careerAbbreviation: "CAREER_ABBREVIATION 1",
      careerType: "LARGA",
      internshipTypeIds: ["1", "3", "2"],
      status: true,
    });

    // Respuesta mapeada y normalizada a tipos del frontend
    expect(created.careerId).toBe("1");
    expect(created.careerCode).toBe("65"); // número -> string
    expect(created.internshipTypeIds).toEqual(["1", "3", "2"]); // números -> strings
    expect(typeof created.minimumGrade).toBe("number");
    expect(created.status).toBe(true);
    expect(created.creationDate instanceof Date).toBe(true);
  });
});
