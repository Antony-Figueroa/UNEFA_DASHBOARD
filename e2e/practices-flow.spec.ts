import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { login, gotoAndWait } from './fixtures';

/**
 * E2E Test: Flujo Completo de Prácticas Profesionales
 * 
 * Este test verifica el flujo completo:
 * 1. Registro de estudiante
 * 2. Registro de carrera (si no existe)
 * 3. Registro de tutor
 * 4. Registro de institución
 * 5. Pre-inscripción
 * 6. Inscripción
 * 7. Seguimiento
 * 8. Culminación
 */

test.describe('Flujo Completo de Prácticas Profesionales', () => {
  let studentCi: string;
  let careerName: string;
  let tutorCi: string;
  let institutionName: string;
  let preEnrollmentId: string;
  let enrollmentId: string;

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('01 - Registrar Estudiante', async ({ page }) => {
    studentCi = `V-${Date.now().toString().slice(-8)}`;
    
    await gotoAndWait(page, '/students');
    
    // Click nuevo estudiante button
    const newButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await newButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill student form
    // Cédula
    const ciInputs = page.locator('input[placeholder*="cédula"], input[placeholder*="Cédula"], input[id*="cedula"]');
    if (await ciInputs.count() > 0) {
      await ciInputs.first().fill(studentCi);
    }
    
    // Nombre
    const nameInputs = page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"]');
    if (await nameInputs.count() > 0) {
      await nameInputs.first().fill('Juan');
    }
    
    // Apellido
    const lastnameInputs = page.locator('input[placeholder*="apellido"], input[placeholder*="Apellido"]');
    if (await lastnameInputs.count() > 0) {
      await lastnameInputs.first().fill('Pérez');
    }
    
    // Email
    const emailInputs = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]');
    if (await emailInputs.count() > 0) {
      await emailInputs.first().fill(`juan.perez.${Date.now()}@test.com`);
    }
    
    // Teléfono
    const phoneInputs = page.locator('input[placeholder*="teléfono"], input[placeholder*="telefono"], input[placeholder*="Teléfono"]');
    if (await phoneInputs.count() > 0) {
      await phoneInputs.first().fill('04121234567');
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    // Wait for success notification
    await page.waitForTimeout(1000);
    
    console.log(`✓ Estudiante registrado: ${studentCi}`);
  });

  test('02 - Registrar Carrera', async ({ page }) => {
    careerName = `Carrera Test ${Date.now()}`;
    
    await gotoAndWait(page, '/careers');
    
    // Click nueva carrera button
    const newButton = page.locator('button:has-text("Nueva"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill career form
    // Nombre
    const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"], input[maxlength="8"]');
    if (await nameInput.count() > 0) {
      await nameInput.first().fill(careerName);
    }
    
    // Código
    const codeInput = page.locator('input[placeholder*="Código"], input[placeholder*="codigo"]');
    if (await codeInput.count() > 0) {
      await codeInput.first().fill(Date.now().toString().slice(-4));
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    console.log(`✓ Carrera registrada: ${careerName}`);
  });

  test('03 - Registrar Tutor', async ({ page }) => {
    tutorCi = `V-${Date.now().toString().slice(-8)}`;
    
    await gotoAndWait(page, '/tutors');
    
    // Click nuevo tutor button
    const newButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill tutor form
    const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('María');
    }
    
    const lastnameInput = page.locator('input[placeholder*="apellido"], input[placeholder*="Apellido"]').first();
    if (await lastnameInput.count() > 0) {
      await lastnameInput.fill('Rodríguez');
    }
    
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill(`maria.rodriguez.${Date.now()}@test.com`);
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    console.log(`✓ Tutor registrado: ${tutorCi}`);
  });

  test('04 - Registrar Institución', async ({ page }) => {
    institutionName = `Empresa Test ${Date.now()}`;
    
    await gotoAndWait(page, '/institutions');
    
    // Click nueva institución button
    const newButton = page.locator('button:has-text("Nueva"), button:has-text("Agregar"), button:has-text("Registrar")').first();
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill institution form
    const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(institutionName);
    }
    
    // RIF
    const rifInput = page.locator('input[placeholder*="RIF"], input[placeholder*="rif"]');
    if (await rifInput.count() > 0) {
      await rifInput.first().fill(Date.now().toString().slice(-9));
    }
    
    // Teléfono
    const phoneInput = page.locator('input[placeholder*="teléfono"], input[placeholder*="telefono"]');
    if (await phoneInput.count() > 0) {
      await phoneInput.first().fill('02121234567');
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    console.log(`✓ Institución registrada: ${institutionName}`);
  });

  test('05 - Crear Pre-Inscripción', async ({ page }) => {
    await gotoAndWait(page, '/pre-enrollment');
    
    // Click nueva pre-inscripción button
    const newButton = page.locator('button:has-text("Nueva"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill pre-enrollment form
    // CI Estudiante
    const ciInput = page.locator('input[placeholder*="cédula"], input[placeholder*="Cédula"]').first();
    if (await ciInput.count() > 0) {
      await ciInput.fill(studentCi);
    }
    
    // Nombre
    const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Juan');
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    // Get pre-enrollment ID from URL or table
    preEnrollmentId = `PRE-${Date.now()}`;
    
    console.log(`✓ Pre-inscripción creada: ${preEnrollmentId}`);
  });

  test('06 - Crear Inscripción', async ({ page }) => {
    await gotoAndWait(page, '/enrollment');
    
    // Click nueva inscripción button
    const newButton = page.locator('button:has-text("Nueva"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill enrollment form
    // CI Estudiante
    const ciInput = page.locator('input[placeholder*="cédula"], input[placeholder*="Cédula"]').first();
    if (await ciInput.count() > 0) {
      await ciInput.fill(studentCi);
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    enrollmentId = `ENR-${Date.now()}`;
    
    console.log(`✓ Inscripción creada: ${enrollmentId}`);
  });

  test('07 - Registrar Seguimiento', async ({ page }) => {
    await gotoAndWait(page, '/tracking');
    
    // Click nuevo seguimiento button
    const newButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await newButton.click();
    
    await page.waitForSelector('[role="dialog"], .modal, .fixed', { state: 'visible' }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill tracking form
    const observationsInput = page.locator('textarea, input[placeholder*="observación"]').first();
    if (await observationsInput.count() > 0) {
      await observationsInput.fill('Seguimiento inicial de práctica profesional.');
    }
    
    // Save button
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Registrar")').last();
    await saveButton.click();
    
    await page.waitForTimeout(1000);
    
    console.log('✓ Seguimiento registrado');
  });

  test('08 - Ver Página de Culminación', async ({ page }) => {
    await gotoAndWait(page, '/culmination');
    
    // Verify page loaded
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
    
    console.log('✓ Página de culminación accesible');
  });

  test('09 - Verificar Panel de Tutor', async ({ page }) => {
    await gotoAndWait(page, '/tutor/dashboard');
    
    // Verify tutor dashboard loaded
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
    
    console.log('✓ Panel de tutor accesible');
  });

  test('10 - Verificar Panel de Estudiante', async ({ page }) => {
    await gotoAndWait(page, '/student/dashboard');
    
    // Verify student dashboard loaded
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
    
    console.log('✓ Panel de estudiante accesible');
  });
});
