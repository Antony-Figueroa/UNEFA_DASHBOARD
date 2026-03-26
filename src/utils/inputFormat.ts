/**
 * @file inputFormat.ts
 * @description Utilidades para formateo visual de inputs (cédula, teléfono, etc.)
 * El formateo es solo visual - los datos se guardan SIN formato (solo números + prefijo)
 */

/**
 * Formatea un número de cédula para visualización (V-00.000.000)
 * Formato venezolano: prefijo (V/E) + 7-8 dígitos
 * Ejemplos: V-12.345.678, V-31114449 (8 dígitos sin puntos)
 * 
 * @param value - Valor que puede tener prefijo (ej: "V12345678" o "31114449")
 * @returns String con formato visual
 */
export const formatCedulaDisplay = (value: string, includePrefix: boolean = true): string => {
  if (!value) return '';
  
  // Extraer prefijo y números
  const cleaned = value.toUpperCase().replace(/[^0-9VE]/g, '');
  const prefixMatch = cleaned.match(/^([VE])/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const numbers = cleaned.replace(/^[VE]/, '');
  
  if (!numbers) return includePrefix ? prefix : '';
  
  // LIMITE: Solo permitir hasta 8 dígitos (cédula venezolana)
  const limitedNumbers = numbers.slice(0, CEDULA_MAX_DIGITS);
  
  // Formatear desde la izquierda para números de 1-8 dígitos
  let formatted: string;
  const len = limitedNumbers.length;
  
  if (len <= 3) {
    formatted = limitedNumbers;
  } else if (len === 4) {
    formatted = limitedNumbers;
  } else if (len === 5) {
    formatted = `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2)}`;
  } else if (len === 6) {
    formatted = `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
  } else if (len === 7) {
    formatted = `${limitedNumbers.slice(0, 1)}.${limitedNumbers.slice(1, 4)}.${limitedNumbers.slice(4, 7)}`;
  } else if (len === 8) {
    formatted = `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}`;
  } else {
    // Caso por defecto (0 dígitos o por seguridad)
    formatted = limitedNumbers;
  }
   
  if (!includePrefix) return formatted;
  return prefix ? `${prefix}-${formatted}` : formatted;
};

/**
 * Limpia una cédula eliminando caracteres de formato (puntos, guiones)
 * @param value - Valor con o sin formato
 * @returns Valor limpio con prefijo (ej: V12345678)
 */
export const cleanCedula = (value: string): string => {
  if (!value) return '';
  // Mantener V o E y solo números
  const cleaned = value.toUpperCase().replace(/[^0-9VE]/g, '');
  const prefixMatch = cleaned.match(/^([VE])/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  // LIMITE: Solo permitir hasta 8 dígitos
  const numbers = cleaned.replace(/^[VE]/, '').slice(0, CEDULA_MAX_DIGITS);
  return prefix ? `${prefix}${numbers}` : numbers;
};

/**
 * Longitud máxima del número de cédula SIN prefijo (8 dígitos - límite de BD varchar(10) para TUTOR_CI: V-12345678)
 */
export const CEDULA_MAX_DIGITS = 8;

/**
 * Longitud máxima del input visual incluyendo formato (V-00.000.000 = 12 caracteres)
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
    const number = cleaned.slice(4, 8);
    return number ? `${prefix}-${number}` : prefix;
  }
  
  // Solo número local (sin prefijo)
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  
  // Máximo 7 dígitos del número local
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
};

/**
 * Formatea un número de teléfono local (7 dígitos) para visualización (000-0000)
 * @param value - Solo los 7 dígitos del número
 * @returns Teléfono local con formato visual
 */
export const formatPhoneLocalDisplay = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').substring(0, 7);
  
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
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
