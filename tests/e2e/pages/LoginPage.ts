import { Page } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * Encapsulates login page interactions for maintainable tests
 */
export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    return this.page.getByTestId("login-email-input");
  }

  get passwordInput() {
    return this.page.getByTestId("login-password-input");
  }

  get submitButton() {
    return this.page.getByTestId("login-submit-button");
  }

  get errorMessage() {
    return this.page.locator('[role="alert"]');
  }

  // Actions
  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL(/.*flashcards/);
  }

  // Assertions
  async expectToBeVisible() {
    await this.emailInput.isVisible();
    await this.passwordInput.isVisible();
    await this.submitButton.isVisible();
  }
}
