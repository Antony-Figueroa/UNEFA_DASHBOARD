/**
 * @file routeUtils.ts
 * @description Utilidades compartidas para identificar rutas protegidas del dashboard.
 * Centraliza la lista de prefijos de rutas para evitar duplicación entre apiClient y AuthContext.
 */

/**
 * Prefijos de todas las rutas protegidas del dashboard (AppLayout).
 * Cualquier ruta que no coincida con estos prefijos se trata como pública
 * (página de login, páginas públicas, páginas 404).
 */
export const PROTECTED_PREFIXES = [
  '/dashboard', '/students', '/tutors', '/institutions', '/period',
  '/careers', '/pre-enrollment', '/enrollment', '/tracking',
  '/evaluations', '/reports', '/manuals', '/profile', '/calendar',
  '/ai-assistant', '/admin', '/notifications', '/configure',
  '/tutor', '/student', '/form-elements', '/basic-tables',
  '/alerts', '/avatars', '/badge', '/buttons', '/images', '/videos',
  '/line-chart', '/bar-chart', '/blank', '/crud-example',
  '/visit-registration', '/activity-logs', '/test-evaluacion-final',
] as const;

/**
 * Verifica si una ruta del navegador corresponde a una ruta protegida del dashboard.
 * 
 * @param path - Ruta del navegador (window.location.pathname)
 * @returns true si la ruta pertenece al dashboard protegido
 */
export function isProtectedAppRoute(path: string): boolean {
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/') return false;
  return (PROTECTED_PREFIXES as readonly string[]).some(prefix => normalized.startsWith(prefix));
}
