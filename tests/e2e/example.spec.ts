import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Flashcard Builder/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click on login link/button
    await page.click('text=Login');
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });
});
