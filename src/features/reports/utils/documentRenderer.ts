import React from 'react';
import { Text } from '@react-pdf/renderer';

export function renderDocumentText(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] ?? `[${key}]`);
}

/**
 * Renderiza un template con variables {{variable}}.
 * Permite especificar qué variables deben ir en negrita (boldKeys).
 * Retorna un array de Text elements de @react-pdf/renderer.
 */
export function renderDocumentTextFormatted(
  template: string,
  data: Record<string, string>,
  boldKeys: Set<string> = new Set()
): React.ReactNode[] {
  const parts = template.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/\{\{(\w+)\}\}/);
    if (m) {
      const key = m[1];
      const value = data[key];
      if (value !== undefined) {
        const isBold = boldKeys.has(key);
        if (isBold) {
          return React.createElement(Text, { key: i, style: { fontWeight: 'bold' } }, value.toUpperCase());
        }
        return React.createElement(Text, { key: i }, value);
      }
      return `[${key}]`;
    }
    return part;
  });
}

export function buildPlaceholderData(params: {
  tutorTitulo?: string;
  tutorNombreCompleto?: string;
  tutorCi?: string;
  tutorTelefono?: string;
  estudianteNombreCompleto?: string;
  estudianteCi?: string;
  carrera?: string;
  institucionNombre?: string;
  lapsoInicio?: string;
  lapsoFin?: string;
  fechaInicio?: string;
  fechaFin?: string;
  periodo?: string;
  semestre?: string;
  seccion?: string;
  regimen?: string;
  empleo?: string;
  departamento?: string;
  tutorCondicion?: string;
  tutorDedicacion?: string;
  totalHours?: string;
  [key: string]: string | undefined;
}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = value ?? '';
  }
  return result;
}
