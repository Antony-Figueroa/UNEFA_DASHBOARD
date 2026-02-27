/**
 * @file inputFormat.ts
 * @description Utilidades para formateo visual de inputs (cédula, teléfono, etc.)
 * El formateo es solo visual - los datos se guardan CON el prefijo (V, E, etc.)
 */

/**
 * Formatea un número de cédula para visualización (V-00.000.000)
 * @param value - Valor que puede tener prefijo (ej: "V12345678")
 * @returns String con formato visual
 */
export const formatCedulaDisplay = (value: string): string => {
  if (!value) return '';
  
  // Extraer prefijo y números
  const cleaned = value.toUpperCase().replace(/[^0-9VE]/g, '');
  const prefixMatch = cleaned.match(/^([VE])/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const numbers = cleaned.replace(/^[VE]/, '');
  
  if (!numbers) return prefix;
  
  // Formatear números con puntos: 00.000.000
  const formatted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return prefix ? `${prefix}-${formatted}` : formatted;
};

/**
 * Limpia una cédula eliminando caracteres de formato (guiones), pero mantiene el prefijo
 * @param value - Valor con o sin formato
 * @returns Valor limpio con prefijo (ej: V12345678)
 */
export const cleanCedula = (value: string): string => {
  if (!value) return '';
  // Mantener V o E y solo números
  const cleaned = value.toUpperCase().replace(/[^0-9VE]/g, '');
  const prefixMatch = cleaned.match(/^([VE])/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const numbers = cleaned.replace(/^[VE]/, '');
  return prefix ? `${prefix}${numbers}` : numbers;
};

/**
 * Formatea un número de teléfono para visualización (000-0000)
 * @param value - Teléfono sin formato
 * @returns Teléfono con formato
 */
export const formatPhoneDisplay = (value: string): string => {
  if (!value) return '';
  
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  
  // Máximo 7 dígitos (3 prefijo + 4 número local)
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
};

/**
 * Limpia un teléfono eliminando caracteres de formato
 * @param value - Teléfono con o sin formato
 * @returns Teléfono limpio
 */
export const cleanPhone = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

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
export const CEDULA_INPUT_CLASS = "tracking-[0.2em]";
export const PHONE_INPUT_CLASS = "tracking-[0.15em]";
