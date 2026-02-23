import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

async function loadDotEnv(file = ".env") {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const lines = raw.split(/\r?\n/);
    const parsed = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const index = trimmed.indexOf("=");
      if (index <= 0) {
        continue;
      }
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      parsed[key] = value;
    }

    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional.
  }
}

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function getRolesToGenerate() {
  const argRoles = getArg("roles");
  if (argRoles) {
    return argRoles
      .split(",")
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["basic", "admin"];
}

function requiredEnv(name) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

async function ensureDirectoryForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function sanitizePath(pathname) {
  const parsed = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return parsed.replace(/\/+$/, "") || "/";
}

function buildRoleConfig(role) {
  const upper = role.toUpperCase();
  const defaultStorage = `e2e/.auth/${role}.json`;
  return {
    role,
    email: requiredEnv(`E2E_${upper}_EMAIL`),
    password: requiredEnv(`E2E_${upper}_PASSWORD`),
    storagePath: process.env[`E2E_${upper}_STORAGE_STATE`] ?? defaultStorage,
  };
}

async function fillLoginForm(page, { email, password }) {
  const emailField = page.locator("input[type='email'], input[name='email'], input[autocomplete='email']").first();
  const passwordField = page
    .locator("input[type='password'], input[name='password'], input[autocomplete='current-password']")
    .first();
  const submitButton = page
    .locator(
      "form button[type='submit'], form input[type='submit'], button:has-text('Sign in'), button:has-text('Log in'), button:has-text('Login')",
    )
    .first();

  await emailField.waitFor({ state: "visible", timeout: 15_000 });
  await passwordField.waitFor({ state: "visible", timeout: 15_000 });
  await emailField.fill(email);
  await passwordField.fill(password);
  const authResponsePromise = page
    .waitForResponse(
      (response) => response.url().includes("/auth/v1/token") && response.request().method() === "POST",
      { timeout: 20_000 },
    )
    .catch(() => null);
  await submitButton.click();
  const authResponse = await authResponsePromise;
  if (!authResponse) {
    return null;
  }

  let body = "";
  try {
    body = await authResponse.text();
  } catch {
    // Best effort.
  }

  return {
    status: authResponse.status(),
    body: body.slice(0, 400),
  };
}

async function waitForAuthSuccess(page, loginPath, authResponse) {
  const loginPathClean = sanitizePath(loginPath);
  const successHints = (process.env.E2E_AUTH_SUCCESS_PATH_HINTS ?? "/dashboard,/onboarding,/home,/admin,/settings")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => sanitizePath(entry));

  await page.waitForLoadState("domcontentloaded");

  const loginEscaped = loginPathClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const successRegex = new RegExp(`^(?!.*${loginEscaped}).*$`, "i");

  try {
    await page.waitForURL(successRegex, { timeout: 20_000 });
  } catch {
    const current = new URL(page.url());
    const matchedHint = successHints.some((hint) => current.pathname.startsWith(hint));
    if (!matchedHint) {
      const errorSignals = page.locator(
        "[role='alert'], [role='status'], .error, [data-testid*='error'], [data-sonner-toast]",
      );
      const textError = page.getByText(/invalid|failed|incorrect/i).first();
      const hasErrorSignals = (await errorSignals.count()) > 0;
      const hasTextError = (await textError.count()) > 0;
      const errorText = hasErrorSignals
        ? await errorSignals.first().textContent()
        : hasTextError
          ? await textError.textContent()
          : null;
      throw new Error(
        `Auth did not transition away from login. Current path: ${current.pathname}. ${
          errorText ? `Error: ${errorText}` : "No explicit UI error captured."
        }${authResponse ? ` Auth API status: ${authResponse.status}. Body: ${authResponse.body}` : ""}`,
      );
    }
  }
}

async function verifyAuthenticated(page) {
  const verifyPath = sanitizePath(process.env.E2E_AUTH_VERIFY_PATH ?? "/dashboard");
  await page.goto(verifyPath, { waitUntil: "domcontentloaded" });
  const currentPath = new URL(page.url()).pathname;
  const loginPath = sanitizePath(process.env.E2E_AUTH_LOGIN_PATH ?? "/login");
  if (currentPath.startsWith(loginPath)) {
    throw new Error(`Authentication verification failed: redirected back to ${currentPath}.`);
  }
}

async function generateForRole(browser, baseURL, loginPath, roleConfig) {
  if (!roleConfig.email || !roleConfig.password) {
    throw new Error(
      `Missing credentials for role "${roleConfig.role}". Set E2E_${roleConfig.role.toUpperCase()}_EMAIL and E2E_${roleConfig.role.toUpperCase()}_PASSWORD.`,
    );
  }

  await ensureDirectoryForFile(roleConfig.storagePath);
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto(loginPath, { waitUntil: "domcontentloaded" });
    const authResponse = await fillLoginForm(page, roleConfig);
    await waitForAuthSuccess(page, loginPath, authResponse);
    await verifyAuthenticated(page);
    await context.storageState({ path: roleConfig.storagePath });
    console.log(`[auth-state] ${roleConfig.role}: wrote ${roleConfig.storagePath}`);
  } finally {
    await context.close();
  }
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isUrlReady(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Timed out waiting for app server at ${url}`);
}

async function startServerIfConfigured(baseURL) {
  const command = process.env.E2E_AUTH_START_COMMAND?.trim() || process.env.E2E_START_COMMAND?.trim();
  if (!command) {
    return null;
  }

  const logs = [];
  const child = spawn(command, {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  const pushLogs = (chunk) => {
    const text = chunk.toString();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }
      logs.push(line);
      if (logs.length > 80) {
        logs.shift();
      }
    }
  };

  child.stdout?.on("data", pushLogs);
  child.stderr?.on("data", pushLogs);

  try {
    await waitForUrl(baseURL);
    return { child, logs };
  } catch (error) {
    const lines = logs.slice(-20).join("\n");
    const message = error instanceof Error ? error.message : String(error);
    stopServer({ child });
    throw new Error(`${message}\n[server-startup-logs]\n${lines}`);
  }
}

function stopServer(server) {
  const child = server?.child;
  if (!child || child.killed) {
    return;
  }
  try {
    child.kill("SIGTERM");
  } catch {
    // Best-effort cleanup.
  }
}

async function main() {
  await loadDotEnv();

  const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
  const loginPath = sanitizePath(process.env.E2E_AUTH_LOGIN_PATH ?? "/login");
  const requestedRoles = getRolesToGenerate();
  const validRoles = requestedRoles.filter((role) => role === "basic" || role === "admin");

  if (validRoles.length === 0) {
    throw new Error('No valid roles requested. Use --roles=basic,admin or set roles accordingly.');
  }

  const browser = await chromium.launch({ headless: true });
  const server = await startServerIfConfigured(baseURL);
  let failures = 0;

  try {
    for (const role of validRoles) {
      const config = buildRoleConfig(role);
      try {
        await generateForRole(browser, baseURL, loginPath, config);
      } catch (error) {
        failures += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[auth-state] ${role}: ${message}`);
      }
    }
  } finally {
    stopServer(server);
    await browser.close();
  }

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
