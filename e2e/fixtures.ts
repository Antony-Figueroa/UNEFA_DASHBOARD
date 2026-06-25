import type { Page } from '@playwright/test';

/**
 * Helper functions for UNEFA Dashboard E2E tests
 */

export type { Page };

/**
 * Credenciales reales del administrador
 */
export const ADMIN_CI = 'V12345678';
export const ADMIN_PASSWORD = 'Adminmaster123!';

/**
 * Login helper - usa CI (cédula) + contraseña con input controlado de React
 */
export async function login(page: Page, ci = ADMIN_CI, password = ADMIN_PASSWORD) {
  await page.goto('/signin');
  await page.waitForLoadState('domcontentloaded');
  
  // Esperar a que cargue el formulario de login
  await page.waitForSelector('input[placeholder="V00.000.000"]', { timeout: 10000 });
  
  // Usar evaluate para setear valores nativos (React controlled inputs)
  await page.evaluate(({ ci, password }: { ci: string; password: string }) => {
    const ciInput = document.querySelector('input[placeholder="V00.000.000"]') as HTMLInputElement;
    const pwInput = document.querySelector('input[placeholder="Ingresa tu contraseña"]') as HTMLInputElement;
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    
    if (ciInput && nativeInputValueSetter) {
      nativeInputValueSetter.call(ciInput, ci);
      ciInput.dispatchEvent(new Event('input', { bubbles: true }));
      ciInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (pwInput && nativeInputValueSetter) {
      nativeInputValueSetter.call(pwInput, password);
      pwInput.dispatchEvent(new Event('input', { bubbles: true }));
      pwInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, { ci, password });
  
  // Esperar a que React procese los cambios
  await page.waitForTimeout(300);
  
  // Click en botón de iniciar sesión + esperar navegación simultáneamente
  const submitButton = page.locator('button[type="submit"]').first();
  
  try {
    await Promise.all([
      page.waitForURL(/dashboard|first-login/, { timeout: 15000 }),
      submitButton.click(),
    ]);
    await page.waitForLoadState('networkidle');
    console.log('✓ Login exitoso');
  } catch {
    console.warn('⚠ Login: timeout esperando redirección, URL actual:', page.url());
    // Si ya está en dashboard, continuamos igual
  }
}

/**
 * Navigate to a page and wait for it to load.
 * Usa domcontentloaded + timeout en vez de networkidle porque la app
 * tiene polling constante (notificaciones, SSE, etc.) que nunca deja
 * de hacer requests.
 */
export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
}
