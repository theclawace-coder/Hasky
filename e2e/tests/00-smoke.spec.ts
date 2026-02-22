import { BasePage } from "../pages/BasePage";
import { test, expect } from "../fixtures/audit.fixture";
import { discoverTopLevelRoutes, visitRoute } from "../utils/discovery";

test("smoke: home loads and main navigation links do not hard-fail", async ({ page, audit }) => {
  const basePage = new BasePage(page);
  await basePage.goto("/");

  const homeTitle = await page.title();
  expect(homeTitle.trim().length).toBeGreaterThan(0);
  await audit.addNote(`Home title: ${homeTitle}`);

  const topLevelRoutes = await discoverTopLevelRoutes(page, audit.baseURL);
  expect(topLevelRoutes.length).toBeGreaterThan(0);

  for (const route of topLevelRoutes.slice(0, 12)) {
    const visit = await visitRoute(page, route);
    await audit.addRoute({
      url: route,
      path: new URL(route).pathname,
      source: "smoke:main-nav",
      title: visit.title,
      status: visit.status,
      visitedAt: new Date().toISOString(),
      issues: visit.issues,
    });

    expect(
      visit.status === undefined || visit.status < 400,
      `Expected no 4xx/5xx for ${route}, got ${visit.status ?? "unknown"}`,
    ).toBeTruthy();
  }
});
