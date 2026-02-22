import type { Page } from "@playwright/test";

export interface FormValidationResult {
  route: string;
  requiredFields: number;
  invalidFields: number;
  errorSignals: number;
}

export async function findFirstRouteWithForm(page: Page, routes: string[]): Promise<string | null> {
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    if ((await page.locator("form").count()) > 0) {
      return route;
    }
  }
  return null;
}

export async function validateRequiredFields(page: Page, route: string): Promise<FormValidationResult> {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const form = page.locator("form").first();
  await form.waitFor({ state: "visible", timeout: 10_000 });

  const required = form.locator(
    "input[required], select[required], textarea[required], [aria-required='true']",
  );
  const requiredCount = await required.count();

  const submit = form.locator(
    "button[type='submit'], input[type='submit'], button:has-text('Submit'), button:has-text('Save'), button:has-text('Continue')",
  );
  if ((await submit.count()) > 0) {
    await submit.first().click();
  } else {
    await form.evaluate((element) => {
      const formEl = element as HTMLFormElement;
      formEl.requestSubmit();
    });
  }

  const invalidFields = await form.evaluate((element) => {
    const formEl = element as HTMLFormElement;
    return formEl.querySelectorAll(":invalid, [aria-invalid='true']").length;
  });

  const errorSignals = await page
    .locator(
      "[role='alert'], [aria-live='assertive'], .error, .invalid, [data-testid*='error'], [data-invalid='true']",
    )
    .count();

  return {
    route,
    requiredFields: requiredCount,
    invalidFields,
    errorSignals,
  };
}
