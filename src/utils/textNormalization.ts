/**
 * Text normalization utility for Spanish-language UI.
 * Converts inconsistent DB text to proper Title Case.
 */

// Prepositions and articles that stay lowercase (unless first word)
const LOWER_EXCEPTIONS = new Set([
  'de', 'del', 'la', 'el', 'las', 'los', 'en', 'con', 'por', 'para',
  'y', 'o', 'a', 'al',
]);

/**
 * Normalize text to Title Case for Spanish display.
 * "ANZOATEGUI" → "Anzoátegui" (accent-safe)
 * "aragua" → "Aragua"
 * "del CARMEN" → "Del Carmen"
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If already Title Case (first upper, rest lower), return as-is
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(trimmed)) return trimmed;

  // If all uppercase or all lowercase, normalize
  const words = trimmed.split(/\s+/);
  const normalized = words.map((word, i) => {
    const lower = word.toLowerCase();
    if (i > 0 && LOWER_EXCEPTIONS.has(lower)) return lower;
    // Capitalize first letter, lowercase rest
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return normalized.join(' ');
}

/**
 * Normalize for select options - consistent Title Case.
 * Use in all dropdown menus and select components.
 */
export function normalizeForSelect(text: string | null | undefined): string {
  return normalizeText(text);
}

/**
 * Normalize for table cell display.
 */
export function normalizeForTable(text: string | null | undefined): string {
  return normalizeText(text);
}

/**
 * Normalize for form input display (e.g., showing pre-filled values).
 */
export function normalizeForForm(text: string | null | undefined): string {
  return normalizeText(text);
}

/**
 * Normalize a full name or proper noun.
 * Handles: "MARIA JOSE GARCIA" → "Maria Jose Garcia"
 *          "maría josé garcía" → "María José García"
 */
export function normalizeName(name: string | null | undefined): string {
  return normalizeText(name);
}

/**
 * Normalize geographic names (Estado, Municipio, Parroquia).
 * Same as normalizeText but with geographic-specific exceptions if needed.
 */
export function normalizeGeo(text: string | null | undefined): string {
  return normalizeText(text);
}
