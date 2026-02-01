import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error");
    this.registerLink = page.getByTestId("register-link");
    this.forgotPasswordLink = page.getByTestId("forgot-password-link");
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto("/login");
    // Wait for network to be idle (ensures React is hydrated)
    await this.page.waitForLoadState("networkidle");
    // Wait for the form to be fully interactive
    await this.emailInput.waitFor({ state: "attached" });
    await this.passwordInput.waitFor({ state: "attached" });
    await expect(this.page).toHaveURL(/.*login/);
  }

  /**
   * Fill login form with credentials
   */
  async fillCredentials(email: string, password: string) {
    // Wait for inputs to be ready and visible
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Clear first then fill
    await this.emailInput.clear();
    await this.emailInput.fill(email);

    await this.passwordInput.clear();
    await this.passwordInput.fill(password);

    // Verify the values were filled correctly
    const emailValue = await this.emailInput.inputValue();
    const passwordValue = await this.passwordInput.inputValue();

    if (emailValue !== email) {
      // console.error(`Email not filled correctly. Expected: ${email}, Got: ${emailValue}`);
    }
    if (passwordValue !== password) {
      /* console.error(
        `Password not filled correctly. Expected length: ${password.length}, Got length: ${passwordValue.length}`
      ); */
    }
  }

  /**
   * Submit login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow (fill + submit)
   */
  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * Wait for successful login redirect
   */
  async waitForSuccessfulLogin() {
    await this.page.waitForURL(/\/(generate|flashcards)/, { timeout: 10000 });
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button shows loading state
   */
  async isLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes("Logowanie...") || false;
  }
}
