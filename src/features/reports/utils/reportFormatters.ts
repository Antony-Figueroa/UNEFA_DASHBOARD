export function parseCI(ci: string | null | undefined): { prefix: string; number: string } {
  if (!ci) return { prefix: '', number: '' };
  const parts = ci.split('-');
  // Limpiar cualquier caracter que no sea dígito del número
  const cleanNumber = (parts[1] || ci).replace(/\D/g, '');
  return {
    prefix: parts[0] || 'V',
    number: cleanNumber
  };
}

// Formatea el número con separadores de miles
function formatNumberWithDots(num: string): string {
  const parts = [];
  for (let i = num.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      parts.unshift('.');
    }
    parts.unshift(num[i]);
  }
  return parts.join('');
}

export function formatCI(ci: string | null | undefined): string {
  if (!ci) return '';
  const { prefix, number } = parseCI(ci);
  const formattedNumber = formatNumberWithDots(number);
  return `${prefix}.${formattedNumber}`;
}

export function getTutorTitle(titulo: string | null, tituloAbrev?: string | null): string {
  const t = titulo || tituloAbrev;
  if (!t || t.trim() === '') return 'Tutor Académico';
  return t;
}

export function getTutorFullName(tutor: {
  titulo?: string | null;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
} | null | undefined): string {
  if (!tutor) return '';
  const title = getTutorTitle(tutor.titulo ?? null);
  const primerNombre = tutor.primerNombre || '';
  const segundoNombre = tutor.segundoNombre ? ` ${tutor.segundoNombre}` : '';
  const primerApellido = tutor.primerApellido || '';
  const segundoApellido = tutor.segundoApellido ? ` ${tutor.segundoApellido}` : '';
  return `${title}. ${primerNombre}${segundoNombre} ${primerApellido}${segundoApellido}`;
}

export function formatNombreCompleto(persona: {
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
} | null | undefined): string {
  if (!persona) return '';
  const primerNombre = persona.primerNombre || '';
  const segundoNombre = persona.segundoNombre ? ` ${persona.segundoNombre}` : '';
  const primerApellido = persona.primerApellido || '';
  const segundoApellido = persona.segundoApellido ? ` ${persona.segundoApellido}` : '';
  return `${primerNombre}${segundoNombre} ${primerApellido}${segundoApellido}`.trim();
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

const MESES_ES: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function getFechaParts(fecha: string | null): { dia: string; mes: string; anio: string } {
  if (!fecha) {
    const hoy = new Date();
    return {
      dia: String(hoy.getDate()),
      mes: MESES_ES[hoy.getMonth()],
      anio: String(hoy.getFullYear()),
    };
  }
  const date = new Date(fecha);
  return {
    dia: String(date.getDate()),
    mes: MESES_ES[date.getMonth()],
    anio: String(date.getFullYear()),
  };
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
