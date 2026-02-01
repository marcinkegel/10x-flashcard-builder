import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { Navbar } from "./pages/Navbar";

test.describe("Flashcard Creation and Library Management", () => {
  let loginPage: LoginPage;
  let flashcardsPage: FlashcardsPage;
  let navbar: Navbar;

  const TEST_USER_EMAIL = process.env.E2E_USERNAME!;
  const TEST_USER_PASSWORD = process.env.E2E_PASSWORD!;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    flashcardsPage = new FlashcardsPage(page);
    navbar = new Navbar(page);

    // Ensure we are logged in before each test
    await loginPage.goto();
    await loginPage.login(TEST_USER_EMAIL, TEST_USER_PASSWORD);

    // Wait a bit for any error messages or navigation
    await page.waitForTimeout(2000);

    // Check if there's an error message (login failed)
    const errorVisible = await page
      .locator('[role="alert"]')
      .isVisible()
      .catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('[role="alert"]').textContent();
      throw new Error(`Login failed with error: ${errorText}`);
    }

    // Check if still on login page
    if (page.url().includes("/login")) {
      // Take a screenshot for debugging
      await page.screenshot({ path: "test-results/login-stuck.png", fullPage: true });
      throw new Error("Still on login page after login attempt. Login may have failed silently.");
    }

    // We expect to be redirected to /generate by default or we can navigate via navbar
    await page.waitForURL(/\/generate|flashcards/, { timeout: 10000 });
  });

  test("should create a flashcard manually and see it in the library", async ({ page }) => {
    const frontText = `E2E Front ${Date.now()}`;
    const backText = `E2E Back ${Date.now()}`;

    // 1. Go to creation page (if not already there)
    await flashcardsPage.gotoCreate();

    // 2. Create a flashcard manually
    await flashcardsPage.createManualFlashcard(frontText, backText);

    // 3. Navigate to library
    await navbar.gotoLibrary();
    await page.waitForURL(/\/flashcards/);

    // 4. Verify flashcard is in the library
    await flashcardsPage.expectLibraryLoaded();
    await flashcardsPage.expectFlashcardInList(frontText);
  });
});
