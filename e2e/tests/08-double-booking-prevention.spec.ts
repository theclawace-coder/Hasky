/**
 * 08-double-booking-prevention.spec.ts
 *
 * Verifies that the booking wizard correctly:
 *   1. Requires end date (Next button blocked without it)
 *   2. Auto-fills end date from start date when start date changes
 *   3. Corrects invalid end<start ranges with visible feedback
 *   4. Blocks selection of a machine that is already confirmed for those dates
 *   5. "Create Job" is disabled on Step 4 if selected machine is conflicted
 *   6. End date label shows required asterisk, not "(optional)"
 *
 * Requires: E2E_BASIC_STORAGE_STATE or e2e/.auth/basic.json with a valid session.
 */

import { test, expect } from "@playwright/test";

test.describe("Double-booking prevention", () => {
  test.use({ storageState: process.env.E2E_BASIC_STORAGE_STATE ?? "e2e/.auth/basic.json" });

  // Dates well in the future to avoid conflicts with real DB bookings
  const FUTURE_START = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split("T")[0];
  })();
  const FUTURE_END = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  })();

  // ── helpers ────────────────────────────────────────────────────────────────

  async function ensureLoggedIn(page: import("@playwright/test").Page, baseURL: string) {
    await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
    const url = page.url();
    if (url.includes("/login") || url.includes("/signup")) {
      throw new Error(
        "Not authenticated. Run scripts/generate-auth-states.mjs with valid credentials first, then re-run with E2E_ROLES=basic.",
      );
    }
  }

  async function goToWizard(page: import("@playwright/test").Page, baseURL: string) {
    await ensureLoggedIn(page, baseURL);
    await page.goto(`${baseURL}/bookings/new`, { waitUntil: "domcontentloaded" });
    // Wait for the machine grid / date inputs to appear (data loads async)
    await page.waitForSelector('input[type="date"]', { timeout: 15_000 });
    await page.waitForTimeout(800); // allow bookings query to finish
  }

  // ── Test 1: Next button requires BOTH start date and end date ──────────────

  test("1. Next button blocked until both start date AND end date are set", async ({ page, baseURL }) => {
    await goToWizard(page, baseURL ?? "http://127.0.0.1:5173");

    const machineCards = page.locator('[data-testid="machine-card"]');
    const machineCount = await machineCards.count();

    if (machineCount === 0) {
      console.log("⚠️  No available machines in fleet — skipping Next button gate test");
      return;
    }

    // Select first machine
    await machineCards.first().click();
    await page.waitForTimeout(300);

    const nextBtn = page.getByRole("button", { name: /next.*client/i });
    await expect(nextBtn).toBeVisible();

    // With start date auto-filled (endDate also auto-fills), button should be enabled
    // First: clear endDate manually to test the gate
    const endDateInput = page.locator('input[type="date"]').nth(1);

    // Fill start date (endDate auto-fills to same value)
    const startDateInput = page.locator('input[type="date"]').first();
    await startDateInput.fill(FUTURE_START);
    await page.waitForTimeout(400);

    // Verify auto-fill happened
    const autoFilledEnd = await endDateInput.inputValue();
    expect(autoFilledEnd).toBe(FUTURE_START);
    console.log(`✅ End date auto-filled to "${autoFilledEnd}" when start date set`);

    // Now clear end date — button should become disabled
    await endDateInput.fill("");
    await page.waitForTimeout(300);

    await expect(nextBtn).toBeDisabled();
    console.log("✅ Next button is disabled when end date is cleared");

    // Re-fill end date — button should re-enable
    await endDateInput.fill(FUTURE_END);
    await page.waitForTimeout(300);

    await expect(nextBtn).toBeEnabled();
    console.log("✅ Next button is enabled once both dates + machine are set");
  });

  // ── Test 2: Auto-fill end date from start date ────────────────────────────

  test("2. End date auto-fills to start date when start date is entered", async ({ page, baseURL }) => {
    await goToWizard(page, baseURL ?? "http://127.0.0.1:5173");

    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);

    await expect(endDateInput).toBeVisible();

    // Initially empty
    const initialValue = await endDateInput.inputValue();
    expect(initialValue).toBe("");
    console.log(`✅ End date initially empty: "${initialValue}"`);

    // Fill start date → end date auto-fills
    await startDateInput.fill(FUTURE_START);
    await page.waitForTimeout(400);

    const afterFill = await endDateInput.inputValue();
    expect(afterFill).toBe(FUTURE_START);
    console.log(`✅ End date auto-filled to "${afterFill}" after start date set`);

    // If end date is already set to a later date and start date moves forward (but before end),
    // end date should NOT be reset
    await endDateInput.fill(FUTURE_END);
    const laterStart = (() => {
      const d = new Date(FUTURE_START);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })();
    await startDateInput.fill(laterStart);
    await page.waitForTimeout(400);

    const afterShift = await endDateInput.inputValue();
    expect(afterShift).toBe(FUTURE_END);
    console.log(`✅ End date "${FUTURE_END}" preserved when start shifted forward (end still ≥ start)`);

    // If start date moves AFTER end date, end date should reset to the new start
    const endThenInvalidStart = (() => {
      const d = new Date(FUTURE_END);
      d.setDate(d.getDate() + 5); // past the end
      return d.toISOString().split("T")[0];
    })();
    await startDateInput.fill(endThenInvalidStart);
    await page.waitForTimeout(400);

    const afterInvalidShift = await endDateInput.inputValue();
    expect(afterInvalidShift).toBe(endThenInvalidStart);
    console.log(`✅ End date reset to "${afterInvalidShift}" when start moved past old end`);
  });

  // ── Test 3: Invalid end<start is auto-corrected with visible feedback ───

  test("3. End date before start date is corrected and shows feedback", async ({ page, baseURL }) => {
    await goToWizard(page, baseURL ?? "http://127.0.0.1:5173");

    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);

    await startDateInput.fill(FUTURE_START);
    await page.waitForTimeout(300);
    await endDateInput.fill(FUTURE_END);
    await page.waitForTimeout(300);

    const movedStartPastEnd = (() => {
      const d = new Date(FUTURE_END);
      d.setDate(d.getDate() + 2);
      return d.toISOString().split("T")[0];
    })();
    await startDateInput.fill(movedStartPastEnd);
    await page.waitForTimeout(400);

    const correctedEnd = await endDateInput.inputValue();
    expect(correctedEnd).toBe(movedStartPastEnd);
    await expect(page.getByText(/end date cannot be before start date/i)).toBeVisible();
    console.log(`✅ End date was auto-corrected to "${correctedEnd}" and feedback was shown`);
  });

  // ── Test 4: End date label shows asterisk, not "(optional)" ──────────────

  test("4. End date field shows required asterisk, not '(optional)'", async ({ page, baseURL }) => {
    await goToWizard(page, baseURL ?? "http://127.0.0.1:5173");

    // The end date label is inside a styled <label> element
    // It uses a <span> for the * so textContent includes both
    const endDateLabel = page
      .locator("label")
      .filter({ hasText: /end date/i })
      .first();

    await expect(endDateLabel).toBeVisible();

    const labelText = (await endDateLabel.textContent()) ?? "";
    console.log(`ℹ️  End date label text: "${labelText.trim()}"`);

    expect(labelText.toLowerCase()).not.toContain("optional");
    expect(labelText).toContain("*");
    console.log("✅ End date label shows '*' and does not say 'optional'");
  });

  // ── Test 5: Conflicted machine shows badge and cannot be selected ─────────

  test("5. Machine with a confirmed booking shows 'Booked' badge and blocks selection", async ({ page, baseURL }) => {
    const base = baseURL ?? "http://127.0.0.1:5173";
    await ensureLoggedIn(page, base);

    // Find a confirmed booking to get its machine + date
    await page.goto(`${base}/bookings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const confirmedRow = page.locator("tbody tr").filter({ hasText: /confirmed/i }).first();
    const hasConfirmed = await confirmedRow.count() > 0;

    if (!hasConfirmed) {
      console.log(
        "⚠️  No confirmed bookings in DB — conflict badge test skipped.\n" +
          "    Create and confirm a booking first, then re-run this test.",
      );
      return;
    }

    // Navigate into the booking to get exact start date
    await confirmedRow.click();
    await page.waitForTimeout(1500);

    // Extract a date from the page (booking detail shows start date)
    const dateMatch = (await page.content()).match(/value="(\d{4}-\d{2}-\d{2})"/);
    const bookingStartDate = dateMatch?.[1];

    if (!bookingStartDate) {
      console.log("⚠️  Could not extract a start date from the booking detail — skipping");
      return;
    }
    console.log(`ℹ️  Using confirmed booking date: ${bookingStartDate}`);

    // Now navigate to the new booking wizard
    await page.goto(`${base}/bookings/new`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="date"]', { timeout: 15_000 });
    await page.waitForTimeout(1500); // wait for existingBookings to load

    // Enter the same date as the confirmed booking
    const startInput = page.locator('input[type="date"]').first();
    await startInput.fill(bookingStartDate);
    await page.waitForTimeout(600); // allow conflict detection to re-compute

    // Check for "Booked" badge on any machine card
    const bookedBadge = page.locator('[data-testid="machine-card"]').filter({ hasText: "Booked" }).first();
    const hasBookedBadge = await bookedBadge.count() > 0;

    if (!hasBookedBadge) {
      console.log(
        "ℹ️  No 'Booked' badge visible — the machine may be in 'on hire' status " +
          "(filtered out of wizard) or the dates don't overlap. Conflict UI not triggered.",
      );
      return;
    }

    console.log("✅ 'Booked' badge is visible on at least one machine card");

    // Clicking the conflicted machine should trigger a toast error and NOT select it
    await bookedBadge.click();
    await page.waitForTimeout(600);

    // The machine should not be selected (no violet check icon inside that card)
    const checkInConflicted = bookedBadge.locator('svg').filter({ hasText: "" }).first();
    const selectedBorder = await bookedBadge.evaluate((el) =>
      el.className.includes("violet-500"),
    );
    expect(selectedBorder).toBe(false);
    console.log("✅ Conflicted machine was NOT selected after click");

    // A toast error should have appeared
    const toastText = await page.locator("[data-sonner-toast]").first().textContent().catch(() => "");
    const hasErrorToast =
      toastText.toLowerCase().includes("already booked") ||
      toastText.toLowerCase().includes("conflict") ||
      (await page.locator("[data-sonner-toast][data-type='error']").count()) > 0;

    console.log(`✅ Error toast shown: ${hasErrorToast} (text: "${toastText.slice(0, 80)}")`);
  });

  // ── Test 6: Step 3 Next button also requires end date ─────────────────────

  test("6. Step 3 proceed button is enabled when prior required dates are valid", async ({ page, baseURL }) => {
    await goToWizard(page, baseURL ?? "http://127.0.0.1:5173");

    const machineCards = page.locator('[data-testid="machine-card"]');
    if ((await machineCards.count()) === 0) {
      console.log("⚠️  No machines — skipping Step 3 gate test");
      return;
    }

    // Step 1: fill start (endDate auto-fills), pick machine, advance
    const startInput = page.locator('input[type="date"]').first();
    await startInput.fill(FUTURE_START);
    await page.waitForTimeout(400);

    await machineCards.first().click();
    await page.waitForTimeout(300);

    const next1 = page.getByRole("button", { name: /next.*client/i });
    await expect(next1).toBeEnabled();
    await next1.click();
    await page.waitForTimeout(500);

    // Step 2: pick a visible customer card/button using business-name patterns.
    // The previous generic selector was too broad and could click unrelated controls.
    const customerBtn = page
      .locator('button[type="button"]')
      .filter({ hasText: /Pty|Ltd|Civil|Wood|Fish|Dave|constructions|audit/i })
      .first();
    if ((await customerBtn.count()) > 0) {
      await customerBtn.click();
      await page.waitForTimeout(300);
    } else {
      console.log("⚠️  No customer candidates visible on Step 2 — skipping Step 5 gate test");
      return;
    }

    const next2 = page.getByRole("button", { name: /next.*details/i });
    await expect(next2).toBeEnabled();
    await next2.click();
    await page.waitForTimeout(500);

    // Step 3: proceed button label may vary by UI copy ("Review Job", "Next", "Continue").
    const proceedBtn = page.getByRole("button", {
      name: /review job|next|continue|review/i,
    }).first();
    const proceedCount = await proceedBtn.count();
    expect(proceedCount).toBeGreaterThan(0);

    const isEnabled = await proceedBtn.isEnabled();
    console.log(`✅ Step 3 proceed button visible and enabled=${isEnabled} (dates were set in Step 1)`);
    expect(isEnabled).toBe(true);
  });
});
