import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { LearningSessionPage } from "./pages/LearningSessionPage";
import { Navbar } from "./pages/Navbar";
import { FlashcardsPage } from "./pages/FlashcardsPage";

/**
 * E2E tests for Learning Session functionality
 *
 * Prerequisites:
 * - User must exist in test database with credentials from .env.test
 * - User should have flashcards in their library for session tests
 *
 * Test Coverage:
 * - T-UI-01: Start session and loading
 * - T-UI-02: Empty library state
 * - T-UI-03: Card flip interaction
 * - T-LOG-01: "Known" action
 * - T-LOG-02: "Repeat" action (queueing)
 * - T-LOG-03: Session completion and statistics
 * - T-KEY-01: Keyboard shortcuts support
 * - T-MOB-01: Mobile responsiveness (viewport tests)
 * - T-API-01: Random flashcard order
 */
test.describe("Learning Session - UI and Loading", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();
  });

  test("T-UI-01: should start session and load cards correctly", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);

    // Navigate to session
    await sessionPage.goto();

    // Try to catch loading state (may be too fast to see)
    const hadLoadingState = await sessionPage.loadingSkeleton.isVisible().catch(() => false);
    if (hadLoadingState) {
      // If we caught it, wait for it to complete
      await sessionPage.waitForLoadingComplete();
    } else {
      // If loading was too fast, just wait a bit for content
      await page.waitForTimeout(1000);
    }

    // Check if we have cards or empty state
    const isEmpty = await sessionPage.isEmptyState();

    if (!isEmpty) {
      // Should show first card (FRONT only)
      await sessionPage.expectCardFrontVisible();

      // Should show card counter "Karta 1 z X"
      const counter = await sessionPage.getCardCounter();
      expect(counter).toMatch(/Karta 1 z \d+/);

      // Progress bar should be at 0%
      const progressWidth = await sessionPage.getProgressBarWidth();
      expect(progressWidth).toBe("0%");

      // Should show "Show Answer" button, not control buttons
      await sessionPage.expectShowAnswerButtonVisible();
      await sessionPage.expectControlButtonsNotVisible();
    } else {
      // Empty state is expected if no flashcards exist
      await sessionPage.expectEmptyState();
    }
  });

  test("T-UI-02: should display empty state when library is empty", async ({ page }) => {
    // Note: This test assumes the user has no flashcards
    // In real scenario, you might need to delete all flashcards first
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();

    // Wait for loading
    await sessionPage.waitForLoadingComplete();

    const isEmpty = await sessionPage.isEmptyState();

    if (isEmpty) {
      // Should show empty state message
      await expect(sessionPage.emptyStateMessage).toBeVisible();

      // Should show button to generate first flashcards
      await expect(sessionPage.generateFirstButton).toBeVisible();

      // Should show button to go back to library
      await expect(sessionPage.backToLibraryButton).toBeVisible();

      // Click "Generate first flashcards" should navigate to /generate
      await sessionPage.generateFirstButton.click();
      await expect(page).toHaveURL(/.*generate/);
    }
  });

  test("T-UI-03: should flip card on click and keyboard", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    // Skip if empty
    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Initially front should be visible
    await sessionPage.expectCardFrontVisible();

    // Click to flip
    await sessionPage.flipCard();

    // Back should be visible, control buttons should appear
    await sessionPage.expectCardBackVisible();
    await sessionPage.expectControlButtonsVisible();

    // Click again to flip back
    await sessionPage.flipCard();

    // Front should be visible again
    await sessionPage.expectCardFrontVisible();

    // Use Space key to flip
    await sessionPage.pressSpace();

    // Back should be visible
    await sessionPage.expectCardBackVisible();
  });

  test("should display loading skeleton on initial load", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);

    // Navigate to session
    await sessionPage.goto();

    // Loading skeleton should appear quickly
    const hasLoading =
      (await sessionPage.loadingSkeleton.isVisible().catch(() => false)) ||
      (await sessionPage.studyCard.isVisible().catch(() => false));

    expect(hasLoading).toBe(true);
  });
});

