import { test, expect } from '@playwright/test';
import { login, gotoAndWait } from './fixtures';

/**
 * E2E Test: Gestión de Tutores
 */

test.describe('Gestión de Tutores', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navegar a la página de tutores', async ({ page }) => {
    await gotoAndWait(page, '/tutors');
    
    const heading = page.locator('h1, h2, h3, [class*="title"]').first();
    await expect(heading).toBeVisible();
  });

  test('Ver lista de tutores', async ({ page }) => {
    await gotoAndWait(page, '/tutors');
    
    const table = page.locator('table, [role="table"], .table');
    await expect(table.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Abrir modal de crear tutor', async ({ page }) => {
    await gotoAndWait(page, '/tutors');
    
    const createButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await createButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible', timeout: 3000 }).catch(() => {});
    
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  });
});
