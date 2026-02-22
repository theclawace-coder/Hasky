import type { Page } from "@playwright/test";

export interface TableExerciseResult {
  found: boolean;
  actionsRun: string[];
}

export interface ModalExerciseResult {
  found: boolean;
  opened: boolean;
  closed: boolean;
  focusStayedInsideDialog?: boolean;
}

export async function exerciseTableControls(page: Page): Promise<TableExerciseResult> {
  const actionsRun: string[] = [];
  const table = page.locator("table, [role='table'], [role='grid']").first();

  if ((await table.count()) === 0) {
    return { found: false, actionsRun };
  }

  const searchInput = page
    .locator(
      "input[type='search'], [role='searchbox'], input[placeholder*='search' i], input[placeholder*='filter' i]",
    )
    .first();
  if ((await searchInput.count()) > 0) {
    await searchInput.fill("playwright-audit-probe");
    actionsRun.push("search/filter input filled");
  }

  const sortControl = page
    .locator("th button, [role='columnheader'] button, [aria-sort], [data-testid*='sort']")
    .first();
  if ((await sortControl.count()) > 0) {
    await sortControl.click();
    actionsRun.push("sort control clicked");
  }

  const nextControl = page
    .locator("button:has-text('Next'), a:has-text('Next'), [aria-label*='next' i], [data-testid*='next']")
    .first();
  if ((await nextControl.count()) > 0 && (await nextControl.isEnabled())) {
    await nextControl.click();
    actionsRun.push("pagination next clicked");
  }

  return { found: true, actionsRun };
}

async function activeElementInsideDialog(page: Page, dialogSelector: string): Promise<boolean> {
  return page.evaluate((selector) => {
    const dialog = document.querySelector(selector);
    return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement));
  }, dialogSelector);
}

export async function exerciseModal(page: Page): Promise<ModalExerciseResult> {
  const trigger = page
    .locator(
      "[aria-haspopup='dialog'], [data-testid*='modal-trigger'], [data-testid*='open-modal'], [data-testid*='dialog-trigger']",
    )
    .first();

  if ((await trigger.count()) === 0) {
    return { found: false, opened: false, closed: false };
  }

  await trigger.click();
  const dialogSelector = "[role='dialog'], [aria-modal='true']";
  const dialog = page.locator(dialogSelector).first();
  if ((await dialog.count()) === 0) {
    return { found: true, opened: false, closed: false };
  }

  await dialog.waitFor({ state: "visible", timeout: 5_000 });
  await page.keyboard.press("Tab");
  const focusStayedInsideDialog = await activeElementInsideDialog(page, dialogSelector);

  const closeControl = dialog
    .locator(
      "button:has-text('Close'), [aria-label*='close' i], [data-testid*='close'], [data-testid*='cancel']",
    )
    .first();
  if ((await closeControl.count()) > 0) {
    await closeControl.click();
  } else {
    await page.keyboard.press("Escape");
  }

  const closed = (await dialog.count()) === 0 || !(await dialog.isVisible());
  return {
    found: true,
    opened: true,
    closed,
    focusStayedInsideDialog,
  };
}
