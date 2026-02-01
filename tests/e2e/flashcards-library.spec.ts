import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { FlashcardsLibraryPage } from "./pages/FlashcardsLibraryPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { Navbar } from "./pages/Navbar";

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
    // 1. Create a unique flashcard first
    const uniqueFrontText = `EDIT_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniqueBackText = `BACK_${Date.now()}`;

    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();
    await flashcardsPage.createManualFlashcard(uniqueFrontText, uniqueBackText);

    // 2. Navigate to library
    const navbar = new Navbar(page);
    await navbar.gotoLibrary();

    const libraryPage = new FlashcardsLibraryPage(page);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 3. Find our unique flashcard
    const uniqueFlashcard = page
      .getByTestId("flashcard-item")
      .filter({ has: page.getByTestId("flashcard-front-text").filter({ hasText: uniqueFrontText }) });

    // Verify the flashcard exists
    await expect(uniqueFlashcard).toBeVisible({ timeout: 5000 });

    // 4. Hover and click edit
    await uniqueFlashcard.hover();
    const editButton = uniqueFlashcard.getByTestId("flashcard-edit-button");
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 5. Wait for edit dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 2000 });

    // 6. Edit text - add " (edited)" suffix
    const frontInput = dialog.locator("textarea, input").first();
    const backInput = dialog.locator("textarea, input").nth(1);

    const newFront = uniqueFrontText + " (edited)";
    const newBack = uniqueBackText + " (edited)";

    await frontInput.fill(newFront);
    await backInput.fill(newBack);

    // 7. Save changes
    const saveButton = dialog.getByRole("button", { name: /zapisz/i });
    await saveButton.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Wait for the API call to complete
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 8. Verify the edited flashcard is visible with new text
    const editedFlashcard = page.getByTestId("flashcard-front-text").filter({ hasText: newFront });

    await expect(editedFlashcard).toBeVisible({ timeout: 5000 });

    // 9. Reload page to verify persistence
    await page.reload();
    await libraryPage.waitForFlashcards();

    // Verify the edited flashcard still exists with new text
    const persistedFlashcard = page.getByTestId("flashcard-front-text").filter({ hasText: newFront });

    await expect(persistedFlashcard).toBeVisible({ timeout: 5000 });
  });

  test("should delete flashcard successfully", async ({ page }) => {
    // 1. Create a unique flashcard first
    const uniqueFrontText = `DELETE_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniqueBackText = `BACK_${Date.now()}`;

    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();
    await flashcardsPage.createManualFlashcard(uniqueFrontText, uniqueBackText);

    // 2. Navigate to library
    const navbar = new Navbar(page);
    await navbar.gotoLibrary();

    // Wait for network to be idle (React hydration)
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 3. Find our unique flashcard
    const uniqueFlashcard = page
      .getByTestId("flashcard-item")
      .filter({ has: page.getByTestId("flashcard-front-text").filter({ hasText: uniqueFrontText }) });

    // Verify the flashcard exists
    await expect(uniqueFlashcard).toBeVisible({ timeout: 5000 });

    // 4. Hover to show delete button and click it
    await uniqueFlashcard.hover();
    const deleteButton = uniqueFlashcard.getByTestId("flashcard-delete-button");
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // 5. Confirm deletion
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const confirmButton = dialog.getByRole("button", { name: /usuń fiszkę/i });
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    // Wait for React hydration to complete before clicking
    await page.waitForTimeout(500);
    await confirmButton.click();

    // Wait for the API call to complete
    await page.waitForLoadState("networkidle");

    // 6. Wait for the specific flashcard to disappear from the DOM
    const uniqueFlashcardLocator = page.getByTestId("flashcard-front-text").filter({ hasText: uniqueFrontText });

    await expect(uniqueFlashcardLocator).toHaveCount(0, { timeout: 5000 });
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

      // Should show link/button to create flashcards (be specific to avoid strict mode violation)
      // Use the one in the empty state, not the navbar
      const createLink = page.getByRole("link", { name: /utwórz pierwsze fiszki/i });
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