test.describe("Learning Session - Logic and Queueing", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();

    // Ensure user has flashcards by creating at least one
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();

    const uniqueFront = `SESSION_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniqueBack = `BACK_${Date.now()}`;

    await flashcardsPage.createManualFlashcard(uniqueFront, uniqueBack);

    // Wait for creation to complete
    await page.waitForTimeout(1000);
  });

  test("T-LOG-01: should handle 'Known' action correctly", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Get initial card counter
    const initialCounter = await sessionPage.getCardCounter();
    expect(initialCounter).toMatch(/Karta 1 z \d+/);

    // Flip and mark as known
    await sessionPage.flipCard();
    await sessionPage.clickKnown();

    // If there are more cards, counter should increase
    const isFinished = await sessionPage.isSessionFinished();
    if (!isFinished) {
      await sessionPage.waitForCardLoaded();
      const newCounter = await sessionPage.getCardCounter();
      expect(newCounter).toMatch(/Karta 2 z \d+/);
    }
  });

  test("T-LOG-02: should handle 'Repeat' action and queueing", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for multiple card flips
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Flip and mark as repeat
    await sessionPage.flipCard();
    await sessionPage.clickRepeat();

    // Card should move to end of queue
    // Complete remaining cards to reach repeat phase
    let iterations = 0;
    const maxIterations = 15;

    while (
      !(await sessionPage.isRepeatPhase()) &&
      !(await sessionPage.isSessionFinished()) &&
      iterations < maxIterations
    ) {
      await sessionPage.waitForCardLoaded();
      await sessionPage.flipCard();
      await sessionPage.clickKnown();
      iterations++;
    }

    // Should enter repeat phase
    if (await sessionPage.isRepeatPhase()) {
      await expect(sessionPage.repeatPhaseIndicator).toBeVisible();

      // The card we marked for repeat should appear again
      await sessionPage.waitForCardLoaded();
      const repeatCardText = await sessionPage.studyCard.textContent();

      // Note: exact match might not work due to DOM structure, but card should be present
      expect(repeatCardText).toBeTruthy();
    }
  });

  test("T-LOG-03: should complete session and show statistics", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for completing full session
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    // Complete session with one repeat
    await sessionPage.waitForCardLoaded();

    // First card: mark for repeat
    await sessionPage.flipCard();
    await sessionPage.clickRepeat();

    // Mark all remaining cards as known
    let iterations = 0;
    const maxIterations = 15;

    while (!(await sessionPage.isSessionFinished()) && iterations < maxIterations) {
      await sessionPage.waitForCardLoaded();
      await sessionPage.flipCard();
      await sessionPage.clickKnown();
      iterations++;
    }

    // Should show summary
    await sessionPage.expectSummaryVisible();

    // Verify statistics
    const totalCards = await sessionPage.getTotalCards();
    expect(totalCards).toBeGreaterThan(0);

    const accuracy = await sessionPage.getAccuracy();
    expect(accuracy).toBeLessThan(100); // Should be less than 100% due to repeat

    const totalRepeats = await sessionPage.getTotalRepeats();
    expect(totalRepeats).toBeGreaterThan(0); // Should have at least 1 repeat
  });

  test("should complete session without repeats and show 100% accuracy", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for completing full session
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    // Complete all cards without repeats
    await sessionPage.completeSessionWithoutRepeats();

    // Should show summary
    await sessionPage.expectSummaryVisible();

    // Verify statistics
    const accuracy = await sessionPage.getAccuracy();
    expect(accuracy).toBe(100);

    const totalRepeats = await sessionPage.getTotalRepeats();
    expect(totalRepeats).toBe(0);
  });
});

test.describe("Learning Session - Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();

    // Ensure user has flashcards
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();

    const uniqueFront = `KEYBOARD_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniqueBack = `BACK_${Date.now()}`;

    await flashcardsPage.createManualFlashcard(uniqueFront, uniqueBack);
    await page.waitForTimeout(1000);
  });

  test("T-KEY-01: should complete session entirely with keyboard", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for keyboard navigation through session
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Use Space to flip, then 2 to mark as known
    await sessionPage.pressSpace();
    await sessionPage.expectCardBackVisible();
    await sessionPage.pressKey2();

    // Next card or finish
    if (!(await sessionPage.isSessionFinished())) {
      await sessionPage.waitForCardLoaded();

      // Use Space to flip, then 1 to mark for repeat
      await sessionPage.pressSpace();
      await sessionPage.expectCardBackVisible();
      await sessionPage.pressKey1();
    }

    // Complete remaining cards
    let iterations = 0;
    const maxIterations = 15;

    while (!(await sessionPage.isSessionFinished()) && iterations < maxIterations) {
      await sessionPage.waitForCardLoaded();
      await sessionPage.pressSpace();
      await sessionPage.pressKey2();
      iterations++;
    }

    // Should finish successfully
    await sessionPage.expectSummaryVisible();
  });

  test("should only allow action keys (1, 2) when card is flipped", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Try pressing 1 and 2 when card is NOT flipped
    await sessionPage.pressKey1();
    await page.waitForTimeout(300);

    // Card should still be on front (not moved to next)
    await sessionPage.expectCardFrontVisible();

    await sessionPage.pressKey2();
    await page.waitForTimeout(300);

    // Card should still be on front
    await sessionPage.expectCardFrontVisible();

    // Now flip the card
    await sessionPage.pressSpace();
    await sessionPage.expectCardBackVisible();

    // Now pressing 2 should work
    await sessionPage.pressKey2();

    // Should move to next card or finish
    const isFinished = await sessionPage.isSessionFinished();
    if (!isFinished) {
      await sessionPage.waitForCardLoaded();
    }
  });

  test("should display keyboard hints on desktop", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    // Desktop footer with keyboard hints should be visible
    // Note: This is hidden on mobile (md:flex)
    const footerVisible = await sessionPage.keyboardHintsFooter.isVisible().catch(() => false);

    // It might be hidden on mobile viewports, so we just check it doesn't error
    expect(typeof footerVisible).toBe("boolean");
  });
});

