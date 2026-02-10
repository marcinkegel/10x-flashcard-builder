import { type Page, type Locator, expect } from "@playwright/test";

export class LearningSessionPage {
  readonly page: Page;

  // Navigation
  readonly sessionLink: Locator;

  // Loading states
  readonly loadingSkeleton: Locator;

  // Empty state
  readonly emptyStateMessage: Locator;
  readonly generateFirstButton: Locator;
  readonly backToLibraryButton: Locator;

  // Error state
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  // Session Header
  readonly sessionHeader: Locator;
  readonly cardCounter: Locator;
  readonly repeatPhaseIndicator: Locator;
  readonly exitButton: Locator;

  // Progress bar
  readonly progressBar: Locator;

  // Study Card
  readonly studyCard: Locator;
  readonly cardFrontLabel: Locator;
  readonly cardBackLabel: Locator;
  readonly cardFrontText: Locator;
  readonly cardBackText: Locator;
  readonly flipHint: Locator;

  // Session Controls
  readonly showAnswerButton: Locator;
  readonly repeatButton: Locator;
  readonly knownButton: Locator;

  // Session Summary
  readonly summaryContainer: Locator;
  readonly summaryTitle: Locator;
  readonly totalCardsValue: Locator;
  readonly accuracyValue: Locator;
  readonly totalRepeatsValue: Locator;
  readonly newSessionButton: Locator;
  readonly backToLibraryFromSummaryButton: Locator;

  // Keyboard shortcuts hint (footer)
  readonly keyboardHintsFooter: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.sessionLink = page.getByTestId("nav-session-desktop").or(page.getByTestId("nav-session-mobile"));

    // Loading states - use data-testid for reliable detection
    this.loadingSkeleton = page.getByTestId("session-loading-skeleton");

    // Empty state
    this.emptyStateMessage = page.getByText("Twoja biblioteka jest pusta");
    this.generateFirstButton = page.getByTestId("session-generate-first-button");
    this.backToLibraryButton = page.getByTestId("session-back-to-library-button");

    // Error state
    this.errorMessage = page.getByText("Wystąpił problem");
    this.retryButton = page.getByTestId("session-retry-button");

    // Session Header
    this.sessionHeader = page.locator("header").filter({ hasText: /karta|powtórka/i });
    this.cardCounter = page.locator("text=/Karta \\d+ z \\d+/");
    this.repeatPhaseIndicator = page.getByText("Powtórka kart");
    this.exitButton = page.getByTestId("session-exit-button");

    // Progress bar
    this.progressBar = page.getByTestId("session-progress-bar");

    // Study Card
    this.studyCard = page.locator("div[role='button']").filter({ has: page.getByText(/FRONT|TYŁ/i) });
    this.cardFrontLabel = page.getByText("FRONT");
    this.cardBackLabel = page.getByText("TYŁ");
    this.cardFrontText = page
      .locator("p")
      .filter({ has: page.locator("..").filter({ has: page.getByText("FRONT") }) })
      .nth(1);
    this.cardBackText = page
      .locator("p")
      .filter({ has: page.locator("..").filter({ has: page.getByText("TYŁ") }) })
      .nth(1);
    this.flipHint = page.getByText("Kliknij, aby odwrócić");

    // Session Controls - use data-testid for reliability
    this.showAnswerButton = page.getByTestId("session-show-answer-button");
    this.repeatButton = page.getByTestId("session-repeat-button");
    this.knownButton = page.getByTestId("session-known-button");

    // Session Summary
    this.summaryContainer = page.locator("div").filter({ hasText: "Świetna robota!" });
    this.summaryTitle = page.getByRole("heading", { name: /świetna robota/i });
    this.totalCardsValue = page.locator("p").filter({ hasText: /^\d+$/ }).first();
    this.accuracyValue = page.locator("p").filter({ hasText: /^\d+%$/ });
    this.totalRepeatsValue = page
      .locator("div")
      .filter({ has: page.locator("[class*='text-orange']") })
      .locator("span")
      .filter({ hasText: /^\d+$/ });
    this.newSessionButton = page.getByTestId("session-new-session-button");
    this.backToLibraryFromSummaryButton = page.getByTestId("session-back-to-library-button");

