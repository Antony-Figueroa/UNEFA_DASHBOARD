/**
 * Standalone script to render ConstanciaTutorInstitucionalPDF with mock data
 * Run: npx tsx --tsconfig tsconfig.app.json test-constancia-tutor-institucional.tsx
 */
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ConstanciaTutorInstitucionalPDF } from './src/components/ui/pdf/templates/institutional/ConstanciaTutorInstitucionalPDF';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the image files for standalone testing
const mockImagePath = path.join(__dirname, 'public', 'pdfs-docs');

const mockData = {
  tutor: {
    ci: 'V-18234567',
    titulo: 'Ingeniero',
    primerNombre: 'Antonio',
    segundoNombre: '',
    primerApellido: 'Torres',
    segundoApellido: 'García',
  },
  institucion: { nombre: 'ALCALDÍA MUNICIPIO GUANARE' },
  totalHours: 480,
  periodo: {
    description: '2-2022',
    startDate: '2022-09-26',
    endDate: '2023-02-13',
  },
};

const mockTextos = {
  destinatario: '{{institucionNombre}}',
  cuerpo: `Señor(a):
{{institucionNombre}}
Presente.

Atención: {{tutorTitulo}} {{tutorNombreCompleto}}.

    Tengo el agrado de dirigirme a usted, en la oportunidad de extender nuestro sincero agradecimiento por su apoyo y participación incondicional, al desempeñarse como Tutor Institucional de la asignatura Práctica Profesional (Pasantía) de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), al asesorar, supervisar y evaluar estudiantes, colaborando de esta forma en el proceso formativo y de capacitación integral de estos futuros profesionales, realizando un acompañamiento con un total de {{totalHours}} horas, en el periodo académico {{periodo}}, comprendido entre las fechas {{inicioLapso}} y {{finLapso}}.

    Sin otro particular al cual referirme, me despido de usted quedando a sus gratas órdenes.`,
  firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDECANA\nSegún Orden Administrativa N° 0005 de fecha 18 de Marzo 2022',
};

async function main() {
  console.log('Generating Constancia Tutor Institucional PDF preview...');

  const element = React.createElement(ConstanciaTutorInstitucionalPDF, {
    data: mockData,
    textos: mockTextos,
  });

  const pdfBuffer = await pdf(element).toBuffer();

  const outputPath = path.join(__dirname, 'test-constancia-tutor-institucional.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`PDF saved to: ${outputPath}`);
  console.log(`File size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
