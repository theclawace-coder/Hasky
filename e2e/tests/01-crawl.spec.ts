import { test, expect } from "../fixtures/audit.fixture";
import { collectInventory, crawlRoutes } from "../utils/discovery";

test("crawl: discover and visit routes, fail on hard errors", async ({ page, audit }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const routes = await crawlRoutes(page, audit.baseURL, 25);
  expect(routes.length).toBeGreaterThan(0);

  const hardFailures: string[] = [];
  for (const route of routes) {
    await audit.addRoute({
      url: `${audit.baseURL}${route.route}`,
      path: route.route,
      source: "crawl",
      title: route.title,
      status: route.status,
      visitedAt: new Date().toISOString(),
      issues: route.issues,
    });

    if ((route.status ?? 200) >= 400 || route.issues.length > 0) {
      hardFailures.push(`${route.route}: ${route.status ?? "no-status"} ${route.issues.join(", ")}`.trim());
    }
  }

  const inventory = await collectInventory(page);
  await audit.addNote(`Inventory snapshot: ${JSON.stringify(inventory)}`);

  expect(hardFailures, `Hard failures during crawl:\n${hardFailures.join("\n")}`).toEqual([]);
});
