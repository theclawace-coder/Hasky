import fs from "node:fs/promises";
import path from "node:path";
import type { AppMap, DiscoveredAction, DiscoveredRoute } from "./types";

function getArtifactsDir(): string {
  return process.env.E2E_ARTIFACTS_DIR ?? "e2e/artifacts";
}

function getAppMapPath(): string {
  return path.join(getArtifactsDir(), "app-map.json");
}

async function ensureArtifactsDir(): Promise<void> {
  await fs.mkdir(getArtifactsDir(), { recursive: true });
}

export async function loadOrCreateAppMap(baseURL: string): Promise<AppMap> {
  await ensureArtifactsDir();
  const appMapPath = getAppMapPath();

  try {
    const raw = await fs.readFile(appMapPath, "utf-8");
    const existing = JSON.parse(raw) as AppMap;
    if (existing.baseURL === baseURL) {
      return existing;
    }
  } catch {
    // Create a new file below.
  }

  const fresh: AppMap = {
    baseURL,
    startedAt: new Date().toISOString(),
    routes: [],
    actions: [],
    notes: [],
  };
  await fs.writeFile(appMapPath, JSON.stringify(fresh, null, 2), "utf-8");
  return fresh;
}

async function writeAppMap(appMap: AppMap): Promise<void> {
  await ensureArtifactsDir();
  await fs.writeFile(getAppMapPath(), JSON.stringify(appMap, null, 2), "utf-8");
}

export async function appendRoute(baseURL: string, route: DiscoveredRoute): Promise<void> {
  const appMap = await loadOrCreateAppMap(baseURL);
  const existingIndex = appMap.routes.findIndex((entry) => entry.url === route.url);

  if (existingIndex >= 0) {
    appMap.routes[existingIndex] = {
      ...appMap.routes[existingIndex],
      ...route,
      issues: Array.from(new Set([...(appMap.routes[existingIndex].issues ?? []), ...route.issues])),
    };
  } else {
    appMap.routes.push(route);
  }

  await writeAppMap(appMap);
}

export async function appendAction(baseURL: string, action: DiscoveredAction): Promise<void> {
  const appMap = await loadOrCreateAppMap(baseURL);
  appMap.actions.push(action);
  await writeAppMap(appMap);
}

export async function appendNote(baseURL: string, note: string): Promise<void> {
  const appMap = await loadOrCreateAppMap(baseURL);
  appMap.notes.push(note);
  await writeAppMap(appMap);
}

export async function finalizeAppMap(baseURL: string): Promise<void> {
  const appMap = await loadOrCreateAppMap(baseURL);
  appMap.finishedAt = new Date().toISOString();
  await writeAppMap(appMap);
}
