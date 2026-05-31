export function parseCI(ci: string): { prefix: string; number: string } {
  const parts = ci.split('-');
  return {
    prefix: parts[0] || 'V',
    number: parts[1] || ci
  };
}

export function formatCI(ci: string): string {
  const { prefix, number } = parseCI(ci);
  return `${prefix}/E - ${number}`;
}

export function getTutorTitle(titulo: string | null): string {
  if (!titulo || titulo.trim() === '') return 'Tutor Académico';
  return titulo;
}

export function getTutorFullName(tutor: {
  titulo: string | null;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
}): string {
  const title = getTutorTitle(tutor.titulo);
  const segundoNombre = tutor.segundoNombre ? ` ${tutor.segundoNombre}` : '';
  const segundoApellido = tutor.segundoApellido ? ` ${tutor.segundoApellido}` : '';
  return `${title}. ${tutor.primerNombre}${segundoNombre} ${tutor.primerApellido}${segundoApellido}`;
}

export function formatNombreCompleto(persona: {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
}): string {
  const segundoNombre = persona.segundoNombre ? ` ${persona.segundoNombre}` : '';
  const segundoApellido = persona.segundoApellido ? ` ${persona.segundoApellido}` : '';
  return `${persona.primerNombre}${segundoNombre} ${persona.primerApellido}${segundoApellido}`;
}

export function formatFecha(fecha: string | null): string {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatFechaLapso(inicio: string | null, fin: string | null): string {
  return `${formatFecha(inicio)} - ${formatFecha(fin)}`;
}

export function safeString(value: string | null | undefined, fallback = ''): string {
  if (!value || value.trim() === '') return fallback;
  return value;
}

export function safeNumber(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  return value;
}

export const DEFAULTS = {
  TITULO: 'Tutor Académico',
  SECOND_NAME: '',
  SECOND_SURNAME: '',
  OBSERVATIONS: '',
  TOTAL_HOURS: 0,
  GRADE: 0,
  EVALUATOR_CI: '',
  DEPARTMENT: 'No especificado',
  ATTENTION_SCHEDULE: 'No especificado',
} as const;
