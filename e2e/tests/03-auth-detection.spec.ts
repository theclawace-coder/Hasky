import { test, expect } from "../fixtures/audit.fixture";
import { discoverAuthAndProtectedRoutes, isLikelyAuthScreen } from "../utils/auth";

test("auth detection: protected routes should redirect or block when unauthenticated", async ({
  browser,
  page,
  audit,
}) => {
  test.skip(audit.role !== "anonymous", "Auth detection is only executed in anonymous role.");

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const { authRoutes, protectedRoutes } = await discoverAuthAndProtectedRoutes(page, audit.baseURL);

  test.skip(authRoutes.length === 0 || protectedRoutes.length === 0, "No auth/protected route signals discovered.");

  const unauthContext = await browser.newContext({ baseURL: audit.baseURL });
  const probe = await unauthContext.newPage();
  const enforcementHits: string[] = [];
  const misses: string[] = [];

  for (const route of protectedRoutes.slice(0, 6)) {
    const response = await probe.goto(route, { waitUntil: "domcontentloaded" });
    const status = response?.status();
    const blockedByStatus = status === 401 || status === 403;
    const redirectedToAuth = await isLikelyAuthScreen(probe);

    if (blockedByStatus || redirectedToAuth) {
      enforcementHits.push(route);
    } else {
      misses.push(route);
    }

    await audit.addRoute({
      url: route,
      path: new URL(route).pathname,
      source: "auth-detection",
      title: await probe.title(),
      status,
      visitedAt: new Date().toISOString(),
      issues: blockedByStatus || redirectedToAuth ? [] : ["No auth gate detected for likely protected route"],
    });
  }

  await unauthContext.close();

  await audit.addAction({
    route: "/",
    action: "protected-route auth gate check",
    outcome: enforcementHits.length > 0 ? "passed" : "failed",
    details: `enforced=${enforcementHits.length}, missed=${misses.length}`,
    at: new Date().toISOString(),
  });

  expect(
    enforcementHits.length,
    `No auth gating detected. Candidate routes without gating:\n${misses.join("\n")}`,
  ).toBeGreaterThan(0);
});
