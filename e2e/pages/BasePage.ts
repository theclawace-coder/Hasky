import type { Locator, Page } from "@playwright/test";
import { locate } from "../utils/locators";
import { waitForPageReady } from "../utils/waits";

export class BasePage {
  constructor(private readonly page: Page) {}

  async goto(path = "/"): Promise<void> {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
    await waitForPageReady(this.page);
  }

  async getPrimaryNavLinks(): Promise<Locator> {
    return this.page.locator(
      "header a[href], nav a[href], aside a[href], [role='navigation'] a[href]",
    );
  }

  async clickNavigationByName(name: string | RegExp): Promise<boolean> {
    const target = await locate(
      this.page,
      {
        testIds: ["main-nav-link"],
        roles: [{ role: "link", name }],
        css: ["header a", "nav a", "aside a"],
      },
      "navigation link",
    );

    if (!target) {
      return false;
    }

    await target.click();
    await waitForPageReady(this.page);
    return true;
  }
}
