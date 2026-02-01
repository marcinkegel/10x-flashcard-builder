import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Flashcards Library page
 */
export class FlashcardsLibraryPage {
  readonly page: Page;
  readonly flashcardItems: Locator;
  readonly flashcardsCount: Locator;
  readonly errorContainer: Locator;
  readonly retryButton: Locator;
  readonly loadingContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.flashcardItems = page.getByTestId("flashcard-item");
    this.flashcardsCount = page.getByTestId("flashcards-count");
    this.errorContainer = page.getByTestId("library-error");
    this.retryButton = page.getByTestId("retry-button");
    this.loadingContainer = page.getByTestId("library-loading");
  }

  /**
   * Navigate to flashcards library page
   */
  async goto() {
    await this.page.goto("/flashcards");
    await expect(this.page).toHaveURL(/.*flashcards/);
  }

  /**
   * Wait for flashcards to load
   */
  async waitForFlashcards(timeout = 10000) {
    await this.flashcardItems.first().waitFor({ state: "visible", timeout });
  }

  /**
   * Get number of flashcards on current page
   */
  async getFlashcardsCount(): Promise<number> {
    return await this.flashcardItems.count();
  }

  /**
   * Get total flashcards count from UI
   */
  async getTotalCount(): Promise<number> {
    const text = await this.flashcardsCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get flashcard by index
   */
  getFlashcard(index: number) {
    return new FlashcardItemPage(this.page, this.flashcardItems.nth(index));
  }

  /**
   * Check if library is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingContainer.isVisible();
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorContainer.isVisible();
  }

  /**
   * Check if library is empty
   */
  async isEmpty(): Promise<boolean> {
    const count = await this.getFlashcardsCount();
    return count === 0;
  }
}

/**
 * Page Object Model for a single flashcard item
 */
export class FlashcardItemPage {
  readonly page: Page;
  readonly container: Locator;
  readonly frontText: Locator;
  readonly backText: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page, container: Locator) {
    this.page = page;
    this.container = container;
    this.frontText = container.getByTestId("flashcard-front-text");
    this.backText = container.getByTestId("flashcard-back-text");
    this.editButton = container.getByTestId("flashcard-edit-button");
    this.deleteButton = container.getByTestId("flashcard-delete-button");
  }

  /**
   * Get front text
   */
  async getFrontText(): Promise<string> {
    return (await this.frontText.textContent()) || "";
  }

  /**
   * Get back text
   */
  async getBackText(): Promise<string> {
    return (await this.backText.textContent()) || "";
  }

  /**
   * Click edit button
   */
  async clickEdit() {
    await this.editButton.click();
  }

  /**
   * Click delete button
   */
  async clickDelete() {
    await this.deleteButton.click();
  }

  /**
   * Wait for flashcard to be visible
   */
  async waitForVisible() {
    await this.container.waitFor({ state: "visible" });
  }
}
