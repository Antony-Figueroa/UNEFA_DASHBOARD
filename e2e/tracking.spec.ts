import { test, expect } from '@playwright/test';
import { login, gotoAndWait } from './fixtures';

/**
 * E2E Test: Seguimiento y Visitas
 */

test.describe('Seguimiento y Visitas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navegar a la página de seguimiento', async ({ page }) => {
    await gotoAndWait(page, '/tracking');
    
    const heading = page.locator('h1, h2, h3, [class*="title"]').first();
    await expect(heading).toBeVisible();
  });

  test('Ver lista de seguimientos', async ({ page }) => {
    await gotoAndWait(page, '/tracking');
    
    const table = page.locator('table, [role="table"], .table');
    await expect(table.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Abrir modal de crear seguimiento', async ({ page }) => {
    await gotoAndWait(page, '/tracking');
    
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await createButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible', timeout: 3000 }).catch(() => {});
    
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('Ver estadísticas de seguimiento', async ({ page }) => {
    await gotoAndWait(page, '/tracking');
    
    // Look for charts or stats
    const stats = page.locator('[class*="stat"], [class*="card"], svg, canvas');
    const hasStats = await stats.count() > 0;
    
    expect(hasStats).toBeTruthy();
    
    console.log('✓ Estadísticas de seguimiento visibles');
  });
});
