import fs from "node:fs/promises";
import path from "node:path";
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError } from "@playwright/test/reporter";

interface SummaryFailure {
  id: string;
  title: string;
  file: string;
  severity: "blocker" | "major" | "minor";
  error?: string;
}

interface Summary {
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  baseURL?: string;
  projects: string[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  failures: SummaryFailure[];
}

interface AppMapRoute {
  path?: string;
  status?: number;
  title?: string;
  issues?: string[];
}

interface AppMapAction {
  route?: string;
  action?: string;
  outcome?: "passed" | "failed" | "skipped";
  details?: string;
}

interface AppMap {
  routes?: AppMapRoute[];
  actions?: AppMapAction[];
}

class AuditSummaryReporter implements Reporter {
  private startTime = 0;
  private artifactsDir = "e2e/artifacts";
  private suite?: Suite;
  private config?: FullConfig;

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    this.artifactsDir = process.env.E2E_ARTIFACTS_DIR ?? "e2e/artifacts";
    this.config = config;
    this.suite = suite;
  }

  async onEnd(_result: FullResult): Promise<void> {
    const summary = this.buildSummary();
    await fs.mkdir(this.artifactsDir, { recursive: true });
    await fs.writeFile(this.summaryFile(), JSON.stringify(summary, null, 2), "utf-8");
    await this.writeMarkdownReport(summary);
  }

  private buildSummary(): Summary {
    const tests = this.suite?.allTests() ?? [];
    const summary: Summary = {
      startedAt: new Date(this.startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - this.startTime,
      baseURL: process.env.E2E_BASE_URL,
      projects: (this.config?.projects ?? []).map((project) => project.name),
      total: tests.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      failures: [],
    };

    for (const test of tests) {
      const outcome = test.outcome();
      if (outcome === "expected") {
        summary.passed += 1;
      } else if (outcome === "flaky") {
        summary.passed += 1;
        summary.flaky += 1;
      } else if (outcome === "skipped") {
        summary.skipped += 1;
      } else if (outcome === "unexpected") {
        summary.failed += 1;
        const message = this.extractErrorMessage(test);
        summary.failures.push({
          id: `BUG-${String(summary.failures.length + 1).padStart(3, "0")}`,
          title: test.titlePath().join(" > "),
          file: test.location.file,
          severity: this.inferSeverity(test.title, message),
          error: message,
        });
      }
    }

    return summary;
  }

  private async writeMarkdownReport(summary: Summary): Promise<void> {
    const appMap = await this.readAppMap();
    const routes = (appMap.routes ?? []).slice(0, 60);
    const actions = (appMap.actions ?? []).slice(0, 100);
    const markdown = [
      "# E2E Audit Report",
      "",
      "## 1) Run Metadata",
      `- Date: ${summary.finishedAt ?? "n/a"}`,
      `- Base URL: ${summary.baseURL ?? "n/a"}`,
      `- Duration (ms): ${summary.durationMs ?? 0}`,
      `- Projects: ${summary.projects.join(", ") || "n/a"}`,
      "",
      "## 2) Discovered Routes and Actions Map",
      "",
      "### Routes",
      ...(routes.length > 0
        ? routes.map((route) => {
            const issues = (route.issues ?? []).join("; ");
            return `- ${route.path ?? "n/a"} | ${route.status ?? "n/a"} | ${route.title ?? "n/a"} | ${issues || "none"}`;
          })
        : ["- No routes were recorded."]),
      "",
      "### Actions",
      ...(actions.length > 0
        ? actions.map(
            (action) =>
              `- ${action.route ?? "n/a"} | ${action.action ?? "n/a"} | ${action.outcome ?? "n/a"} | ${action.details ?? "n/a"}`,
          )
        : ["- No actions were recorded."]),
      "",
      "## 3) Test Results Summary",
      `- Total tests: ${summary.total}`,
      `- Passed: ${summary.passed}`,
      `- Failed: ${summary.failed}`,
      `- Skipped: ${summary.skipped}`,
      `- Flaky: ${summary.flaky}`,
      "",
      "## 4) Bugs Found (with Steps to Reproduce)",
      ...this.renderBugs(summary.failures),
      "",
      "## 5) Recommendations",
      "- Add stable `data-testid` attributes for navigation, auth controls, form submit controls, grid controls, modal triggers, and logout.",
      "- Ensure semantic roles and labels are present so role/label selectors are reliable.",
      "- Add deterministic loading markers and correlation IDs in logs/API responses for faster triage.",
      "",
      "## 6) Next Steps",
      "- Expand role-specific coverage with configured storage states for `basic` and `admin`.",
      "- Add accessibility assertions and performance baselines.",
      "- Increase crawl depth and include deterministic seed/cleanup hooks where available.",
      "",
    ].join("\n");

    await fs.writeFile(path.join(this.artifactsDir, "audit-report.md"), markdown, "utf-8");
  }

  private renderBugs(failures: SummaryFailure[]): string[] {
    if (failures.length === 0) {
      return ["- No failures captured in this run."];
    }

    const ordered: Array<SummaryFailure["severity"]> = ["blocker", "major", "minor"];
    const lines: string[] = [];

    for (const severity of ordered) {
      const section = failures.filter((failure) => failure.severity === severity);
      if (section.length === 0) {
        continue;
      }
      lines.push(`### ${severity.charAt(0).toUpperCase()}${severity.slice(1)}`);
      for (const failure of section) {
        lines.push(`- ID: ${failure.id}`);
        lines.push(`- Title: ${failure.title}`);
        lines.push(`- File: ${failure.file}`);
        lines.push("- Steps to reproduce:");
        lines.push("  1. Set `E2E_BASE_URL` and optional `E2E_START_COMMAND`.");
        lines.push("  2. Run `npm run test:e2e` (or `npm run test:e2e:matrix`).");
        lines.push(`  3. Inspect failing test output for: ${failure.title}.`);
        lines.push(`- Expected: The test should pass without hard errors.`);
        lines.push(`- Actual: ${failure.error ?? "No error details were captured."}`);
        lines.push("- Evidence: Playwright trace/video/screenshot artifacts for the failed test.");
      }
    }

    return lines;
  }

  private extractErrorMessage(test: TestCase): string | undefined {
    const results = [...test.results].reverse();
    for (const result of results) {
      if (result.error?.message) {
        return this.compactMessage(result.error);
      }
      if (Array.isArray(result.errors) && result.errors.length > 0) {
        const first = result.errors.find((error) => Boolean(error.message));
        if (first) {
          return this.compactMessage(first);
        }
      }
    }
    return undefined;
  }

  private compactMessage(error: TestError): string {
    return error.message
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6)
      .join(" | ");
  }

  private inferSeverity(title: string, message?: string): "blocker" | "major" | "minor" {
    const haystack = `${title} ${message ?? ""}`;
    if (/http 5\d\d|server errors|cannot load|connection refused|timeout|auth gating/i.test(haystack)) {
      return "blocker";
    }
    if (/console|network|validation|modal|grid|table|logout|crawl|smoke/i.test(haystack)) {
      return "major";
    }
    return "minor";
  }

  private async readAppMap(): Promise<AppMap> {
    try {
      const raw = await fs.readFile(path.join(this.artifactsDir, "app-map.json"), "utf-8");
      return JSON.parse(raw) as AppMap;
    } catch {
      return {};
    }
  }

  private summaryFile(): string {
    return path.join(this.artifactsDir, "audit-summary.json");
  }
}

export default AuditSummaryReporter;
