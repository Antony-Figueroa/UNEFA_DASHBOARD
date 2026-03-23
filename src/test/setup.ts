/**
 * @file setup.ts
 * @description Configuración global para los tests con Vitest.
 * Proporciona matchers adicionales y utilities de testing.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// Mock de IntersectionObserver para componentes que lo usan
beforeAll(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class MockIntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    },
  });

  // Mock de ResizeObserver
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: class MockResizeObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  });

  // Mock de matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Provider wrapper para tests
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return children;
}

// Utilidades comunes para tests
export const mockStudent = {
  studentId: '1',
  identificationPrefix: 'V',
  identificationNumber: '12345678',
  firstName: 'Juan',
  middleName: 'Carlos',
  lastName: 'Pérez',
  secondLastName: 'Gómez',
  sex: 'MASCULINO',
  birthDate: '2000-05-15',
  civilStatus: 'SOLTERO',
  phone: '04121234567',
  email: 'juan.perez@test.com',
  address: 'Carrera 5, Calle 10',
  careerId: '1',
  careerName: 'Ingeniería de Sistemas',
  semester: '5',
  section: 'A',
  regime: 'DIURNO',
  studentType: 'CIVIL',
  militaryRank: 'N/A',
  works: 'NO',
  enrollmentDate: '2020-09-01',
  status: true,
  isInUse: false,
};

export const mockTutor = {
  tutorId: '1',
  identificationPrefix: 'V',
  identificationNumber: '87654321',
  firstName: 'María',
  middleName: 'Elena',
  lastName: 'Rodríguez',
  secondLastName: 'López',
  sex: 'FEMENINO',
  phone: '04141234567',
  email: 'maria.rodriguez@test.com',
  profession: 'Ingeniero de Sistemas',
  condition: 'Titular',
  dedication: 'Tiempo Completo',
  category: 'Agregado',
  registrationDate: '2019-01-15',
  status: true,
  carreras: ['1', '2'],
  practiceTypes: ['ORDINARIA'],
  isInUse: true,
};

export const mockInstitution = {
  institutionId: '1',
  rif: 'J-12345678-9',
  name: 'Empresa Test C.A.',
  institutionType: 'PRIVADA',
  address: 'Av. Principal, Edificio Test',
  phone: '02121234567',
  email: 'contacto@empresatest.com',
  status: true,
  registrationDate: '2020-01-01',
};

export const mockPreEnrollment = {
  preEnrollmentId: '1',
  studentCi: 'V-12345678',
  studentName: 'Juan Pérez',
  identificationNumber: '12345678',
  careerId: '1',
  careerName: 'Ingeniería de Sistemas',
  period: '2024-1',
  practiceType: 'ORDINARIA',
  preEnrollmentDate: '2024-01-15',
  status: true,
};

export const mockEnrollment = {
  enrollmentId: '1',
  studentCi: 'V-12345678',
  studentName: 'Juan Pérez',
  identificationNumber: '12345678',
  careerId: '1',
  careerName: 'Ingeniería de Sistemas',
  period: '2024-1',
  practiceType: 'ORDINARIA',
  enrollmentDate: '2024-02-01',
  status: true,
  internshipStatus: 'active',
  grade: 0,
};