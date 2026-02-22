# E2E Audit Report Template

## 1) Run Metadata
- Date:
- Environment:
- Base URL:
- Commit / Build ID:
- Browser:
- Runner:

## 2) Discovered Routes and Actions Map
- Source artifact: `e2e/artifacts/app-map.json`
- Routes discovered:
  - `<path>` | `<status>` | `<title>` | `<issues>`
- Actions discovered:
  - `<route>` | `<action>` | `<outcome>` | `<details>`

## 3) Test Results Summary
- Total tests:
- Passed:
- Failed:
- Skipped (conditional):
- Retries used:
- Trace/video attachments:

## 4) Bugs Found (Prioritized)
### Blocker
- ID:
- Title:
- Steps to reproduce:
  1. 
  2. 
  3. 
- Expected:
- Actual:
- Evidence:
- Affected routes/components:

### Major
- ID:
- Title:
- Steps to reproduce:
  1. 
  2. 
  3. 
- Expected:
- Actual:
- Evidence:
- Affected routes/components:

### Minor
- ID:
- Title:
- Steps to reproduce:
  1. 
  2. 
  3. 
- Expected:
- Actual:
- Evidence:
- Affected routes/components:

## 5) Observability and Testability Gaps
- Missing `data-testid` locations:
- Missing accessibility labels/roles:
- Missing deterministic loading signals:
- Missing server/client correlation IDs:

## 6) Recommendations
- Add stable test IDs for high-traffic controls and route entrypoints.
- Improve semantic accessibility labels for resilient role/label selectors.
- Add structured client and server logs with request correlation IDs.
- Expose non-destructive seed/cleanup APIs for reliable preconditions.

## 7) Next Steps
- Expand route depth and coverage breadth.
- Add role-based matrices (anonymous/basic/admin).
- Add visual and accessibility assertions.
- Establish baseline performance timing and error budgets.