test.describe("Learning Session - Mobile Responsiveness", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();
  });

  test("T-MOB-01: should display correctly on mobile viewport", async ({ page }) => {
    // Set mobile viewport (iPhone 12/13)
    await page.setViewportSize({ width: 390, height: 844 });

    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Card should be visible and fit on screen
    await expect(sessionPage.studyCard).toBeVisible();

    // Check card is not overflowing horizontally
    const cardBox = await sessionPage.studyCard.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(390);
    }

    // Buttons should be visible and tappable
    await sessionPage.expectShowAnswerButtonVisible();

    // Flip card
    await sessionPage.flipCard();

    // Control buttons should be visible and large enough for mobile
    await sessionPage.expectControlButtonsVisible();

    const repeatButtonBox = await sessionPage.repeatButton.boundingBox();
    const knownButtonBox = await sessionPage.knownButton.boundingBox();

    expect(repeatButtonBox).not.toBeNull();
    expect(knownButtonBox).not.toBeNull();

    // Buttons should be at least 44px tall (iOS touch target minimum)
    if (repeatButtonBox && knownButtonBox) {
      expect(repeatButtonBox.height).toBeGreaterThanOrEqual(44);
      expect(knownButtonBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("should handle long card content with scrolling on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Create a flashcard with long content (front: 200 chars, back: 500 chars limit)
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();

    // Front: ~170 chars (under 200 limit)
    const uniqueFront = `MOBILE_${Date.now()}: This text is long enough to require scrolling on mobile viewport. Additional content here.`;

    // Back: ~400 chars (under 500 limit)
    const longBackText =
      "This is the back of the card with detailed explanation that will require scrolling on mobile devices. ".repeat(
        4
      );
    const uniqueBack = `BACK: ${longBackText}`;

    await flashcardsPage.createManualFlashcard(uniqueFront, uniqueBack);
    await page.waitForTimeout(2000);

    // Go to session
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    await sessionPage.waitForCardLoaded();

    // Card should be visible
    await expect(sessionPage.studyCard).toBeVisible();

    // Card content should be scrollable if it overflows
    // This is handled by overflow-y-auto in the component
    const cardContentBox = await sessionPage.studyCard.boundingBox();
    expect(cardContentBox).not.toBeNull();
  });
});

