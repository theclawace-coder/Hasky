import { expect, test as base } from "@playwright/test";
import { appendAction, appendNote, appendRoute, finalizeAppMap, loadOrCreateAppMap } from "../utils/appMap";
import { createHealthMonitor, type HealthMonitor } from "../utils/network";
import type { DiscoveredAction, DiscoveredRoute } from "../utils/types";

type AuditHelpers = {
  baseURL: string;
  role: "anonymous" | "basic" | "admin" | "unknown";
  authenticated: boolean;
  storageStateConfigured: boolean;
  addRoute: (route: DiscoveredRoute) => Promise<void>;
  addAction: (action: DiscoveredAction) => Promise<void>;
  addNote: (note: string) => Promise<void>;
};

type AuditFixtures = {
  audit: AuditHelpers;
  health: HealthMonitor;
};

const test = base.extend<AuditFixtures>({
  audit: async ({ baseURL }, use, testInfo) => {
    const resolvedBaseURL = baseURL ?? process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
    const metadata = (testInfo.project.metadata ?? {}) as Record<string, unknown>;
    const roleValue = String(metadata.role ?? "anonymous").toLowerCase();
    const role = roleValue === "basic" || roleValue === "admin" || roleValue === "anonymous" ? roleValue : "unknown";
    const authenticated = Boolean(metadata.authenticated);
    const storageStateConfigured = Boolean(metadata.storageStateConfigured);

    await loadOrCreateAppMap(resolvedBaseURL);

    await use({
      baseURL: resolvedBaseURL,
      role,
      authenticated,
      storageStateConfigured,
      addRoute: async (route) => appendRoute(resolvedBaseURL, route),
      addAction: async (action) => appendAction(resolvedBaseURL, action),
      addNote: async (note) => appendNote(resolvedBaseURL, note),
    });

    await finalizeAppMap(resolvedBaseURL);
  },
  health: async ({ page }, use) => {
    const monitor = createHealthMonitor(page);
    await use(monitor);
    monitor.detach();
  },
});

export { expect, test };
