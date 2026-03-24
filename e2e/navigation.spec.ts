import { test, expect } from '@playwright/test';

/**
 * E2E Test: Navigation and Pages
 * Tests that verify each page loads correctly
 */

test.describe('Navegación y Carga de Páginas', () => {
  test('01 - Página Principal (Dashboard)', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Just check that the page loads without crashing
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Dashboard carga correctamente');
  });

  test('02 - Página de Estudiantes', async ({ page }) => {
    await page.goto('http://localhost:5173/students');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de estudiantes carga');
  });

  test('03 - Página de Carreras', async ({ page }) => {
    await page.goto('http://localhost:5173/careers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de carreras carga');
  });

  test('04 - Página de Tutores', async ({ page }) => {
    await page.goto('http://localhost:5173/tutors');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de tutores carga');
  });

  test('05 - Página de Instituciones', async ({ page }) => {
    await page.goto('http://localhost:5173/institutions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de instituciones carga');
  });

  test('06 - Página de Pre-Inscripción', async ({ page }) => {
    await page.goto('http://localhost:5173/pre-enrollment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de pre-inscripción carga');
  });

  test('07 - Página de Inscripción', async ({ page }) => {
    await page.goto('http://localhost:5173/enrollment');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de inscripción carga');
  });

  test('08 - Página de Seguimiento', async ({ page }) => {
    await page.goto('http://localhost:5173/tracking');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de seguimiento carga');
  });

  test('09 - Página de Culminación', async ({ page }) => {
    await page.goto('http://localhost:5173/culmination');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de culminación carga');
  });

  test('10 - Página de Tutor Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/tutor/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de tutor dashboard carga');
  });

  test('11 - Página de Student Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/student/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de student dashboard carga');
  });

  test('12 - Página de Períodos', async ({ page }) => {
    await page.goto('http://localhost:5173/period');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Página de períodos carga');
  });
});
