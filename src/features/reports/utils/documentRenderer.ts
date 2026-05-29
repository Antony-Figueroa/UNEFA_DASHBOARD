export function renderDocumentText(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] ?? `[${key}]`);
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
