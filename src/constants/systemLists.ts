/**
 * @file systemLists.ts
 * @description Listas del sistema que no pueden ser editadas por usuarios.
 * Estas listas son de carácter legal o institucional y deben ser gestionadas solo por desarrolladores.
 */

export const SYSTEM_PROTECTED_LISTS = [
  'Estado civil',
  'Registro Civil',
  'Rif',
  'Prefijo RIF',
  'Tipo de empresa',
  'Tipo de Institucion',
  'Sexo',
  'Nacionalidad',
  'Tipo de Practica',
  'Rango Militar',
] as const;

export type SystemProtectedList = typeof SYSTEM_PROTECTED_LISTS[number];

/**
 * Verifica si una lista está protegida
 */
export const isProtectedList = (listName: string): boolean => {
  return SYSTEM_PROTECTED_LISTS.some(
    item => item.toLowerCase() === listName.toLowerCase()
  );
};

/**
 * Mensaje de error para listas protegidas
 */
export const PROTECTED_LIST_MESSAGE = "Esta lista es de configuración del sistema y no puede ser modificada.";
