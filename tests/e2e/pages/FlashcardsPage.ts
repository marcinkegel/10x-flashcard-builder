import { Page, expect } from "@playwright/test";

/**
 * Page Object Model for Flashcards Page (Library and Creation)
 */
export class FlashcardsPage {
  constructor(private page: Page) {}

  // Locators - Library
  get libraryTitle() {
    return this.page.getByTestId("library-title");
  }

  get flashcardItems() {
    return this.page.getByTestId("flashcard-item");
  }

  // Locators - Creation
  get createButton() {
    // There might be a global "Create" button in nav or similar, 
    // but based on our flow, let's assume we go to /generate
    return this.page.locator('a[href="/generate"]');
  }

  get manualTabTrigger() {
    return this.page.getByTestId("manual-tab-trigger");
  }

  get manualFrontInput() {
    return this.page.getByTestId("manual-front-input");
  }

  get manualBackInput() {
    return this.page.getByTestId("manual-back-input");
  }

  get manualSubmitButton() {
    return this.page.getByTestId("manual-submit-button");
  }

  // Actions
  async gotoLibrary() {
    await this.page.goto("/flashcards");
  }

  async gotoCreate() {
    await this.page.goto("/generate");
  }

  async createManualFlashcard(front: string, back: string) {
    await this.manualTabTrigger.click();
    await this.manualFrontInput.fill(front);
    await this.manualBackInput.fill(back);
    await this.manualSubmitButton.click();
  }

  // Assertions
  async expectLibraryLoaded() {
    await expect(this.libraryTitle).toBeVisible();
    await expect(this.libraryTitle).toHaveText(/Moje fiszki/i);
  }

  async expectFlashcardInList(frontText: string) {
    await expect(this.flashcardItems.filter({ hasText: frontText })).toBeVisible();
  }
}
