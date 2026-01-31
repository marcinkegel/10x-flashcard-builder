import { Page } from "@playwright/test";

export class Navbar {
  constructor(private page: Page) {}

  get generateLink() {
    return this.page.getByTestId("nav-generate");
  }

  get libraryLink() {
    return this.page.getByTestId("nav-library");
  }

  async gotoGenerate() {
    await this.generateLink.click();
  }

  async gotoLibrary() {
    await this.libraryLink.click();
  }
}
