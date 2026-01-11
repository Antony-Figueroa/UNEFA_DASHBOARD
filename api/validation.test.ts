import { describe, it, expect } from 'vitest';
import { studentSchema, careerSchema } from './schemas';

describe('Zod Validation Schemas', () => {
  it('debería validar un estudiante correctamente', () => {
    const validStudent = {
      STUDENTS_CI: 'V12345678',
      NAME: 'Juan',
      SURNAME: 'Perez',
      GENDER: 'M',
      BIRTHDATE: '2000-01-01',
      CONTACT_PHONE: '04121234567',
      EMAIL: 'juan@example.com',
      ADDRESS: 'Calle 123',
      MARITAL_STATUS: 'SOLTERO',
      SEMESTER: '1',
      SECTION: 'A',
      REGIME: 'DIURNO',
      STUDENT_TYPE: 'CIVIL',
      EMPLOYMENT: 'ESTUDIANTE',
      STATUS: 1,
      CAREER_ID: 1
    };

    const result = studentSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
  });

  it('debería fallar si el email es inválido', () => {
    const invalidStudent = {
      EMAIL: 'email-invalido'
    };

    const result = studentSchema.safeParse(invalidStudent);
    expect(result.success).toBe(false);
  });

  it('debería validar una carrera correctamente', () => {
    const validCareer = {
      CAREER_NAME: 'Ingeniería Informática',
      CAREER_CODE: 123,
      MINIMUM_GRADE: 12,
      CAREER_ABBREVIATION: 'II',
      STATUS: 1
    };

    const result = careerSchema.safeParse(validCareer);
    expect(result.success).toBe(true);
  });
});
