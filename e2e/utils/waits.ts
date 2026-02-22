import type { Page } from "@playwright/test";

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
}
