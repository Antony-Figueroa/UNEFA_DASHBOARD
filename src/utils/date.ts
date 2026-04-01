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

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatDistanceToNow(
  value: DateInput,
  options: { addSuffix?: boolean } = {}
): string {
  const d = normalizeToDate(value);
  if (!d) return "-";

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const absDiff = Math.abs(diff);

  const suffix = diff > 0 ? (options.addSuffix ? "hace" : "") : (options.addSuffix ? "dentro de" : "");

  // Si la diferencia es muy pequeña (menos de 1 minuto), mostrar "ahora mismo"
  // Esto evita problemas de timezone donde el servidor y cliente tienen horas diferentes
  if (absDiff < MINUTE) return "ahora mismo";
  
  // Si la fecha parece estar en el futuro por diferencia de timezone, ajustar
  // (el servidor puede estar en UTC y el cliente en diferente timezone)
  if (diff < 0 && absDiff < 24 * HOUR) {
    return "ahora mismo";
  }
  if (absDiff < HOUR) {
    const mins = Math.floor(absDiff / MINUTE);
    return `${suffix} ${mins} min${mins > 1 ? "s" : ""}`.trim();
  }
  if (absDiff < DAY) {
    const hours = Math.floor(absDiff / HOUR);
    return `${suffix} ${hours} hora${hours > 1 ? "s" : ""}`.trim();
  }
  if (absDiff < WEEK) {
    const days = Math.floor(absDiff / DAY);
    return `${suffix} ${days} día${days > 1 ? "s" : ""}`.trim();
  }
  if (absDiff < MONTH) {
    const weeks = Math.floor(absDiff / WEEK);
    return `${suffix} ${weeks} semana${weeks > 1 ? "s" : ""}`.trim();
  }
  if (absDiff < YEAR) {
    const months = Math.floor(absDiff / MONTH);
    return `${suffix} ${months} mes${months > 1 ? "es" : ""}`.trim();
  }
  const years = Math.floor(absDiff / YEAR);
  return `${suffix} ${years} año${years > 1 ? "s" : ""}`.trim();
}
