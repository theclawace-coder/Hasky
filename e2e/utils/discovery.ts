import type { Page } from "@playwright/test";
import type { VisitResult } from "./types";

function toRoutePath(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function normalizeHref(baseURL: string, href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return null;
  }
  if (trimmed.startsWith("javascript:")) {
    return null;
  }

  try {
    const resolved = new URL(trimmed, baseURL);
    const base = new URL(baseURL);

    if (resolved.origin !== base.origin) {
      return null;
    }

    if (
      resolved.pathname.match(
        /\.(png|jpg|jpeg|svg|gif|webp|pdf|zip|rar|7z|doc|docx|xls|xlsx|mp4|mp3|json|xml|txt)$/i,
      )
    ) {
      return null;
    }

    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

export async function discoverTopLevelRoutes(page: Page, baseURL: string): Promise<string[]> {
  const hrefs = await page.evaluate(() => {
    const selectors = [
      "header a[href]",
      "nav a[href]",
      "aside a[href]",
      "[role='navigation'] a[href]",
      "main a[href]",
    ];
    const links = selectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLAnchorElement>(selector)));
    return links.map((link) => link.getAttribute("href") ?? "").filter(Boolean);
  });

  const set = new Set<string>();
  for (const href of hrefs) {
    const normalized = normalizeHref(baseURL, href);
    if (normalized) {
      set.add(normalized);
    }
  }
  return Array.from(set);
}

export async function discoverRoutesFromPage(page: Page, baseURL: string, maxLinks = 40): Promise<string[]> {
  const hrefs = await page.evaluate((limit) => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .map((link) => link.getAttribute("href") ?? "")
      .filter(Boolean);
    return links.slice(0, limit);
  }, maxLinks);

  const set = new Set<string>();
  for (const href of hrefs) {
    const normalized = normalizeHref(baseURL, href);
    if (normalized) {
      set.add(normalized);
    }
  }
  return Array.from(set);
}

export async function visitRoute(page: Page, route: string): Promise<VisitResult> {
  const issues: string[] = [];

  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);

  const status = response?.status();
  const title = await page.title();

  if (typeof status === "number" && status >= 400) {
    issues.push(`HTTP ${status}`);
  }
  if (/error|exception|not found|unavailable/i.test(title)) {
    issues.push(`Suspicious title: ${title}`);
  }

  return {
    route,
    title,
    status,
    issues,
  };
}

export async function crawlRoutes(page: Page, baseURL: string, maxRoutes = 25): Promise<VisitResult[]> {
  const visited = new Set<string>();
  const queue: string[] = [];
  const results: VisitResult[] = [];

  const seed = await discoverTopLevelRoutes(page, baseURL);
  const current = page.url();
  if (current) {
    queue.push(current);
  }
  queue.push(...seed);

  while (queue.length > 0 && visited.size < maxRoutes) {
    const route = queue.shift();
    if (!route || visited.has(route)) {
      continue;
    }
    visited.add(route);

    const result = await visitRoute(page, route);
    results.push(result);

    const found = await discoverRoutesFromPage(page, baseURL, 25);
    for (const nextRoute of found) {
      if (!visited.has(nextRoute) && queue.length + visited.size < maxRoutes * 2) {
        queue.push(nextRoute);
      }
    }
  }

  return results.map((result) => ({
    ...result,
    route: toRoutePath(result.route),
  }));
}

export async function collectInventory(page: Page): Promise<Record<string, number>> {
  const [forms, modals, tables, uploads, toasts] = await Promise.all([
    page.locator("form").count(),
    page.locator("[role='dialog'], [aria-modal='true']").count(),
    page.locator("table, [role='table'], [role='grid']").count(),
    page.locator("input[type='file']").count(),
    page.locator("[role='alert'], [role='status'], [data-testid*='toast'], [class*='toast']").count(),
  ]);

  return { forms, modals, tables, uploads, toasts };
}
