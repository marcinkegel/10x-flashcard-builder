import { Page } from "@playwright/test";

export class Navbar {
  constructor(private page: Page) {}

  get generateLink() {
    return this.page.getByTestId("nav-generate-desktop").or(this.page.getByTestId("nav-generate-mobile"));
  }

  get libraryLink() {
    return this.page.getByTestId("nav-library-desktop").or(this.page.getByTestId("nav-library-mobile"));
  }

  async gotoGenerate() {
    await this.generateLink.click();
  }

  async gotoLibrary() {
    await this.libraryLink.click();
  }
}
