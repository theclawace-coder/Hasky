import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const artifactsDir = process.env.E2E_ARTIFACTS_DIR ?? "e2e/artifacts";
const roles = (process.env.E2E_ROLES ?? "anonymous")
  .split(",")
  .map((role) => role.trim().toLowerCase())
  .filter(Boolean);

const validRoles = new Set(["anonymous", "basic", "admin"]);

function resolveStorageState(role: string): string | undefined {
  if (role === "basic") {
    return process.env.E2E_BASIC_STORAGE_STATE;
  }
  if (role === "admin") {
    return process.env.E2E_ADMIN_STORAGE_STATE;
  }
  return undefined;
}

const projects = roles
  .filter((role) => validRoles.has(role))
  .map((role) => {
    const storageState = resolveStorageState(role);
    return {
      name: `chromium-${role}`,
      use: {
        ...devices["Desktop Chrome"],
        ...(storageState ? { storageState } : {}),
      },
      metadata: {
        role,
        authenticated: role !== "anonymous" && Boolean(storageState),
        storageStateConfigured: Boolean(storageState),
      },
    };
  });

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: `${artifactsDir}/test-results`,
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: `${artifactsDir}/html-report` }],
    ["json", { outputFile: `${artifactsDir}/results.json` }],
    ["./e2e/reporters/AuditSummaryReporter.ts"],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    testIdAttribute: "data-testid",
  },
  projects: projects.length > 0 ? projects : [{ name: "chromium-anonymous", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_START_COMMAND
    ? {
        command: process.env.E2E_START_COMMAND,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
