/**
 * @file textFormat.ts
 * @description Utilidad para normalizar texto a Title Case para visualización en la UI.
 * Almacenamiento en BD es UPPERCASE, esta función convierte a Title Case al renderizar.
 */

/**
 * Palabras que NO se capitalizan en Title Case a menos que sean la primera palabra.
 * Preposiciones, conjunciones y artículos cortos en español.
 */
const LOWERCASE_EXCEPTIONS = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'e',
  'o', 'u', 'a', 'con', 'por', 'para', 'un', 'una',
]);

/**
 * Capitaliza la primera letra de una palabra preservando el resto.
 */
function capitalize(word: string): string {
  if (word.length === 0) return word;
  if (word.length === 1) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Convierte texto UPPERCASE (de BD) a Title Case para visualización.
 *
 * Reglas:
 * - Primera palabra SIEMPRE capitalizada
 * - Palabras en LOWERCASE_EXCEPTIONS se mantienen minúscula (salvo la primera)
 * - Caracteres acentuados (áéíóúñ) se preservan correctamente
 * - null/undefined/empty retorna cadena vacía
 * - Caracteres individuales se capitalizan
 * - No hay manejo especial de acrónimos (siguen reglas normales de Title Case)
 *
 * @param str - Texto a convertir (usualmente UPPERCASE desde BD)
 * @returns Texto en Title Case
 *
 * @example
 * toTitleCase("JUAN PÉREZ")        // "Juan Pérez"
 * toTitleCase("DE LOS SANTOS")     // "De los Santos"
 * toTitleCase("MARÍA JOSÉ")        // "María José"
 * toTitleCase("MÉDICO CIRUJANO")   // "Médico Cirujano"
 * toTitleCase("LICENCIADO EN EDUCACIÓN") // "Licenciado en Educación"
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  if (str.trim().length === 0) return str;

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Preserve whitespace-only entries (multiple spaces between words)
      if (word.length === 0) return word;

      // First word is ALWAYS capitalized
      if (index === 0) {
        return capitalize(word);
      }

      // Words in the exceptions list stay lowercase (unless first word)
      if (LOWERCASE_EXCEPTIONS.has(word)) {
        return word;
      }

      return capitalize(word);
    })
    .join(' ');
}

/**
 * Convierte texto a Title Case aplicando trim previo.
 * Conveniencia: combina trim + toTitleCase.
 *
 * @param str - Texto a convertir
 * @returns Texto en Title Case, trimado
 *
 * @example
 * normalizeForDisplay("  JUAN PÉREZ  ") // "Juan Pérez"
 */
export function normalizeForDisplay(str: string | null | undefined): string {
  if (!str) return '';
  return toTitleCase(str.trim());
}
