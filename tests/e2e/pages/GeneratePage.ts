import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for AI Generation page
 */
export class GeneratePage {
  readonly page: Page;
  readonly sourceTextInput: Locator;
  readonly generateButton: Locator;
  readonly validationError: Locator;
  readonly generationError: Locator;
  readonly activeProposalsWarning: Locator;
  readonly proposalItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextInput = page.getByTestId("source-text-input");
    this.generateButton = page.getByTestId("generate-button");
    this.validationError = page.getByTestId("validation-error");
    this.generationError = page.getByTestId("generation-error");
    this.activeProposalsWarning = page.getByTestId("active-proposals-warning");
    this.proposalItems = page.getByTestId("proposal-item");
  }

  /**
   * Navigate to generate page
   */
  async goto() {
    await this.page.goto("/generate");
    await expect(this.page).toHaveURL(/.*generate/);
  }

  /**
   * Fill source text
   */
  async fillSourceText(text: string) {
    await this.sourceTextInput.fill(text);
  }

  /**
   * Click generate button
   */
  async clickGenerate() {
    await this.generateButton.click();
  }

  /**
   * Wait for proposals to appear
   */
  async waitForProposals(timeout = 30000) {
    await this.proposalItems.first().waitFor({ state: "visible", timeout });
  }

  /**
   * Get number of proposals
   */
  async getProposalsCount(): Promise<number> {
    return await this.proposalItems.count();
  }

  /**
   * Get proposal by index
   */
  getProposal(index: number) {
    return new ProposalItemPage(this.page, this.proposalItems.nth(index));
  }

  /**
   * Check if generate button is disabled
   */
  async isGenerateDisabled(): Promise<boolean> {
    return await this.generateButton.isDisabled();
  }

  /**
   * Check if validation error is visible
   */
  async hasValidationError(): Promise<boolean> {
    return await this.validationError.isVisible();
  }

  /**
   * Check if generation error is visible
   */
  async hasGenerationError(): Promise<boolean> {
    return await this.generationError.isVisible();
  }

  /**
   * Get validation error text
   */
  async getValidationErrorText(): Promise<string> {
    return (await this.validationError.textContent()) || "";
  }

  /**
   * Get generation error text
   */
  async getGenerationErrorText(): Promise<string> {
    return (await this.generationError.textContent()) || "";
  }

  /**
   * Check if generating (button shows loading state)
   */
  async isGenerating(): Promise<boolean> {
    const text = await this.generateButton.textContent();
    return text?.includes("Generowanie...") || false;
  }
}

/**
 * Page Object Model for a single proposal item
 */
export class ProposalItemPage {
  readonly page: Page;
  readonly container: Locator;
  readonly frontText: Locator;
  readonly backText: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly acceptButton: Locator;
  readonly rejectButton: Locator;
  readonly editButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, container: Locator) {
    this.page = page;
    this.container = container;
    this.frontText = container.getByTestId("proposal-front-text");
    this.backText = container.getByTestId("proposal-back-text");
    this.frontInput = container.getByTestId("proposal-front-input");
    this.backInput = container.getByTestId("proposal-back-input");
    this.acceptButton = container.getByTestId("proposal-accept-button");
    this.rejectButton = container.getByTestId("proposal-reject-button");
    this.editButton = container.getByTestId("proposal-edit-button");
    this.saveButton = container.getByTestId("proposal-save-button");
    this.cancelButton = container.getByTestId("proposal-cancel-button");
    this.errorMessage = container.getByTestId("proposal-error");
  }

  /**
   * Accept proposal
   */
  async accept() {
    await this.acceptButton.click();
  }

  /**
   * Reject proposal
   */
  async reject() {
    await this.rejectButton.click();
  }

  /**
   * Click edit button
   */
  async startEdit() {
    await this.editButton.click();
  }

  /**
   * Edit proposal content
   */
  async edit(front: string, back: string) {
    await this.startEdit();
    await this.frontInput.fill(front);
    await this.backInput.fill(back);
    await this.saveButton.click();
  }

  /**
   * Cancel editing
   */
  async cancelEdit() {
    await this.cancelButton.click();
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
   * Check if proposal is in edit mode
   */
  async isEditing(): Promise<boolean> {
    return await this.frontInput.isVisible();
  }

  /**
   * Check if proposal is accepted
   */
  async isAccepted(): Promise<boolean> {
    const className = await this.container.getAttribute("class");
    return className?.includes("border-green-500") || false;
  }

  /**
   * Check if proposal is rejected
   */
  async isRejected(): Promise<boolean> {
    const className = await this.container.getAttribute("class");
    return className?.includes("border-red-500") || false;
  }
}
