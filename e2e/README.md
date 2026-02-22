# Playwright Generic Audit Suite

This suite performs a discovery-driven, adaptive E2E audit for unknown web apps.
It avoids business-specific assumptions and conditionally executes checks only when patterns are present.

## Folder Structure

```text
e2e/
  AUDIT_PLAN.md
  AUDIT_REPORT_TEMPLATE.md
  fixtures/
    audit.fixture.ts
  pages/
    BasePage.ts
  reporters/
    AuditSummaryReporter.ts
  tests/
    00-smoke.spec.ts
    01-crawl.spec.ts
    02-health.spec.ts
    03-auth-detection.spec.ts
    04-form-validation.spec.ts
    05-ui-components.spec.ts
    06-logout.spec.ts
  utils/
    appMap.ts
    auth.ts
    discovery.ts
    form.ts
    locators.ts
    network.ts
    types.ts
    waits.ts
```

## Environment

Set these before running:

```env
E2E_BASE_URL=http://127.0.0.1:3000
E2E_START_COMMAND=
E2E_ARTIFACTS_DIR=e2e/artifacts
E2E_ROLES=anonymous
E2E_BASIC_STORAGE_STATE=e2e/.auth/basic.json
E2E_ADMIN_STORAGE_STATE=e2e/.auth/admin.json
E2E_BASIC_EMAIL=
E2E_BASIC_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_AUTH_LOGIN_PATH=/login
E2E_AUTH_VERIFY_PATH=/dashboard
E2E_AUTH_SUCCESS_PATH_HINTS=/dashboard,/onboarding,/home,/admin,/settings
E2E_AUTH_START_COMMAND=
```

- `E2E_BASE_URL`: target app URL.
- `E2E_START_COMMAND`: optional app start command used by Playwright `webServer`.
- `E2E_ARTIFACTS_DIR`: output directory for reports and app map.
- `E2E_ROLES`: comma-separated role matrix (`anonymous,basic,admin`).
- `E2E_BASIC_STORAGE_STATE`: Playwright storage state path for basic role.
- `E2E_ADMIN_STORAGE_STATE`: Playwright storage state path for admin role.
- `E2E_BASIC_EMAIL` / `E2E_BASIC_PASSWORD`: credentials used to generate basic storage state.
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`: credentials used to generate admin storage state.
- `E2E_AUTH_LOGIN_PATH`: login route used for auth state generation.
- `E2E_AUTH_VERIFY_PATH`: protected route used to verify post-login auth state.
- `E2E_AUTH_SUCCESS_PATH_HINTS`: fallback route hints that indicate successful auth transition.
- `E2E_AUTH_START_COMMAND`: optional command for auto-starting the app before auth-state generation.

## Role Matrix

Default run uses `E2E_ROLES=anonymous`.

To run all roles:

```bash
npm run test:e2e:matrix
```

If `basic` or `admin` storage state files are not configured, those roles still execute generic non-auth checks, but authenticated checks (like logout) are skipped.

You can generate storage-state files manually (generic flow) with:

```bash
npx playwright codegen <your-base-url> --save-storage=e2e/.auth/basic.json
npx playwright codegen <your-base-url> --save-storage=e2e/.auth/admin.json
```

Or generate both automatically from env credentials:

```bash
npm run e2e:auth:states
```

Generate a single role:

```bash
npm run e2e:auth:states:basic
npm run e2e:auth:states:admin
```

## How To Run

1. Install Playwright test dependency and browsers:

```bash
npm install
npx playwright install chromium
```

2. Run the audit:

```bash
npm run test:e2e
```

3. Run headed mode:

```bash
npm run test:e2e:headed
```

4. Open HTML report:

```bash
npm run test:e2e:report
```

## Artifacts

- `e2e/artifacts/results.json`
- `e2e/artifacts/audit-summary.json`
- `e2e/artifacts/audit-report.md`
- `e2e/artifacts/html-report/index.html`
- `e2e/artifacts/app-map.json`
