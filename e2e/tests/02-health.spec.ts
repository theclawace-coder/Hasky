import { test, expect } from "../fixtures/audit.fixture";
import { discoverTopLevelRoutes } from "../utils/discovery";

test("health: console and network should stay clean during navigation", async ({ page, audit, health }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const routes = await discoverTopLevelRoutes(page, audit.baseURL);

  for (const route of routes.slice(0, 8)) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  }

  await audit.addAction({
    route: new URL(page.url()).pathname,
    action: "console/network health scan",
    outcome: health.consoleErrors.length === 0 && health.requestFailures.length === 0 && health.serverErrors.length === 0 ? "passed" : "failed",
    details: JSON.stringify({
      consoleErrors: health.consoleErrors,
      requestFailures: health.requestFailures,
      serverErrors: health.serverErrors,
    }),
    at: new Date().toISOString(),
  });

  expect(health.consoleErrors, `Console errors:\n${health.consoleErrors.join("\n")}`).toEqual([]);
  expect(health.requestFailures, `Request failures:\n${health.requestFailures.join("\n")}`).toEqual([]);
  expect(health.serverErrors, `Server errors:\n${health.serverErrors.join("\n")}`).toEqual([]);
});
