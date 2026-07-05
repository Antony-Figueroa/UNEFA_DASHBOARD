/**
 * Simple test to verify Constancia Tutor Institucional text formatting
 * Run: npx tsx --tsconfig tsconfig.app.json test-constancia-simple.tsx
 */
import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 12 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 1.5 },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5 },
  firmaNombre: { fontWeight: 'bold', fontSize: 11 },
  firmaRol: { fontSize: 10, color: '#4a5568' },
});

const mockTextos = {
  cuerpo: `Señor(a):
ALCALDÍA MUNICIPIO GUANARE
Presente.

Atención: Ingeniero Antonio Torres García.

    Tengo el agrado de dirigirme a usted, en la oportunidad de extender nuestro sincero agradecimiento por su apoyo y participación incondicional, al desempeñarse como Tutor Institucional de la asignatura Práctica Profesional (Pasantía) de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), al asesorar, supervisar y evaluar estudiantes, colaborando de esta forma en el proceso formativo y de capacitación integral de estos futuros profesionales, realizando un acompañamiento con un total de 480 horas, en el periodo académico 2-2022, comprendido entre las fechas 26/09/2022 y 13/02/2023.

    Sin otro particular al cual referirme, me despido de usted quedando a sus gratas órdenes.`,
};

async function main() {
  console.log('Generating simple Constancia Tutor Institucional preview...');

  const element = React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, 'CONSTANCIA DE TUTOR INSTITUCIONAL'),
      React.createElement(Text, { style: styles.paragraph }, mockTextos.cuerpo),
      React.createElement(View, { style: styles.firmaContainer },
        React.createElement(Text, { style: styles.firmaLine }, '___________________________________'),
        React.createElement(Text, { style: styles.firmaNombre }, 'MSc. Marbelys del Valle Rivero'),
        React.createElement(Text, { style: styles.firmaRol }, 'DECANA'),
        React.createElement(Text, { style: styles.firmaRol }, 'Según Orden Administrativa N° 0005 de fecha 18 de Marzo 2022'),
      ),
    )
  );

  const blob = await pdf(element).toBlob();

  const outputPath = path.join(__dirname, 'test-constancia-tutor-institucional.pdf');
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);

  console.log(`PDF saved to: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
