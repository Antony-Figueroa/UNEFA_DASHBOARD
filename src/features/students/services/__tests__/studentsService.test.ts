import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStudents, createStudent, updateStudent, deleteStudent, toggleStudentStatus } from "../studentsService";
import type { Student } from "../../types";
import apiClient from "../../../../api/apiClient";

// Mock del apiClient
vi.mock("../../../../api/apiClient", () => ({
  default: {
    put: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

const buildStudent = (overrides: Partial<Student> = {}): Student => ({
  studentId: "1",
  identificationPrefix: "V",
  identificationNumber: "12345678",
  firstName: "Juan",
  middleName: "Perez",
  lastName: "Gomez",
  secondLastName: "Lopez",
  sex: "MASCULINO",
  birthDate: "2000-01-01",
  civilStatus: "SOLTERO",
  phone: "04261234567",
  email: "juan@example.com",
  address: "Caracas, Venezuela",
  careerId: "1",
  careerName: "Ingeniería",
  semester: "01",
  section: "A",
  regime: "DIURNO",
  studentType: "CIVIL",
  militaryRank: "NO APLICA",
  works: "NO",
  enrollmentDate: new Date("2024-01-01T00:00:00Z"),
  status: true,
  ...overrides,
});

describe("studentsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getStudents llama al endpoint correcto", async () => {
    const students = [buildStudent()];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: students });

    const result = await getStudents();
    expect(apiClient.get).toHaveBeenCalledWith("/students");
    expect(result).toEqual(students);
  });

  it("createStudent envía el payload correcto", async () => {
    const student = buildStudent();
    const { studentId, enrollmentDate, ...payload } = student;
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: student });

    const result = await createStudent(payload);
    
    expect(studentId).toBeDefined();
    expect(enrollmentDate).toBeDefined();
    expect(apiClient.post).toHaveBeenCalledWith("/students", payload);
    expect(result).toEqual(student);
  });

  it("updateStudent envía el payload correcto", async () => {
    const student = buildStudent();
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: student });

    const result = await updateStudent("1", student);
    expect(apiClient.put).toHaveBeenCalledWith("/students/1", student);
    expect(result).toEqual(student);
  });

  it("deleteStudent llama al endpoint DELETE", async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} });

    await deleteStudent("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/students/1");
  });

  it("toggleStudentStatus envía el estado correcto", async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { status: false } });

    await toggleStudentStatus("1", false);
    expect(apiClient.patch).toHaveBeenCalledWith("/students/1/status", { status: false });
  });
});
