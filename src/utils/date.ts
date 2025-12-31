export type DateInput = Date | string | number | null | undefined;

export function formatDate(
  value: DateInput,
  locale: string = "es-VE",
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
): string {
  if (value === null || value === undefined) return "-";

  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string") {
    // Normalizar cadena: algunos backends envían fecha sin zona; intentar parseo robusto
    const trimmed = value.trim();
    const parsed = Date.parse(trimmed);
    if (isNaN(parsed)) return "-";
    d = new Date(parsed);
  } else if (typeof value === "number") {
    // Si el número parece ser segundos (menor a 1e12), convertir a ms
    const ms = value < 1e12 ? value * 1000 : value;
    d = new Date(ms);
  } else {
    return "-";
  }

  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString(locale, options);
}

// Normaliza el valor de entrada a un objeto Date manejando segundos/milisegundos y cadenas ISO
export function normalizeToDate(value: DateInput): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const parsed = Date.parse(value.trim());
    return isNaN(parsed) ? null : new Date(parsed);
  }
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Formatea fecha y hora: DD/MM/YYYY HH:MM (24h)
export function formatDateTime(
  value: DateInput,
  locale: string = "es-VE"
): string {
  const d = normalizeToDate(value);
  if (!d) return "-";
  const datePart = d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = d
    .toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(/^(\d{2}:\d{2}).*$/, "$1");
  return `${datePart} ${timePart}`;
}
