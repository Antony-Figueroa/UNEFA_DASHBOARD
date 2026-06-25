/**
 * @file inputFormat.ts
 * @description Utilidades para formateo visual de inputs (cédula, teléfono, etc.)
 * El formateo es solo visual - los datos se guardan SIN formato (solo números + prefijo)
 */

/**
 * Prefijos que corresponden a cédula venezolana (formateo con puntos).
 */
const CID_PREFIXES = ['V', 'E', 'J', 'G'];

/**
 * Prefijo de pasaporte.
 */
const PASSPORT_PREFIX = 'P';

/**
 * Formatea un número de identificación para visualización.
 * - Cédula (V/E/J/G): V-12.345.678 (formato venezolano con puntos)
 * - Pasaporte (P): P-ABC123456 (sin formato, crudo)
 * 
 * @param value - Valor que puede tener prefijo (ej: "V12345678" o "PABC123456")
 * @returns String con formato visual
 */
export const formatCedulaDisplay = (value: string, includePrefix: boolean = true): string => {
  if (!value) return '';
  
  const cleaned = value.toUpperCase();
  const prefixMatch = cleaned.match(/^([A-Z])/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  
  if (!prefix) return includePrefix ? prefix : '';
  
  const isPassport = prefix === PASSPORT_PREFIX;
  const body = cleaned.slice(1); // todo después del prefijo
  
  if (!body) return includePrefix ? prefix : '';
  
  const display = isPassport
    // Pasaporte: crudo, solo caracteres válidos, máx 15
    ? body.replace(/[^A-Z0-9]/g, '').slice(0, PASSPORT_MAX_LENGTH)
    // Cédula: solo dígitos, máx 8
    : body.replace(/\D/g, '').slice(0, CEDULA_MAX_DIGITS);
  
  if (isPassport) {
    // Pasaporte: sin formato (ej: P-ABC123456)
    if (!includePrefix) return display;
    return prefix ? `${prefix}-${display}` : display;
  }
  
  // Cédula: formateo con puntos (ej: V-12.345.678)
  let formatted: string;
  const len = display.length;
  
  if (len <= 4) {
    formatted = display;
  } else if (len <= 6) {
    formatted = `${display.slice(0, 2)}.${display.slice(2)}`;
  } else if (len === 7) {
    formatted = `${display.slice(0, 1)}.${display.slice(1, 4)}.${display.slice(4, 7)}`;
  } else if (len === 8) {
    formatted = `${display.slice(0, 2)}.${display.slice(2, 5)}.${display.slice(5, 8)}`;
  } else {
    formatted = display;
  }
  
  if (!includePrefix) return formatted;
  return prefix ? `${prefix}-${formatted}` : formatted;
};

/**
 * Limpia una identificación eliminando caracteres de formato (puntos, guiones).
 * - Cédula (V/E/J/G): solo dígitos, máx 8
 * - Pasaporte (P): alfanumérico, máx 15
 * @param value - Valor con o sin formato (ej: "V-12.345.678" o "P-ABC123456")
 * @returns Valor limpio con prefijo (ej: "V12345678" o "PABC123456")
 */
export const cleanCedula = (value: string): string => {
  if (!value) return '';
  const cleaned = value.toUpperCase();
  const prefixMatch = cleaned.match(/^([A-Z])/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  
  if (!prefix) return cleaned.replace(/\D/g, '').slice(0, CEDULA_MAX_DIGITS);
  
  const isPassport = prefix === PASSPORT_PREFIX;
  const body = cleaned.slice(1);
  const maxLen = isPassport ? PASSPORT_MAX_LENGTH : CEDULA_MAX_DIGITS;
  const validBody = isPassport
    ? body.replace(/[^A-Z0-9]/g, '').slice(0, maxLen)
    : body.replace(/\D/g, '').slice(0, maxLen);
  
  return `${prefix}${validBody}`;
};

/**
 * Longitud máxima del número de cédula SIN prefijo (8 dígitos - límite de BD varchar(10) para TUTOR_CI: V-12345678)
 */
export const CEDULA_MAX_DIGITS = 8;

/**
 * Longitud máxima del número de pasaporte SIN prefijo (alfanumérico, estándar OACI hasta 9, dejamos 15 por seguridad)
 */
export const PASSPORT_MAX_LENGTH = 15;

/**
 * Longitud máxima del input visual de cédula incluyendo formato (V-00.000.000 = 12 caracteres)
 */
export const CEDULA_MAX_LENGTH = 12;

/**
 * Formatea un número de teléfono para visualización (000-0000)
 * Formato venezolano: prefijo (0412, 0212, etc.) + número local (7 dígitos)
 * 
 * @param value - Teléfono sin formato o con prefijo
 * @returns Teléfono con formato
 */
export const formatPhoneDisplay = (value: string): string => {
  if (!value) return '';
  
  const cleaned = value.replace(/\D/g, '');
  
  // Si tiene prefijo de 4 dígitos (0412, 0212, etc.)
  if (cleaned.length > 4) {
    const prefix = cleaned.slice(0, 4);
    const number = cleaned.slice(4);
    if (number.length > 0) {
      return `${prefix}-${number.slice(0, 7)}`;
    }
    return prefix;
  }
  
  // Solo número local (sin prefijo)
  if (cleaned.length <= 4) return cleaned;
  return cleaned.slice(0, 7);
};

/**
 * Formatea un número de teléfono local (7 dígitos) para visualización
 * @param value - Solo los 7 dígitos del número
 * @returns Teléfono local sin formato (solo dígitos)
 */
export const formatPhoneLocalDisplay = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '').substring(0, 7);
};

