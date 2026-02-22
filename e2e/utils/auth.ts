import type { Page } from "@playwright/test";
import { discoverTopLevelRoutes } from "./discovery";

const AUTH_ROUTE_HINT = /login|log[-_ ]?in|signin|sign[-_ ]?in|signup|sign[-_ ]?up|register|reset|forgot|auth/i;
const PROTECTED_ROUTE_HINT = /dashboard|account|profile|settings|admin|workspace|portal|app/i;

export interface AuthDiscovery {
  authRoutes: string[];
  protectedRoutes: string[];
}

export async function discoverAuthAndProtectedRoutes(page: Page, baseURL: string): Promise<AuthDiscovery> {
  const topLevelRoutes = await discoverTopLevelRoutes(page, baseURL);
  const authRoutes = topLevelRoutes.filter((route) => AUTH_ROUTE_HINT.test(route));
  const protectedRoutes = topLevelRoutes.filter((route) => PROTECTED_ROUTE_HINT.test(route));

  return { authRoutes, protectedRoutes };
}

export async function isLikelyAuthScreen(page: Page): Promise<boolean> {
  const current = page.url();
  if (AUTH_ROUTE_HINT.test(current)) {
    return true;
  }

  const authSignals = await Promise.all([
    page.getByRole("button", { name: /log in|sign in|sign up|register|reset password/i }).count(),
    page.getByLabel(/email|username|password/i).count(),
    page.locator("form").count(),
  ]);

  return authSignals[0] > 0 && authSignals[1] > 0 && authSignals[2] > 0;
}
