import type { ConsoleMessage, Page, Request, Response } from "@playwright/test";

export interface HealthMonitor {
  consoleErrors: string[];
  requestFailures: string[];
  serverErrors: string[];
  detach: () => void;
}

const DEFAULT_IGNORED_CONSOLE = [
  /favicon\.ico/i,
  /chrome-extension:\/\//i,
  /ResizeObserver loop limit exceeded/i,
];

const DEFAULT_IGNORED_REQUEST_FAILURE = [
  /sockjs-node/i,
  /hot-update\.json/i,
  /analytics/i,
  /telemetry/i,
];

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function formatConsole(message: ConsoleMessage): string {
  const location = message.location();
  const suffix = location.url ? ` @ ${location.url}:${location.lineNumber}` : "";
  return `${message.type()}: ${message.text()}${suffix}`;
}

function formatRequestFailure(request: Request): string {
  const failureText = request.failure()?.errorText ?? "unknown request failure";
  return `${request.method()} ${request.url()} -> ${failureText}`;
}

function formatServerError(response: Response): string {
  return `${response.request().method()} ${response.url()} -> ${response.status()}`;
}

export function createHealthMonitor(page: Page): HealthMonitor {
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];
  const serverErrors: string[] = [];

  const onConsole = (message: ConsoleMessage): void => {
    if (message.type() !== "error") {
      return;
    }
    const formatted = formatConsole(message);
    if (!matchesAny(formatted, DEFAULT_IGNORED_CONSOLE)) {
      consoleErrors.push(formatted);
    }
  };

  const onRequestFailed = (request: Request): void => {
    const formatted = formatRequestFailure(request);
    if (!matchesAny(formatted, DEFAULT_IGNORED_REQUEST_FAILURE)) {
      requestFailures.push(formatted);
    }
  };

  const onResponse = (response: Response): void => {
    if (response.status() >= 500) {
      serverErrors.push(formatServerError(response));
    }
  };

  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  return {
    consoleErrors,
    requestFailures,
    serverErrors,
    detach: () => {
      page.off("console", onConsole);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
    },
  };
}
