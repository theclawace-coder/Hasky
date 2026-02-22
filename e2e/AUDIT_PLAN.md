# Discovery-Driven E2E Audit Plan (Generic)

## Assumptions
- The app is reachable via a configurable `E2E_BASE_URL`.
- The app can be exercised safely in a non-production environment.
- Test accounts (if needed) exist and are stable across runs.
- Route structure and selectors may change; tests rely on resilient heuristics.
- Some checks are conditional and are skipped when the related UI pattern is absent.

## Coverage Areas
- App discovery and route mapping:
  - Crawl visible navigation, then expand through discovered same-origin links.
  - Build an app map of routes, titles, status, and discovered UI patterns.
- Core journey integrity:
  - Home load success.
  - Primary navigation route availability.
- Runtime health:
  - Browser console error detection.
  - Failed request and server-error detection.
- Access control:
  - Detect auth screens and likely protected routes.
  - Verify unauthenticated access handling for protected candidates.
- Form behavior:
  - Find at least one form and verify required-field validation signals.
- Common UI components:
  - Table/grid controls: search/filter/sort/pagination probes.
  - Modal/dialog controls: open, close, focus containment.
- Session termination:
  - Logout flow (when available) and post-logout auth signal checks.

## Checklist
- [ ] Base URL resolves and home renders.
- [ ] Main navigation links are discoverable.
- [ ] Discovered top-level routes are reachable.
- [ ] Crawl runs through sampled routes without hard failures.
- [ ] Console errors are zero (excluding documented benign patterns).
- [ ] Request failures and HTTP 5xx responses are zero.
- [ ] Auth and protected-route heuristics executed when auth signals exist.
- [ ] Required validation verified on at least one form.
- [ ] Table/grid interaction probe executed when table/grid exists.
- [ ] Modal open/close/focus probe executed when modal trigger exists.
- [ ] Logout flow verified when logout control exists.
- [ ] App map and test artifacts generated.

## Coverage Map
- Discovery + route map: `e2e/tests/01-crawl.spec.ts`
- Smoke navigation: `e2e/tests/00-smoke.spec.ts`
- Console/network health: `e2e/tests/02-health.spec.ts`
- Auth detection and access gating: `e2e/tests/03-auth-detection.spec.ts`
- Form validation: `e2e/tests/04-form-validation.spec.ts`
- UI components (table/modal): `e2e/tests/05-ui-components.spec.ts`
- Logout behavior: `e2e/tests/06-logout.spec.ts`

## Pass/Fail Criteria
- Pass:
  - No hard route failures (HTTP >= 400 on navigated routes in sampled scope).
  - No uncategorized console errors, request failures, or HTTP 5xx responses.
  - Conditional checks pass when their UI pattern is present.
  - Generated artifacts include `app-map.json` and Playwright report outputs.
- Fail:
  - Any blocker or major issue detected in covered scope.
  - Hard navigation failures in sampled primary routes.
  - Reproducible runtime health failures.

## Severity Levels
- Blocker:
  - App cannot load, auth gating broken for clearly protected content, global runtime failure, persistent HTTP 5xx in core flow.
- Major:
  - Core navigation route broken, required validation missing, modal cannot close, table controls break interaction flow.
- Minor:
  - Cosmetic selector instability, non-critical console noise, minor accessibility/UX degradation without flow breakage.

## Data Strategy
- Accounts:
  - Use dedicated low-privilege audit account and optional elevated account for role-only areas.
- Setup:
  - Prefer idempotent seed fixtures or API-level setup before UI interactions.
- Cleanup:
  - Tag test-created artifacts (if any) and remove via API or deterministic UI cleanup.
- Idempotency:
  - Avoid business-specific creation flows by default; use read-first and non-destructive interaction probes.

## Flake-Reduction Rules
- Do not use arbitrary sleeps (`waitForTimeout`) for readiness.
- Use deterministic waits:
  - `domcontentloaded` and `load` states.
  - Explicit locator state checks (`visible`, `attached`, `hidden`).
- Keep retries limited and report first-failure traces.
- Run audit flows serially (`workers: 1`) to simplify shared app-map artifacts.
- Use resilient selectors with strict fallback order.

## What to Instrument
- `data-testid`:
  - Stable IDs for nav links, auth controls, form submit buttons, modal triggers, grid controls, logout.
- Accessibility labels:
  - Reliable `aria-label`, semantic roles, and explicit form labels.
- Logging:
  - Client error IDs in console.
  - Correlation IDs in API responses.
  - Structured network failure events for debugging.
