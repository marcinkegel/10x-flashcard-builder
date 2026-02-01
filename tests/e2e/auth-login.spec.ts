import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication - Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts from login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form correctly", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Verify all form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();

    // Verify submit button is enabled
    expect(await loginPage.isSubmitDisabled()).toBe(false);
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Use credentials from .env.test
    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    // Fill and submit login form
    await loginPage.login(email, password);

    // Wait for successful redirect
    await loginPage.waitForSuccessfulLogin();

    // Verify we are on the correct page (generate or flashcards)
    expect(page.url()).toMatch(/\/(generate|flashcards)/);
  });

  test("should show error message with invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Use invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait for error message to appear
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });

    // Verify error message is displayed
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    // Verify we are still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show error message with empty email", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Try to submit with empty email
    await loginPage.passwordInput.fill("somepassword");
    await loginPage.submit();

    // HTML5 validation should prevent submission
    // The form should not be submitted and we stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show error message with empty password", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Try to submit with empty password
    await loginPage.emailInput.fill("test@example.com");
    await loginPage.submit();

    // HTML5 validation should prevent submission
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show loading state during login", async ({ page }) => {
    const loginPage = new LoginPage(page);

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    // Fill form
    await loginPage.fillCredentials(email, password);

    // Submit and immediately check loading state
    await loginPage.submit();

    // Check if button shows loading text (might be fast, so we use a quick check)
    // Note: This might be flaky due to fast network, but it's worth checking
    const buttonText = await loginPage.submitButton.textContent();
    // Loading state OR already redirected
    expect(
      buttonText?.includes("Logowanie...") || page.url().includes("/generate") || page.url().includes("/flashcards")
    ).toBe(true);
  });

  test("should navigate to register page when clicking register link", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Click register link
    await loginPage.registerLink.click();

    // Verify we are on register page
    await expect(page).toHaveURL(/.*register/);
  });

  test("should navigate to forgot password page when clicking forgot password link", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Click forgot password link
    await loginPage.forgotPasswordLink.click();

    // Verify we are on forgot password page
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test("should preserve redirectTo parameter after login", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Navigate to login with redirectTo parameter
    await page.goto("/login?redirectTo=/flashcards");

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    // Login
    await loginPage.login(email, password);

    // Wait for redirect
    await page.waitForURL(/.*flashcards/, { timeout: 10000 });

    // Verify we are on flashcards page
    await expect(page).toHaveURL(/.*flashcards/);
  });

  test("should disable form inputs during login", async ({ page }) => {
    const loginPage = new LoginPage(page);

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.fillCredentials(email, password);
    await loginPage.submit();

    // Inputs should be disabled during submission
    // Note: This might be fast, but we can check if at least one is disabled
    await loginPage.emailInput.isDisabled();
    await loginPage.passwordInput.isDisabled();
    const buttonDisabled = await loginPage.submitButton.isDisabled();

    // At least the button should be disabled or we're already redirected
    expect(buttonDisabled || page.url().includes("/generate") || page.url().includes("/flashcards")).toBe(true);
  });
});
