import { test, expect } from "../fixtures/audit.fixture";
import { isLikelyAuthScreen } from "../utils/auth";

test("logout: if control exists, user can sign out and lose authenticated session", async ({ page, audit }) => {
  test.skip(audit.role === "anonymous", "Logout requires an authenticated role.");
  test.skip(
    !audit.storageStateConfigured,
    `Role "${audit.role}" has no storage state configured. Set E2E_${audit.role.toUpperCase()}_STORAGE_STATE.`,
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });

  const logoutCandidates = [
    page.getByRole("button", { name: /log out|logout|sign out/i }),
    page.getByRole("link", { name: /log out|logout|sign out/i }),
    page.locator("[data-testid='logout'], [data-testid*='sign-out'], [data-testid*='logout']"),
  ];

  let logoutControl = null;
  for (const candidate of logoutCandidates) {
    if ((await candidate.count()) > 0) {
      logoutControl = candidate.first();
      break;
    }
  }

  test.skip(!logoutControl, "No logout control discovered in current session.");

  await logoutControl!.click();
  await page.waitForLoadState("domcontentloaded");

  const redirectedToAuth = await isLikelyAuthScreen(page);
  const hasLoginCallToAction =
    (await page.getByRole("button", { name: /log in|sign in|login/i }).count()) > 0 ||
    (await page.getByRole("link", { name: /log in|sign in|login/i }).count()) > 0;

  const outcome = redirectedToAuth || hasLoginCallToAction;
  await audit.addAction({
    route: new URL(page.url()).pathname,
    action: "logout",
    outcome: outcome ? "passed" : "failed",
    details: `redirectedToAuth=${redirectedToAuth}, hasLoginCTA=${hasLoginCallToAction}`,
    at: new Date().toISOString(),
  });

  expect(outcome, "Expected auth screen or login entrypoint after logout.").toBeTruthy();
});