/**
 * Limpia un teléfono eliminando caracteres de formato
 * @param value - Teléfono con o sin formato
 * @returns Teléfono limpio (solo dígitos)
 */
export const cleanPhone = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Longitud máxima del número de teléfono (sin prefijo)
 */
export const PHONE_LOCAL_MAX_DIGITS = 7;

/**
 * Longitud máxima del input visual del número local incluyendo formato (000-0000 = 8 caracteres)
 */
export const PHONE_LOCAL_MAX_LENGTH = 8;

/**
 * Longitud máxima del input visual incluyendo formato (0412-1234567 = 12 caracteres)
 */
export const PHONE_MAX_LENGTH = 12;

/**
 * Formatea para mostrar en tablas con prefijo (V-12.345.678)
 * @param cedula - Cédula que puede tener prefijo
 * @returns Cédula formateada para display
 */
export const formatCedulaForTable = (cedula: string): string => {
  return formatCedulaDisplay(cedula);
};

/**
 * Clase CSS para dar espaciado visual a números de cédula
 */
/**
 * Longitud máxima del número de RIF (9 dígitos)
 */
export const RIF_NUMBERS_LENGTH = 9;

/**
 * Longitud máxima del input visual del RIF incluyendo formato (12345678-9 = 10 caracteres)
 */
export const RIF_MAX_LENGTH = 10;

/**
 * Formatea un número de RIF para visualización (12345678-9)
 * @param value - Solo los 9 dígitos del RIF
 * @returns RIF con formato visual
 */
export const formatRifDisplay = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').substring(0, RIF_NUMBERS_LENGTH);
  
  if (cleaned.length <= 8) return cleaned;
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 9)}`;
};

/**
 * Limpia un RIF eliminado caracteres de formato
 * @param value - RIF con o sin formato
 * @returns RIF limpio (solo dígitos)
 */
export const cleanRif = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '').substring(0, RIF_NUMBERS_LENGTH);
};

export const CEDULA_INPUT_CLASS = "tracking-[0.2em]";
export const PHONE_INPUT_CLASS = "tracking-[0.15em]";
export const RIF_INPUT_CLASS = "tracking-[0.1em]";
