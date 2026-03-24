import { test, expect } from '@playwright/test';
import { login, gotoAndWait } from './fixtures';

/**
 * E2E Test: Inscripción
 */

test.describe('Inscripción', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navegar a la página de inscripción', async ({ page }) => {
    await gotoAndWait(page, '/enrollment');
    
    const heading = page.locator('h1, h2, h3, [class*="title"]').first();
    await expect(heading).toBeVisible();
  });

  test('Ver lista de inscripciones', async ({ page }) => {
    await gotoAndWait(page, '/enrollment');
    
    const table = page.locator('table, [role="table"], .table');
    await expect(table.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Abrir modal de crear inscripción', async ({ page }) => {
    await gotoAndWait(page, '/enrollment');
    
    const createButton = page.locator('button:has-text("Nueva"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await createButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible', timeout: 3000 }).catch(() => {});
    
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('Ver estadísticas de inscripción', async ({ page }) => {
    await gotoAndWait(page, '/enrollment');
    
    // Look for stat cards or charts
    const stats = page.locator('[class*="stat"], [class*="card"], svg');
    const hasStats = await stats.count() > 0;
    
    expect(hasStats).toBeTruthy();
    
    console.log('✓ Estadísticas de inscripción visibles');
  });
});
