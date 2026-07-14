/**
 * @file certificatePDFData.test.ts
 * @description Type test for CertificatePDFData interface.
 * Verifies the interface accepts the structure returned by
 * reportsService.getDocumentData('evaluacion-consolidada', practiceId).
 * Written FIRST (TDD).
 */

import { describe, it, expectTypeOf } from 'vitest';
import type { CertificatePDFData } from '../index';

describe('CertificatePDFData type', () => {
  it('accepts a valid evaluacion-consolidada response shape', () => {
    const data: CertificatePDFData = {
      practiceId: 1,
      estudiante: {
        ci: 'V-12345678',
        primerNombre: 'Juan',
        segundoNombre: 'Carlos',
        primerApellido: 'Pérez',
        segundoApellido: 'Gómez',
      },
      carrera: { nombre: 'Ing. Enfermería' },
      institucion: { nombre: 'Hospital Central' },
      periodo: {
        description: '2024-2',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
      },
      practica: {
        startDate: '2024-02-01',
        endDate: '2024-05-30',
        grade: 16,
      },
      evaluacionFinal: {
        weights: { institucional: 0.4, academico: 0.3, comite: 0.3 },
        parciales: { institucional: 18, academico: 15, comite: 16 },
        notaFinal: 16.5,
      },
      certificateNumber: 'CERT-001',
    };

    expectTypeOf(data).toHaveProperty('practiceId');
    expectTypeOf(data).toHaveProperty('estudiante');
    expectTypeOf(data).toHaveProperty('carrera');
    expectTypeOf(data).toHaveProperty('institucion');
    expectTypeOf(data).toHaveProperty('periodo');
    expectTypeOf(data).toHaveProperty('practica');
    expectTypeOf(data).toHaveProperty('evaluacionFinal');
    expectTypeOf(data).toHaveProperty('certificateNumber');
  });

  it('allows null evaluacionFinal', () => {
    const data: CertificatePDFData = {
      practiceId: 2,
      estudiante: {
        ci: 'V-87654321',
        primerNombre: 'María',
        primerApellido: 'López',
      },
      carrera: { nombre: 'Ing. en Sistemas' },
      institucion: null,
      periodo: null,
      practica: {
        startDate: '',
        endDate: '',
        grade: 0,
      },
      evaluacionFinal: null,
    };

    expectTypeOf(data.evaluacionFinal).toBeNullable();
  });

  it('allows null institucion and null periodo', () => {
    const data: CertificatePDFData = {
      practiceId: 3,
      estudiante: {
        ci: 'V-11111111',
        primerNombre: 'Ana',
        primerApellido: 'Torres',
      },
      carrera: { nombre: 'Ing. Civil' },
      institucion: null,
      periodo: null,
      practica: {
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        grade: 14,
      },
      evaluacionFinal: {
        weights: { institucional: 0.4, academico: 0.3, comite: 0.3 },
        parciales: { institucional: null, academico: 15, comite: null },
        notaFinal: 14,
      },
    };

    expectTypeOf(data.institucion).toBeNullable();
    expectTypeOf(data.periodo).toBeNullable();
  });
});
