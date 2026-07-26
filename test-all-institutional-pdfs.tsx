/**
 * Script standalone para renderizar todos los PDFs institucionales modificados
 * con datos de prueba y guardarlos como archivos para inspección visual.
 *
 * Run: npx tsx --tsconfig tsconfig.app.json test-all-institutional-pdfs.tsx
 */
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar todos los templates modificados
import { AceptacionTutorPDF } from './src/components/ui/pdf/templates/institutional/AceptacionTutorPDF';
import { SolicitudInstitucionPDF } from './src/components/ui/pdf/templates/institutional/SolicitudInstitucionPDF';
import { ActaValidacionPDF } from './src/components/ui/pdf/templates/institutional/ActaValidacionPDF';
import { ConstanciaTutorAcademicoPDF } from './src/components/ui/pdf/templates/institutional/ConstanciaTutorAcademicoPDF';
import { ConstanciaTutorInstitucionalPDF } from './src/components/ui/pdf/templates/institutional/ConstanciaTutorInstitucionalPDF';
import { CartaPostulacionPDF } from './src/components/ui/pdf/templates/institutional/CartaPostulacionPDF';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = __dirname;

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_ESTUDIANTE = {
  ci: 'V-24156789',
  primerNombre: 'María',
  segundoNombre: 'Alejandra',
  primerApellido: 'González',
  segundoApellido: 'Pérez',
  telefono: '0412-3456789',
  email: 'maria.gonzalez@correo.com',
  empleo: 'Asistente Administrativo',
};

const MOCK_CARRERA = { nombre: 'INGENIERÍA EN INFORMÁTICA' };

const MOCK_TUTOR = {
  ci: 'V-18234567',
  titulo: 'Ingeniero',
  tituloAbrev: 'Ing.',
  primerNombre: 'Antonio',
  segundoNombre: '',
  primerApellido: 'Torres',
  segundoApellido: 'García',
  telefono: '0416-5678901',
  condicion: 'CONTRATADO',
  dedicacion: 'EXCLUSIVA',
};

const MOCK_INSTITUCION = { nombre: 'ALCALDÍA DEL MUNICIPIO GUANARE' };

const MOCK_PERIODO = {
  description: '1-2026',
  startDate: '2026-03-15',
  endDate: '2026-08-15',
};

const MOCK_PRACTICA = {
  regime: 'DIURNO',
  semester: 'VIII',
  section: 'ÚNICA',
};

const MOCK_TUTOR_INST = {
  titulo: 'Licenciado',
  primerNombre: 'Carlos',
  segundoNombre: 'Manuel',
  primerApellido: 'Rodríguez',
  segundoApellido: 'Mendoza',
};

const MOCK_RESPONSABLE = {
  nombreCompleto: 'Lic. Carlos Rodríguez Mendoza',
  titulo: 'Lic.',
};

// ─── Generación ─────────────────────────────────────────────

type TestCase = {
  name: string;
  filename: string;
  element: React.ReactElement;
  expectedChanges: string;
};

