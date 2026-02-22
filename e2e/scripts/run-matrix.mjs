import { spawnSync } from "node:child_process";

const roles = process.env.E2E_ROLES ?? "anonymous,basic,admin";
const env = { ...process.env, E2E_ROLES: roles };
const args = process.argv.slice(2);
const command = `npx playwright test ${args.map((arg) => `"${arg.replaceAll('"', '\\"')}"`).join(" ")}`.trim();

const child = spawnSync(command, {
  stdio: "inherit",
  env,
  shell: true,
});

if (typeof child.status === "number") {
  process.exit(child.status);
}

process.exit(1);