    // Keyboard shortcuts hint
    this.keyboardHintsFooter = page.locator("footer").filter({ hasText: /spacja/i });
  }

  async goto() {
    await this.page.goto("/session");
    // Wait for either loading skeleton to appear or content to load
    await this.page.waitForTimeout(500);
  }

  async gotoFromNavbar() {
    await this.sessionLink.click();
    await this.page.waitForURL(/.*session/);
  }

  async waitForLoading() {
    // Try to catch loading state, but don't fail if it's too fast
    await this.loadingSkeleton.isVisible().catch(() => false);
  }

  async waitForLoadingComplete() {
    // Wait for skeleton to disappear (with generous timeout)
    await expect(this.loadingSkeleton).not.toBeVisible({ timeout: 15000 });
  }

  async waitForCardLoaded() {
    await expect(this.studyCard).toBeVisible({ timeout: 5000 });
    await expect(this.cardFrontLabel).toBeVisible();
    // Wait for React hydration to complete
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(300);
  }

  async isEmptyState(): Promise<boolean> {
    return await this.emptyStateMessage.isVisible().catch(() => false);
  }

  async isErrorState(): Promise<boolean> {
    return await this.errorMessage.isVisible().catch(() => false);
  }

  async isCardFlipped(): Promise<boolean> {
    const backVisible = await this.cardBackLabel.isVisible().catch(() => false);
    return backVisible;
  }

  async flipCard() {
    await this.studyCard.waitFor({ state: "visible" });
    await this.studyCard.click({ timeout: 10000 });
    // Wait for flip animation
    await this.page.waitForTimeout(600);
  }

  async pressSpace() {
    await this.page.keyboard.press("Space");
    await this.page.waitForTimeout(600);
  }

  async pressKey1() {
    await this.page.keyboard.press("1");
    await this.page.waitForTimeout(300);
  }

  async pressKey2() {
    await this.page.keyboard.press("2");
    await this.page.waitForTimeout(300);
  }

  async clickShowAnswer() {
    await this.showAnswerButton.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
    await this.showAnswerButton.click({ timeout: 10000 });
    await this.page.waitForTimeout(600);
  }

  async clickRepeat() {
    // Wait for React hydration and animations to complete
    await this.repeatButton.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
    await this.repeatButton.click({ timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async clickKnown() {
    // Wait for React hydration and animations to complete
    await this.knownButton.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
    await this.knownButton.click({ timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async getCardCounter(): Promise<string> {
    return (await this.cardCounter.textContent()) || "";
  }

  async isRepeatPhase(): Promise<boolean> {
    return await this.repeatPhaseIndicator.isVisible().catch(() => false);
  }

  async getProgressBarWidth(): Promise<string> {
    const width = await this.progressBar.evaluate((el) => {
      return (el as HTMLElement).style.width;
    });

    return width || "0%";
  }

  async isSessionFinished(): Promise<boolean> {
    return await this.summaryTitle.isVisible().catch(() => false);
  }

  async getTotalCards(): Promise<number> {
    const text = await this.totalCardsValue.textContent();
    return parseInt(text || "0", 10);
  }

  async getAccuracy(): Promise<number> {
    const text = await this.accuracyValue.textContent();
    return parseInt(text?.replace("%", "") || "0", 10);
  }

  async getTotalRepeats(): Promise<number> {
    const text = await this.totalRepeatsValue.textContent();
    return parseInt(text || "0", 10);
  }

  async clickNewSession() {
    await this.page.waitForLoadState("networkidle");
    await this.newSessionButton.click({ timeout: 10000 });
    await this.page.waitForTimeout(500);
  }

  async clickExit() {
    // Click exit button in header (available during active session)
    await this.page.waitForLoadState("networkidle");
    await this.exitButton.click({ timeout: 10000 });
  }

  async clickBackToLibrary() {
    // Try summary button first, then fallback to empty/error state button
    await this.page.waitForLoadState("networkidle");
    const summaryButton = await this.backToLibraryFromSummaryButton.isVisible().catch(() => false);
    if (summaryButton) {
      await this.backToLibraryFromSummaryButton.click({ timeout: 10000 });
    } else {
      // Fallback for empty/error state
      await this.backToLibraryButton.click({ timeout: 10000 });
    }
  }

  async expectShowAnswerButtonVisible() {
    await expect(this.showAnswerButton).toBeVisible();
  }

  async expectControlButtonsVisible() {
    await expect(this.repeatButton).toBeVisible();
    await expect(this.knownButton).toBeVisible();
  }

  async expectControlButtonsNotVisible() {
    await expect(this.repeatButton).not.toBeVisible();
    await expect(this.knownButton).not.toBeVisible();
  }

  async expectCardFrontVisible() {
    await expect(this.cardFrontLabel).toBeVisible();
    await expect(this.flipHint).toBeVisible();
  }

  async expectCardBackVisible() {
    await expect(this.cardBackLabel).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyStateMessage).toBeVisible();
    await expect(this.generateFirstButton).toBeVisible();
  }

  async expectSummaryVisible() {
    await expect(this.summaryTitle).toBeVisible();
    await expect(this.newSessionButton).toBeVisible();
    await expect(this.backToLibraryFromSummaryButton).toBeVisible();
  }

  async completeSessionWithoutRepeats() {
    // Complete all cards by marking them as "known"
    let iterations = 0;
    const maxIterations = 20; // Safety limit

    while (!(await this.isSessionFinished()) && iterations < maxIterations) {
      await this.waitForCardLoaded();
      await this.flipCard();
      await this.clickKnown();
      iterations++;
    }

    if (iterations >= maxIterations) {
      throw new Error("Session did not finish after maximum iterations");
    }
  }

  async completeCardSequence(sequence: ("known" | "repeat")[]): Promise<void> {
    for (const action of sequence) {
      await this.waitForCardLoaded();
      await this.flipCard();

      if (action === "known") {
        await this.clickKnown();
      } else {
        await this.clickRepeat();
      }

      // Break if session is finished
      if (await this.isSessionFinished()) {
        break;
      }
    }
  }
}
