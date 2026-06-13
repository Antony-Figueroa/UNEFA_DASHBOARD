/**
 * Utilidades de normalización de texto para almacenamiento en base de datos.
 *
 * Convierte texto legible a un formato consistente (UPPERCASE, trim, espacios colapsados)
 * antes de guardar en la BD. Esto asegura que búsquedas y reportes sean consistentes.
 *
 * @module text-utils
 */

/**
 * Normaliza un texto para almacenamiento:
 * - Elimina espacios iniciales y finales (trim)
 * - Colapsa múltiples espacios internos a uno solo
 * - Convierte a UPPERCASE (preserva acentos y ñ → Ñ, á → Á, etc.)
 * - null-safe: devuelve `null` si el input es null, undefined, o vacío
 *
 * @param value - Texto a normalizar
 * @returns Texto normalizado en UPPERCASE, o `null` si el input es null/undefined/vacío
 *
 * @example
 * ```ts
 * sanitizeText("  jUaN  pÉrez  ")   // "JUAN PÉREZ"
 * sanitizeText(null)                 // null
 * sanitizeText("")                   // null
 * sanitizeText("   ")                // null
 * sanitizeText("María José")         // "MARÍA JOSÉ"
 * sanitizeText("Ñandú")              // "ÑANDÚ"
 * ```
 */
export function sanitizeText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return trimmed.replace(/\s+/g, ' ').toUpperCase();
}
