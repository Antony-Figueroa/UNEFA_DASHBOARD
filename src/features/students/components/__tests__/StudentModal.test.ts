import { describe, it, expect } from "vitest";
import { studentSchema } from "../../constants/validation";

describe("StudentModal Validation Schema", () => {
  const validData = {
    identificationPrefix: "V",
    identificationNumber: "12345678",
    firstName: "Juan",
    lastName: "Perez",
    sex: "MASCULINO",
    birthDate: "2000-01-01",
    civilStatus: "SOLTERO",
    phonePrefix: "0412",
    phoneNumber: "1234567",
    email: "juan.perez@gmail.com",
    address: "Calle 123",
    careerId: "1",
    semester: "1",
    section: "1",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
  };

  it("debe validar datos correctos", () => {
    const result = studentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("Validación de Cédula", () => {
    it("debe fallar si la cédula tiene menos de 6 dígitos", () => {
      const data = { ...validData, identificationNumber: "12345" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("La cédula debe tener al menos 6 dígitos");
      }
    });

    it("debe fallar si la cédula tiene más de 8 dígitos", () => {
      const data = { ...validData, identificationNumber: "123456789" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("La cédula no puede tener más de 8 dígitos");
      }
    });

    it("debe fallar si la cédula contiene caracteres no numéricos", () => {
      const data = { ...validData, identificationNumber: "123456A" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Validación de Nombres", () => {
    it("debe fallar si el nombre contiene números", () => {
      const data = { ...validData, firstName: "Juan123" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("debe limpiar espacios adicionales en nombres", () => {
      const data = { ...validData, firstName: "  Juan   Pablo  " };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("Juan Pablo");
      }
    });
  });

  describe("Validación de Edad", () => {
    it("debe fallar si el estudiante es menor de 16 años", () => {
      const today = new Date();
      const fifteenYearsAgo = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
      const dateString = fifteenYearsAgo.toISOString().split('T')[0];
      
      const data = { ...validData, birthDate: dateString };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("El estudiante debe tener al menos 16 años");
      }
    });

    it("debe permitir si el estudiante tiene exactamente 16 años", () => {
      const today = new Date();
      const sixteenYearsAgo = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      const dateString = sixteenYearsAgo.toISOString().split('T')[0];
      
      const data = { ...validData, birthDate: dateString };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Validación de Teléfono", () => {
    it("debe fallar si el número no tiene exactamente 7 dígitos", () => {
      const data = { ...validData, phoneNumber: "123456" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("El número debe tener exactamente 7 dígitos");
      }
    });
  });

  describe("Validación de Email", () => {
    it("debe fallar con un formato de email inválido", () => {
      const data = { ...validData, email: "correo-invalido" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("debe fallar con un dominio no permitido", () => {
      const data = { ...validData, email: "test@ejemplo.com" };
      const result = studentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Use un dominio de correo válido");
      }
    });

    it("debe permitir dominios válidos", () => {
      const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'unefa.edu.ve'];
      domains.forEach(domain => {
        const data = { ...validData, email: `test@${domain}` };
        const result = studentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});