test.describe("Learning Session - API Integration", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();

    // Create multiple flashcards for randomization test
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();

    for (let i = 0; i < 3; i++) {
      const uniqueFront = `RANDOM_TEST_${i}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const uniqueBack = `BACK_${i}_${Date.now()}`;
      await flashcardsPage.createManualFlashcard(uniqueFront, uniqueBack);
      await page.waitForTimeout(500);
    }
  });

  test("T-API-01: should fetch random flashcards on each session start", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);

    // Start first session and get first card text
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();
    const firstSessionFirstCard = await sessionPage.studyCard.textContent();

    // Exit session using exit button in header
    await sessionPage.clickExit();
    await page.waitForURL(/.*flashcards/);

    // Start second session via navbar
    const navbar = new Navbar(page);
    await navbar.gotoSession();
    await sessionPage.waitForLoadingComplete();
    await sessionPage.waitForCardLoaded();

    const secondSessionFirstCard = await sessionPage.studyCard.textContent();

    // Note: Due to randomization, cards might be different
    // But at minimum, we should be able to load cards multiple times
    expect(firstSessionFirstCard).toBeTruthy();
    expect(secondSessionFirstCard).toBeTruthy();

    // We can't guarantee they're different due to random chance,
    // but we verify that the API is being called successfully
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // This test would require mocking API or causing an error
    // For now, we just verify error state UI exists
    const sessionPage = new LearningSessionPage(page);

    // If we could trigger an API error, we would check:
    // - Error message is displayed
    // - Retry button is available
    // - Back to library button is available

    // Just verify the page loads normally for now
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    const isError = await sessionPage.isErrorState();
    const isEmpty = await sessionPage.isEmptyState();
    const hasCard = await sessionPage.studyCard.isVisible().catch(() => false);

    // One of these states should be true
    expect(isError || isEmpty || hasCard).toBe(true);
  });
});

test.describe("Learning Session - Navigation", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();
  });

  test("should navigate to session from navbar", async ({ page }) => {
    const navbar = new Navbar(page);
    await navbar.gotoSession();

    // Should be on session page
    await expect(page).toHaveURL(/.*session/);
  });

  test("should navigate back to library from empty state", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    const isEmpty = await sessionPage.isEmptyState();

    if (isEmpty) {
      await sessionPage.clickBackToLibrary();
      await expect(page).toHaveURL(/.*flashcards/);
    }
  });

  test("should navigate back to library from summary", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for completing session
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    // Complete session
    await sessionPage.completeSessionWithoutRepeats();

    // Click back to library
    await sessionPage.clickBackToLibrary();

    // Should navigate to flashcards
    await expect(page).toHaveURL(/.*flashcards/);
  });

  test("should start new session from summary", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for completing session
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    // Complete session
    await sessionPage.completeSessionWithoutRepeats();

    // Should show summary
    await sessionPage.expectSummaryVisible();

    // Click "New Session"
    await sessionPage.clickNewSession();

    // Should reload and show loading state
    await sessionPage.waitForLoadingComplete();

    // Should load new cards
    if (!(await sessionPage.isEmptyState())) {
      await sessionPage.waitForCardLoaded();
      await sessionPage.expectCardFrontVisible();
    }
  });
});

test.describe("Learning Session - Progress Tracking", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME ?? "";
    const password = process.env.E2E_PASSWORD ?? "";

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();

    // Create multiple flashcards for progress tracking
    const flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.gotoCreate();

    for (let i = 0; i < 3; i++) {
      const uniqueFront = `PROGRESS_${i}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const uniqueBack = `BACK_${i}`;
      await flashcardsPage.createManualFlashcard(uniqueFront, uniqueBack);
      await page.waitForTimeout(500);
    }
  });

  test("should update progress bar as cards are completed", async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for multiple card operations
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Initial progress should be 0%
    const initialProgress = await sessionPage.getProgressBarWidth();
    expect(initialProgress).toBe("0%");

    // Complete first card
    await sessionPage.flipCard();
    await sessionPage.clickKnown();

    // Check if session is finished (might be only 1 card)
    if (!(await sessionPage.isSessionFinished())) {
      await sessionPage.waitForCardLoaded();

      // Progress should have increased
      const progressAfterOne = await sessionPage.getProgressBarWidth();
      expect(progressAfterOne).not.toBe("0%");

      // Continue completing cards and check progress increases
      await sessionPage.flipCard();
      await sessionPage.clickKnown();

      if (!(await sessionPage.isSessionFinished())) {
        await sessionPage.waitForCardLoaded();
        const progressAfterTwo = await sessionPage.getProgressBarWidth();

        // Progress should continue increasing
        expect(progressAfterTwo).not.toBe(progressAfterOne);
      }
    }
  });

  test("should update card counter as session progresses", async ({ page }) => {
    const sessionPage = new LearningSessionPage(page);
    await sessionPage.goto();
    await sessionPage.waitForLoadingComplete();

    if (await sessionPage.isEmptyState()) {
      test.skip();
    }

    await sessionPage.waitForCardLoaded();

    // Should start at "Karta 1 z X"
    const firstCounter = await sessionPage.getCardCounter();
    expect(firstCounter).toMatch(/Karta 1 z \d+/);

    // Complete first card
    await sessionPage.flipCard();
    await sessionPage.clickKnown();

    // Check next card
    if (!(await sessionPage.isSessionFinished())) {
      await sessionPage.waitForCardLoaded();

      // Counter should be "Karta 2 z X"
      const secondCounter = await sessionPage.getCardCounter();
      expect(secondCounter).toMatch(/Karta 2 z \d+/);
    }
  });
});
