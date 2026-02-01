import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { FlashcardsLibraryPage } from "./pages/FlashcardsLibraryPage";

/**
 * E2E tests for Flashcards Library
 *
 * Prerequisites:
 * - User must exist in test database with credentials from .env.test
 * - User should have some flashcards already created
 */
test.describe("Flashcards Library", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();
  });

  test("should display flashcards library correctly", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if we have flashcards or empty state
    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;
    const isEmpty = await libraryPage.isEmpty();

    // One of these should be true
    expect(hasFlashcards || isEmpty).toBe(true);
  });

  test("should display flashcard count when flashcards exist", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    // Wait for library to load
    await page.waitForTimeout(1000);

    // If we have flashcards, count should be visible
    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;

    if (hasFlashcards) {
      await expect(libraryPage.flashcardsCount).toBeVisible();
      const totalCount = await libraryPage.getTotalCount();
      expect(totalCount).toBeGreaterThan(0);
    }
  });

  test("should display flashcard front and back text", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    // Wait for flashcards to load
    await page.waitForTimeout(1000);

    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;

    if (hasFlashcards) {
      // Get first flashcard
      const firstFlashcard = libraryPage.getFlashcard(0);

      // Verify front and back text are visible and not empty
      const frontText = await firstFlashcard.getFrontText();
      const backText = await firstFlashcard.getBackText();

      expect(frontText.length).toBeGreaterThan(0);
      expect(backText.length).toBeGreaterThan(0);
    }
  });

  test("should show edit and delete buttons on flashcard hover", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    await page.waitForTimeout(1000);

    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;

    if (hasFlashcards) {
      const firstFlashcard = libraryPage.getFlashcard(0);

      // Hover over flashcard
      await firstFlashcard.container.hover();

      // Buttons should be visible (or always visible on mobile)
      await expect(firstFlashcard.editButton).toBeVisible();
      await expect(firstFlashcard.deleteButton).toBeVisible();
    }
  });

  test("should open edit dialog when clicking edit button", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    await page.waitForTimeout(1000);

    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;

    if (hasFlashcards) {
      const firstFlashcard = libraryPage.getFlashcard(0);

      // Click edit button
      await firstFlashcard.clickEdit();

      // Dialog should appear
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 2000 });

      // Close dialog by clicking cancel or X
      const cancelButton = page.getByRole("button", { name: /anuluj/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });

  test("should open delete confirmation dialog when clicking delete button", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    // Wait for network to be idle (React hydration)
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;

    if (hasFlashcards) {
      const firstFlashcard = libraryPage.getFlashcard(0);

      // Wait for delete button to be ready
      await expect(firstFlashcard.deleteButton).toBeVisible();
      await expect(firstFlashcard.deleteButton).toBeEnabled();

      // Click delete button
      await firstFlashcard.clickDelete();

      // Confirmation dialog should appear
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Verify dialog contains delete confirmation text
      const dialogText = await dialog.textContent();
      expect(dialogText).toMatch(/(usuń|usunąć)/i);

      // Close dialog by clicking cancel
      const cancelButton = page.getByRole("button", { name: /anuluj/i });
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Wait for dialog to close
      await expect(dialog).not.toBeVisible({ timeout: 2000 });
    }
  });

  test("should edit flashcard successfully", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    await page.waitForTimeout(1000);

    const hasFlashcards = (await libraryPage.getFlashcardsCount()) > 0;

    if (hasFlashcards) {
      const firstFlashcard = libraryPage.getFlashcard(0);

      // Get original text
      const originalFront = await firstFlashcard.getFrontText();
      const originalBack = await firstFlashcard.getBackText();

      // Open edit dialog
      await firstFlashcard.clickEdit();

      // Wait for dialog
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 2000 });

      // Find input fields in dialog
      const frontInput = dialog.locator("textarea, input").first();
      const backInput = dialog.locator("textarea, input").nth(1);

      // Edit text - add " (edited)" suffix
      const newFront = originalFront + " (edited)";
      const newBack = originalBack + " (edited)";

      await frontInput.fill(newFront);
      await backInput.fill(newBack);

      // Save changes
      const saveButton = dialog.getByRole("button", { name: /zapisz/i });
      await saveButton.click();

      // Wait for dialog to close
      await expect(dialog).not.toBeVisible({ timeout: 5000 });

      // Verify changes were applied (optimistic update)
      await page.waitForTimeout(500);
      const updatedFront = await firstFlashcard.getFrontText();
      expect(updatedFront).toContain("(edited)");
    }
  });

  test("should delete flashcard successfully", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    // Wait for network to be idle (React hydration)
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const initialCount = await libraryPage.getFlashcardsCount();

    if (initialCount > 0) {
      const firstFlashcard = libraryPage.getFlashcard(0);

      // Wait for delete button to be ready
      await expect(firstFlashcard.deleteButton).toBeVisible();
      await expect(firstFlashcard.deleteButton).toBeEnabled();

      // Click delete button
      await firstFlashcard.clickDelete();

      // Confirm deletion - use alertdialog role for AlertDialog component
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Find the confirm button with the exact text
      const confirmButton = dialog.getByRole("button", { name: /usuń fiszkę/i });
      await expect(confirmButton).toBeVisible();
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();

      // Wait for dialog to close
      await expect(dialog).not.toBeVisible({ timeout: 5000 });

      // Wait for optimistic update
      await page.waitForTimeout(1000);

      // Verify flashcard was removed
      // Either count decreased or we see empty state (if it was the last one)
      const newCount = await libraryPage.getFlashcardsCount();
      const isEmpty = await libraryPage.isEmpty();

      expect(newCount < initialCount || isEmpty).toBe(true);
    }
  });

  test("should handle empty library state", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    await page.waitForTimeout(1000);

    const isEmpty = await libraryPage.isEmpty();

    if (isEmpty) {
      // Should show empty state message
      const emptyStateText = await page.textContent("body");
      expect(emptyStateText).toMatch(/(brak|nie masz|empty)/i);

      // Should show link/button to create flashcards
      const createLink = page.getByRole("link", { name: /(utwórz|generuj|dodaj)/i });
      await expect(createLink).toBeVisible();
    }
  });

  test("should navigate to generate page from library", async ({ page }) => {
    const libraryPage = new FlashcardsLibraryPage(page);
    await libraryPage.goto();

    // Look for navigation link to generate page
    // This could be in navbar or in empty state
    const generateLink = page.getByRole("link", { name: /(generuj|utwórz nowe)/i });

    if (await generateLink.isVisible()) {
      await generateLink.click();

      // Verify we're on generate page
      await expect(page).toHaveURL(/.*generate/);
    }
  });
});
