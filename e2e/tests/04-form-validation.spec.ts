import { test, expect } from "../fixtures/audit.fixture";
import { discoverTopLevelRoutes } from "../utils/discovery";
import { findFirstRouteWithForm, validateRequiredFields } from "../utils/form";

test("form validation: required-field behavior is enforced on at least one form", async ({ page, audit }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const candidates = await discoverTopLevelRoutes(page, audit.baseURL);
  const routeWithForm = await findFirstRouteWithForm(page, ["/", ...candidates].slice(0, 14));

  test.skip(!routeWithForm, "No forms found in sampled routes.");

  const result = await validateRequiredFields(page, routeWithForm!);
  await audit.addAction({
    route: new URL(routeWithForm!, audit.baseURL).pathname,
    action: "required-field validation",
    outcome: result.invalidFields > 0 || result.errorSignals > 0 ? "passed" : "failed",
    details: JSON.stringify(result),
    at: new Date().toISOString(),
  });

  expect(result.requiredFields, "Expected at least one required field in sampled form.").toBeGreaterThan(0);
  expect(
    result.invalidFields > 0 || result.errorSignals > 0,
    `No validation signal detected: ${JSON.stringify(result)}`,
  ).toBeTruthy();
});
