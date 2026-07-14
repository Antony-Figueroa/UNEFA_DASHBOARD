/**
 * @file CertificatePDF.test.tsx
 * @description Tests for rewritten CertificatePDF component with institutional layout.
 * Written FIRST (TDD).
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import type { CertificatePDFData } from '../../../../features/evaluations-culmination/types';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  Image: () => null,
  StyleSheet: {
    create: (styles: any) => styles,
  },
  pdf: vi.fn().mockReturnValue({
    toBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' })),
  }),
}));

// Mock reportFormatters
vi.mock('@/features/reports/utils/reportFormatters', () => ({
  formatNombreCompleto: (p: any) => `${p.primerNombre} ${p.segundoNombre || ''} ${p.primerApellido} ${p.segundoApellido || ''}`.trim(),
  formatCI: (ci: string) => ci,
  formatFecha: (f: string) => f || '',
}));

const completeData: CertificatePDFData = {
  practiceId: 1,
  estudiante: {
    ci: 'V-12.345.678',
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

const completeTextos: Record<string, string> = {
  firma1Nombre: 'Dr. María López',
  firma1Cargo: 'JEFA DEL EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES',
  firma2Nombre: 'Ing. Carlos Ruiz',
  firma2Cargo: 'JEFE DEL ÁREA DE SECRETARIA',
  firma3Nombre: 'Dr. Ana Torres',
  firma3Cargo: 'JEFA DEL ÁREA ACADÉMICA',
  firma4Nombre: 'Ing. Pedro Martínez',
  firma4Cargo: 'JEFA DE LA UNIDAD DE GESTIÓN EDUCATIVA',
  firma5Nombre: 'Dra. Laura Sánchez',
  firma5Cargo: 'DECANA DEL NÚCLEO',
};

describe('CertificatePDF', () => {
  it('is exported and generateCertificatePDF is callable', async () => {
    const { generateCertificatePDF } = await import('../templates/CertificatePDF');
    expect(typeof generateCertificatePDF).toBe('function');

    const blob = await generateCertificatePDF(completeData, completeTextos);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('generates a PDF blob with correct mime type', async () => {
    const { generateCertificatePDF } = await import('../templates/CertificatePDF');
    const blob = await generateCertificatePDF(completeData, completeTextos);
    expect(blob.type).toBe('application/pdf');
  });

  it('generates PDF with textos', async () => {
    const { generateCertificatePDF } = await import('../templates/CertificatePDF');
    const blob = await generateCertificatePDF(completeData, completeTextos);
    expect(blob).toBeDefined();
  });

  it('throws error when evaluacionFinal is null', async () => {
    const { generateCertificatePDF } = await import('../templates/CertificatePDF');
    const dataWithNullEval: CertificatePDFData = {
      ...completeData,
      evaluacionFinal: null,
    };
    await expect(generateCertificatePDF(dataWithNullEval, completeTextos))
      .rejects.toThrow();
  });
});
