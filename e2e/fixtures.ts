import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Helper functions for UNEFA Dashboard E2E tests
 */

export type { Page };

/**
 * Login helper - assumes we're on signin page
 */
export async function login(page: Page, username = 'admin', password = 'admin123') {
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
  
  await emailInput.fill(username);
  await passwordInput.fill(password);
  
  // Submit
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a page and wait for it to load
 */
export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
