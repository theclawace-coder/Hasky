import type { AriaRole, Locator, Page } from "@playwright/test";

type Scope = Page | Locator;

interface RoleCandidate {
  role: AriaRole;
  name?: string | RegExp;
}

export interface LocatorCandidates {
  testIds?: string[];
  roles?: RoleCandidate[];
  labels?: Array<string | RegExp>;
  css?: string[];
}

async function firstExisting(locators: Locator[]): Promise<Locator | null> {
  for (const locator of locators) {
    if ((await locator.count()) > 0) {
      return locator.first();
    }
  }
  return null;
}

export async function locate(scope: Scope, candidates: LocatorCandidates, context = "element"): Promise<Locator | null> {
  if (candidates.testIds?.length) {
    const byTestId = candidates.testIds.map((testId) => scope.getByTestId(testId));
    const found = await firstExisting(byTestId);
    if (found) {
      return found;
    }
  }

  if (candidates.roles?.length) {
    const byRole = candidates.roles.map((candidate) => scope.getByRole(candidate.role, { name: candidate.name }));
    const found = await firstExisting(byRole);
    if (found) {
      return found;
    }
  }

  if (candidates.labels?.length) {
    const byLabel = candidates.labels.map((label) => scope.getByLabel(label));
    const found = await firstExisting(byLabel);
    if (found) {
      return found;
    }
  }

  if (candidates.css?.length) {
    const byCss = candidates.css.map((css) => scope.locator(css));
    const found = await firstExisting(byCss);
    if (found) {
      // CSS fallback is less stable than semantic selectors.
      console.warn(`[selector-warning] CSS fallback used for ${context}`);
      return found;
    }
  }

  return null;
}
