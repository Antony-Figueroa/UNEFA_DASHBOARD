/**
 * @file date.utils.ts
 * @description Utilidades para manejo de fechas en zona horaria de Venezuela (America/Caracas, UTC-4).
 */

/** Zona horaria de Venezuela */
export const VENEZUELA_TIMEZONE = 'America/Caracas';

/**
 * Obtiene la fecha y hora actual en Venezuela (UTC-4).
 * Para horarios de verano de Venezuela (UTC-4, sin cambio estacional).
 * 
 * @returns Date en hora de Venezuela
 */
export function nowInVenezuela(): Date {
  // Venezuela usa UTC-4 todo el año (no tiene cambio de horario)
  const now = new Date();
  // Obtener offset de la fecha actual en milisegundos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Venezuela es UTC-4, entonces restamos 4 horas
  return new Date(utc - (4 * 60 * 60 * 1000));
}

/**
 * Convierte una fecha a string ISO en hora de Venezuela.
 * Útil para guardar en la base de datos.
 * 
 * @param date - Fecha a convertir (por defecto ahora)
 * @returns String ISO en formato YYYY-MM-DDTHH:mm:ss
 */
export function toISOStringVenezuela(date: Date = new Date()): string {
  const venezuelaDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));
  return venezuelaDate.toISOString();
}

/**
 * Formatea una fecha para mostrar en formato legible para Venezuela.
 * 
 * @param date - Fecha a formatear
 * @param format - Formato: 'short' (dd/mmm/yyyy), 'long' (dd de mmm de yyyy), 'datetime' (dd/mmm/yyyy HH:mm)
 * @returns String formateado
 */
export function formatDateVenezuela(
  date: Date | string,
  format: 'short' | 'long' | 'datetime' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Ajustar a timezone de Venezuela
  const venezuelaDate = new Date(d.getTime() - (4 * 60 * 60 * 1000));
  
  const day = String(venezuelaDate.getUTCDate()).padStart(2, '0');
  const month = venezuelaDate.toLocaleString('es-VE', { month: 'short', timeZone: 'UTC' });
  const year = venezuelaDate.getUTCFullYear();
  const hours = String(venezuelaDate.getUTCHours()).padStart(2, '0');
  const minutes = String(venezuelaDate.getUTCMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'long':
      return `${day} de ${month} de ${year}`;
    case 'datetime':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'short':
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para Venezuela.
 * 
 * @returns String en formato YYYY-MM-DD
 */
export function todayInVenezuela(): string {
  const now = nowInVenezuela();
  return now.toISOString().split('T')[0];
}

/**
 * Obtiene la fecha y hora actual en formato YYYY-MM-DD HH:mm:ss para Venezuela.
 * 
 * @returns String en formato YYYY-MM-DD HH:mm:ss
 */
export function nowStringVenezuela(): string {
  const now = nowInVenezuela();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Valida que una fecha no sea futura (en hora de Venezuela).
 * 
 * @param dateString - Fecha en string ISO
 * @returns true si la fecha no es futura
 */
export function isNotFutureDate(dateString: string): boolean {
  const inputDate = new Date(dateString);
  const currentDate = nowInVenezuela();
  
  // Comparar solo fechas, sin hora
  const inputDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  return inputDay <= currentDay;
}