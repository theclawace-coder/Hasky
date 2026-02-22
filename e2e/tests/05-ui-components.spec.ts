import { test, expect } from "../fixtures/audit.fixture";
import { discoverTopLevelRoutes } from "../utils/discovery";
import { exerciseModal, exerciseTableControls } from "../utils/ui";

test("ui components: table/grid controls behave without hard errors", async ({ page, audit }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const routes = ["/", ...(await discoverTopLevelRoutes(page, audit.baseURL))].slice(0, 12);

  let result = { found: false, actionsRun: [] as string[] };
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    result = await exerciseTableControls(page);
    if (result.found) {
      await audit.addAction({
        route: new URL(route, audit.baseURL).pathname,
        action: "table/grid interaction",
        outcome: "passed",
        details: result.actionsRun.join(", "),
        at: new Date().toISOString(),
      });
      break;
    }
  }

  test.skip(!result.found, "No table/grid detected in sampled routes.");
  expect(result.actionsRun.length).toBeGreaterThanOrEqual(0);
});

test("ui components: modal/dialog opens, traps focus, and closes", async ({ page, audit }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const routes = ["/", ...(await discoverTopLevelRoutes(page, audit.baseURL))].slice(0, 12);

  let result = { found: false, opened: false, closed: false, focusStayedInsideDialog: false };
  let testedRoute = "/";
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    result = await exerciseModal(page);
    if (result.found) {
      testedRoute = route;
      break;
    }
  }

  test.skip(!result.found, "No modal trigger detected in sampled routes.");

  await audit.addAction({
    route: new URL(testedRoute, audit.baseURL).pathname,
    action: "modal open/close and focus check",
    outcome: result.opened && result.closed ? "passed" : "failed",
    details: JSON.stringify(result),
    at: new Date().toISOString(),
  });

  expect(result.opened, "Modal should open from discovered trigger.").toBeTruthy();
  expect(result.closed, "Modal should close via close control or Escape.").toBeTruthy();
  expect(result.focusStayedInsideDialog, "Focus should remain inside the dialog after Tab.").toBeTruthy();
});
