/**
 * Standalone script to render EvaluacionFinalPDF with mock data
 * Run: npx tsx test-pdf-preview.tsx
 */
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { EvaluacionFinalPDF } from './src/components/ui/pdf/templates/institutional/EvaluacionFinalPDF';
import fs from 'fs';
import path from 'path';

const mockData = {
  estudiante: {
    ci: 'V-24156789',
    primerNombre: 'María',
    segundoNombre: 'Alejandra',
    primerApellido: 'González',
    segundoApellido: 'Pérez',
  },
  carrera: { nombre: 'INGENIERÍA EN INFORMÁTICA' },
  institucion: { nombre: 'EMPRESA DE TECNOLOGÍA VENEZOLANA S.A.' },
  practica: {
    startDate: '2025-09-01',
    endDate: '2026-01-31',
    grade: 18,
  },
  evaluaciones: {
    tutorInstitucional: { parcial: 18, weight: 0.4 },
    tutorAcademico: { parcial: 16, weight: 0.3 },
    comiteEvaluador: { parcial: 19, weight: 0.3 },
    notaFinal: 17.7,
  },
};

const mockTextos = {
  encabezado: 'En la ciudad de Acarigua, Estado Portuguesa, se evaluate the professional practice of {{estudianteNombreCompleto}}, CI: {{estudianteCi}}, enrolled in {{carrera}}, at the institution {{institucionNombre}}, from {{fechaInicio}} to {{fechaFin}}.',
};

async function main() {
  console.log('Generating PDF preview...');

  const element = React.createElement(EvaluacionFinalPDF, {
    data: mockData,
    textos: mockTextos,
  });

  const pdfBuffer = await pdf(element).toBuffer();

  const outputPath = path.join(__dirname, 'test-evaluacion-final.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`PDF saved to: ${outputPath}`);
  console.log(`File size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