async function main() {
  console.log('========================================');
  console.log('  GENERANDO PREVIEWS DE TODOS LOS PDFs');
  console.log('========================================\n');

  const testCases: TestCase[] = [
    {
      name: 'Aceptación Tutor Académico',
      filename: 'test-aceptacion-tutor.pdf',
      expectedChanges: '✓ Título profesional abreviado (Ing.) ✓ Cédulas V-12.345.678 ✓ Firma en negrita ✓ Fecha en bold ✓ Sin "equipo trabajo" en membrete',
      element: React.createElement(AceptacionTutorPDF, {
        data: {
          estudiante: MOCK_ESTUDIANTE,
          carrera: MOCK_CARRERA,
          tutor: MOCK_TUTOR,
        },
        textos: {},
      }),
    },
    {
      name: 'Solicitud Asignación Institución',
      filename: 'test-solicitud-institucion.pdf',
      expectedChanges: '✓ "el/la Bachiller" → "al Bachiller" ✓ Destinatario editable ✓ Fechas en formato texto ✓ Sangría en cierre',
      element: React.createElement(SolicitudInstitucionPDF, {
        data: {
          estudiante: MOCK_ESTUDIANTE,
          carrera: MOCK_CARRERA,
          institucion: MOCK_INSTITUCION,
          periodo: MOCK_PERIODO,
        },
        textos: {
          senores: 'Señores:',
          presente: 'Presente',
          destinatarioNombre: 'ALCALDÍA DEL MUNICIPIO GUANARE',
          destinatario: 'MSc. Marbelys del Valle Rivero',
          cargo: 'Decana del Núcleo Portuguesa',
          firmaNombre: 'MSc. Marbelys del Valle Rivero',
          firmaCargo: 'Decana del Núcleo Portuguesa',
        },
      }),
    },
    {
      name: 'Acta de Validación',
      filename: 'test-acta-validacion.pdf',
      expectedChanges: '✓ DOCENTE (singular) ✓ Espaciado tabla-cierre ampliado ✓ Encabezados negrita ✓ Sangría en párrafos',
      element: React.createElement(ActaValidacionPDF, {
        data: {
          estudiante: MOCK_ESTUDIANTE,
          carrera: MOCK_CARRERA,
        },
        textos: {
          cuerpo: `Quienes suscriben, los docentes designados como jurados examinadores de la práctica profesional, modalidad de Pasantía, del estudiante {{estudianteNombreCompleto}}, titular de la cédula de identidad {{estudianteCi}}, cursante de la carrera {{carrera}}, según consta en las planillas de evaluación respectivas, las cuales fueron revisadas, validadas y verificadas, certifican que las mismas se corresponden con los requisitos establecidos en el Reglamento de Prácticas Profesionales de la UNEFA.

Sin otro particular al cual referirme, se expide la presente Acta de Validación de notas de la práctica profesional a los fines consiguientes.`,
        },
      }),
    },
    {
      name: 'Constancia Tutor Académico',
      filename: 'test-constancia-tutor-academico.pdf',
      expectedChanges: '✓ Cédulas sin prefijo V- ✓ Sin datos estudiante en cuerpo ✓ Firma nombre en negrita ✓ Fechas DMY ✓ firmaOrden en Times-Roman',
      element: React.createElement(ConstanciaTutorAcademicoPDF, {
        data: {
          tutor: MOCK_TUTOR,
          totalHours: 480,
          periodo: MOCK_PERIODO,
        },
        textos: {
          cuerpo: `Por medio de la presente, se hace constar que el/la {{tutorTitulo}} {{tutorNombreCompleto}}, titular de la cédula de identidad N° {{tutorCi}}, se ha desempeñado como Tutor Académico, en condición {{tutorCondicion}} con dedicación {{tutorDedicacion}}, durante el período académico {{periodo}}, comprendido desde {{inicioLapso}} hasta {{finLapso}}, con una duración de {{totalHours}} horas de acompañamiento. Constancia que se expide a los {{dia}} días del mes de {{mes}} del {{anio}}.`,
          firmaNombre: 'MSc. Marbelys del Valle Rivero',
          firmaCargo: 'Decana del Núcleo Portuguesa',
          firmaOrden: 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
        },
      }),
    },
    {
      name: 'Constancia Tutor Institucional',
      filename: 'test-constancia-tutor-institucional.pdf',
      expectedChanges: '✓ Institución en mayúsculas y negrita ✓ Sin subrayado bajo nombre ✓ Emisor con abreviatura (Ing.) ✓ Firma en negrita',
      element: React.createElement(ConstanciaTutorInstitucionalPDF, {
        data: {
          tutor: MOCK_TUTOR,
          institucion: MOCK_INSTITUCION,
          responsable: MOCK_RESPONSABLE,
          hoursRequired: 480,
          periodo: MOCK_PERIODO,
        },
        textos: {
          destinatario: 'Lic. Carlos Rodríguez Mendoza',
          atnn: 'Ing. Antonio Torres García.',
          firmaNombre: 'MSc. MARBELYS DEL VALLE RIVERO',
          firmaCargo: 'DECANA',
          firmaOrden: 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
        },
      }),
    },
    {
      name: 'Carta de Postulación',
      filename: 'test-carta-postulacion.pdf',
      expectedChanges: '✓ Ciudadano/Decana/Despacho alineados izquierda ✓ Datos sistema subrayados ✓ Régimen y trabajo sin subrayar',
      element: React.createElement(CartaPostulacionPDF, {
        data: {
          estudiante: MOCK_ESTUDIANTE,
          carrera: MOCK_CARRERA,
          institucion: MOCK_INSTITUCION,
          practica: MOCK_PRACTICA,
          tutorInstitucional: MOCK_TUTOR_INST,
          fechaValidacion: '15 de abril de 2026',
        },
        textos: {
          cuerpoAddress: `Ciudadano:\nMSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa\nUNEFA\nPresente.`,
          cuerpo: `Yo, {{nombre}}, titular de la cédula de identidad {{ci}}, estudiante de la carrera {{carrera}}, solicito de la manera más respetuosa a usted, se sirva autorizar la elaboración de la Carta de Postulación a los fines de realizar la práctica profesional.`,
          gerenteTalentoHumano: 'MSc. Marbelys del Valle Rivero',
          cargo: 'Decana del Núcleo Portuguesa',
        },
      }),
    },
  ];

  const errors: string[] = [];

  for (const testCase of testCases) {
    process.stdout.write(`Generando: ${testCase.name}... `);

    try {
      const pdfBuffer = await pdf(testCase.element).toBuffer();
      const outputPath = path.join(OUTPUT_DIR, testCase.filename);
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`✓ (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log('✗ ERROR');
      errors.push(`  ${testCase.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── Resumen ─────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  RESUMEN DE GENERACIÓN');
  console.log('========================================\n');

  if (errors.length === 0) {
    console.log('✅ Todos los PDFs se generaron correctamente.\n');
  } else {
    console.log(`⚠️  ${errors.length} error(es) encontrado(s):\n`);
    errors.forEach(e => console.log(e));
    console.log();
  }

  console.log('Archivos generados:');
  for (const tc of testCases) {
    const filePath = path.join(OUTPUT_DIR, tc.filename);
    const exists = fs.existsSync(filePath);
    const size = exists ? `${(fs.statSync(filePath).size / 1024).toFixed(1)} KB` : 'NO GENERADO';
    console.log(`  📄 ${tc.filename} — ${exists ? '✓' : '✗'} ${size}`);
    console.log(`     Cambios: ${tc.expectedChanges}`);
    console.log();
  }

  console.log('========================================\n');
  console.log('Para visualizar los PDFs, abre los archivos en tu lector de PDF favorito.');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
