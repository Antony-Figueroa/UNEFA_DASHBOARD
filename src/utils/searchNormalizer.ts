/**
 * @file searchNormalizer.ts
 * @description Utilidad compartida para normalizar texto en búsquedas.
 * Normaliza tildes, mayúsculas/minúsculas y espacios para que las búsquedas
 * sean consistentes en todo el sistema.
 *
 * @example
 * import { normalizeText } from '../../utils/searchNormalizer';
 *
 * const term = normalizeText("  MÉDICO  ");
 * term === "medico"; // true
 *
 * const matches = normalizeText("Licenciado").includes(normalizeText("LIC"));
 * matches; // true
 */

/**
 * Normaliza un texto para comparación en búsquedas:
 * - Convierte a minúsculas
 * - Elimina tildes y diacríticos (NFD decomposition)
 * - Colapsa espacios múltiples en uno solo
 * - Elimina espacios al inicio y final
 * - Opcionalmente tokeniza por palabras (mode: 'words')
 *
 * @param text - Texto a normalizar
 * @param mode - 'full' (default): comparación sobre el string completo.
 *               'words': tokeniza por palabras y cada palabra se normaliza por separado.
 * @returns Texto normalizado
 */
export function normalizeText(text: string, mode: 'full' | 'words' = 'full'): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes)
    .replace(/\s+/g, ' ')            // Colapsa múltiples espacios en uno
    .trim();                          // Elimina espacios al inicio y final

  if (mode === 'words') {
    return normalized
      .split(' ')
      .filter(Boolean)
      .join(' ');
  }

  return normalized;
}

/**
 * Verifica si el texto de búsqueda (`query`) hace match con un texto objetivo (`target`).
 * Soporta:
 * - Búsqueda por substring (default): "LIC" match "LICENCIADO"
 * - Búsqueda por palabra completa (mode 'words'): cada palabra del query debe aparecer en target
 * - Normalización completa de tildes, mayúsculas y espacios
 *
 * @param target - Texto contra el que se busca
 * @param query - Término de búsqueda
 * @param mode - 'substring' (default): busca el query completo dentro del target.
 *               'words': cada palabra del query debe aparecer en el target (en cualquier orden).
 * @returns true si hay match
 *
 * @example
 * // Substring (default)
 * matchSearch("LICENCIADO", "LIC"); // true
 * matchSearch("MÉDICO", "medico");  // true
 * matchSearch("TÉCNICO SUPERIOR", "superior"); // true
 *
 * // Words mode - cada palabra debe matchear
 * matchSearch("TÉCNICO SUPERIOR UNIVERSITARIO", "tecnico superior", 'words'); // true
 * matchSearch("LICENCIADO", "superior", 'words'); // false
 */
export function matchSearch(
  target: string,
  query: string,
  mode: 'substring' | 'words' = 'substring'
): boolean {
  const normalizedTarget = normalizeText(target, 'full');
  const normalizedQuery = normalizeText(query, 'full');

  if (!normalizedQuery) return true; // Sin query, todo matchea
  if (!normalizedTarget) return false;

  if (mode === 'words') {
    const targetWords = normalizedTarget.split(' ');
    const queryWords = normalizedQuery.split(' ');
    return queryWords.every((qw) =>
      targetWords.some((tw) => tw.includes(qw))
    );
  }

  // Substring mode (default)
  return normalizedTarget.includes(normalizedQuery);
}
