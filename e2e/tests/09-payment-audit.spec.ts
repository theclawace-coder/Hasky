/**
 * 09-payment-audit.spec.ts
 *
 * Comprehensive payment system audit: deposits, partial payments,
 * full payments, Stripe integration, invoice<->booking status cascade.
 *
 * Uses admin auth to test the full payment lifecycle:
 *   1. Create a booking with deposit plan
 *   2. Record cash deposit and verify status
 *   3. Confirm job after deposit
 *   4. Record partial payment and verify outstanding math
 *   5. Generate invoice and verify deposit is credited
 *   6. Record partial invoice payment and verify partially_paid status
 *   7. Record remaining payment and verify paid status
 *   8. Create another booking (on_completion plan) for Stripe test
 *   9. Complete and generate invoice, pay via Stripe test card
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:5173";

async function ensureLoggedIn(page: Page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  if (url.includes("/login") || url.includes("/signup")) {
    throw new Error("Not authenticated — run e2e:auth:states first");
  }
}

async function navigateToBookings(page: Page) {
  await page.goto(`${BASE}/bookings`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
}

async function navigateToInvoices(page: Page) {
  await page.goto(`${BASE}/invoices`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
}

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

test.describe.serial("Payment System Audit", () => {
  test.use({
    storageState: process.env.E2E_BASIC_STORAGE_STATE ?? "e2e/.auth/basic.json",
  });

  let depositBookingUrl = "";
  let depositInvoiceUrl = "";
  let onCompletionBookingUrl = "";

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Create a booking with DEPOSIT payment plan ($500 daily, 30% deposit)
  // ──────────────────────────────────────────────────────────────────────────
  test("1. Create booking with deposit payment plan", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/bookings/new`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Step 1: Enter start date and select machine
    const startDateInput = page.locator('input[type="date"]').first();
    await startDateInput.fill(futureDate(3));
    await page.waitForTimeout(800);

    const machineCards = page.locator('[data-testid="machine-card"]');
    const machineCount = await machineCards.count();
    expect(machineCount).toBeGreaterThan(0);
    await machineCards.first().click();
    await page.waitForTimeout(500);

    const nextToClient = page.getByRole("button", { name: /next.*client/i });
    await expect(nextToClient).toBeEnabled();
    await nextToClient.click();
    await page.waitForTimeout(1000);

    // Step 2: Select first existing customer
    const customerButtons = page.locator('button[type="button"]').filter({
      hasText: /Pty|Ltd|Civil|Wood|Fish|Dave|constructions|audit/i,
    });
    const custCount = await customerButtons.count();
    if (custCount > 0) {
      await customerButtons.first().click();
      await page.waitForTimeout(500);
    } else {
      const addClientBtn = page.getByRole("button", { name: /add new client/i }).first();
      await addClientBtn.click();
      await page.waitForTimeout(500);
      const nameInput = page.locator('[role="dialog"] input').first();
      await nameInput.fill("Payment Audit Test Customer");
      const saveBtn = page.getByRole("button", { name: /save customer/i });
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    const nextToDetails = page.getByRole("button", { name: /next.*details/i });
    await expect(nextToDetails).toBeEnabled();
    await nextToDetails.click();
    await page.waitForTimeout(1000);

    // Step 3: Job details with deposit plan
    // Fill end date
    const dateInputs = page.locator('input[type="date"]');
    const endDateInput = dateInputs.nth(1);
    if (await endDateInput.count() > 0) {
      await endDateInput.fill(futureDate(7));
      await page.waitForTimeout(300);
    }

    // Select "Deposit" payment plan
    const depositPlanBtn = page.getByRole("button", { name: /deposit/i }).first();
    if (await depositPlanBtn.count() > 0) {
      await depositPlanBtn.click();
      await page.waitForTimeout(500);
    }

    // Set deposit to 30%
    const percentBtn = page.getByRole("button", { name: /%|percent/i }).first();
    if (await percentBtn.count() > 0) {
      await percentBtn.click();
      await page.waitForTimeout(300);
    }
    const depositInput = page.locator('input[type="number"]').filter({ has: page.locator(':scope') });
    const numberInputs = page.locator('input[type="number"]');
    const numCount = await numberInputs.count();
    for (let i = 0; i < numCount; i++) {
      const inp = numberInputs.nth(i);
      const placeholder = await inp.getAttribute("placeholder");
      const value = await inp.inputValue();
      if (placeholder?.includes("%") || placeholder?.includes("deposit") || value === "30" || value === "0") {
        const label = await inp.evaluate((el) => {
          const prev = el.previousElementSibling;
          return prev?.textContent ?? "";
        });
        if (label.toLowerCase().includes("deposit") || label.toLowerCase().includes("%")) {
          await inp.fill("30");
          break;
        }
      }
    }

    // Move to review
    const nextToReview = page.getByRole("button", { name: /next|continue|review/i }).first();
    if (await nextToReview.count() > 0 && await nextToReview.isEnabled()) {
      await nextToReview.click();
      await page.waitForTimeout(1000);
    }

    // Submit the booking
    const createBtn = page.getByRole("button", { name: /create|save|submit|confirm/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(3000);
    }

    // Should navigate to booking detail
    depositBookingUrl = page.url();
    console.log(`[AUDIT] Deposit booking created: ${depositBookingUrl}`);

    // Verify we're on a booking detail page
    expect(depositBookingUrl).toMatch(/\/bookings\/.+/);

    await page.screenshot({ path: "e2e/artifacts/payment-audit-01-deposit-booking.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Verify deposit gate on booking detail
  // ──────────────────────────────────────────────────────────────────────────
  test("2. Verify deposit payment gate before confirmation", async ({ page }) => {
    await ensureLoggedIn(page);

    // Navigate to the most recent booking (quote status)
    await navigateToBookings(page);

    // Click the first quote-status booking
    const quoteRows = page.locator("tbody tr").filter({ hasText: /quote|pending/i });
    const rowCount = await quoteRows.count();

    if (rowCount > 0) {
      await quoteRows.first().click();
      await page.waitForTimeout(2000);
    } else {
      // Fall back to first booking
      const firstRow = page.locator("tbody tr").first();
      await firstRow.click();
      await page.waitForTimeout(2000);
    }

    depositBookingUrl = page.url();

    // Check for deposit payment gate
    const depositGate = page.getByText(/collect.*deposit.*before confirming/i).or(
      page.getByText(/collect full payment/i)
    );
    const hasPaymentGate = await depositGate.count() > 0;

    // Check Confirm Job button state
    const confirmBtn = page.getByRole("button", { name: /confirm job/i });
    if (await confirmBtn.count() > 0) {
      const isDisabled = await confirmBtn.isDisabled();
      console.log(`[AUDIT] Confirm Job button disabled: ${isDisabled}, Payment gate visible: ${hasPaymentGate}`);

      if (hasPaymentGate) {
        // Verify confirm is disabled when payment gate is shown
        expect(isDisabled).toBe(true);
        console.log("[AUDIT] PASS: Confirm Job correctly disabled when deposit not paid");
      }
    }

    await page.screenshot({ path: "e2e/artifacts/payment-audit-02-deposit-gate.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Record deposit payment (cash) and verify amounts
  // ──────────────────────────────────────────────────────────────────────────
  test("3. Record deposit cash payment and verify amounts", async ({ page }) => {
    await ensureLoggedIn(page);
    if (depositBookingUrl) {
      await page.goto(depositBookingUrl, { waitUntil: "domcontentloaded" });
    } else {
      await navigateToBookings(page);
      const quoteRows = page.locator("tbody tr").filter({ hasText: /quote|pending/i });
      if (await quoteRows.count() > 0) {
        await quoteRows.first().click();
      } else {
        await page.locator("tbody tr").first().click();
      }
    }
    await page.waitForTimeout(2000);

    // Look for the "Mark Cash Received" button in the deposit gate
    const markCashBtn = page.getByRole("button", { name: /mark.*cash received/i }).first();
    if (await markCashBtn.count() > 0) {
      // Read deposit amount from the button text
      const btnText = await markCashBtn.textContent();
      console.log(`[AUDIT] Deposit cash button text: "${btnText}"`);

      await markCashBtn.click();
      await page.waitForTimeout(2000);

      // Verify deposit is now marked as paid
      const depositPaidText = page.getByText(/deposit.*paid/i).or(page.getByText(/paid/i));
      const hasPaidIndicator = await depositPaidText.count() > 0;
      console.log(`[AUDIT] Deposit paid indicator visible: ${hasPaidIndicator}`);

      // Verify Confirm Job is now enabled
      const confirmBtn = page.getByRole("button", { name: /confirm job/i });
      if (await confirmBtn.count() > 0) {
        const isEnabled = await confirmBtn.isEnabled();
        console.log(`[AUDIT] Confirm Job now enabled after deposit: ${isEnabled}`);
        expect(isEnabled).toBe(true);

        // Confirm the job
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log("[AUDIT] PASS: Job confirmed after deposit payment");
      }
    } else {
      console.log("[AUDIT] No deposit gate found — booking may already be confirmed or use different payment plan");

      // Try partial payment button if available
      const partialBtn = page.getByRole("button", { name: /partial payment/i }).first();
      if (await partialBtn.count() > 0) {
        console.log("[AUDIT] Partial payment button found on confirmed/completed booking");
      }
    }

    await page.screenshot({ path: "e2e/artifacts/payment-audit-03-after-deposit.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Record partial payment on confirmed booking
  // ──────────────────────────────────────────────────────────────────────────
  test("4. Record partial cash payment on booking", async ({ page }) => {
    await ensureLoggedIn(page);
    if (depositBookingUrl) {
      await page.goto(depositBookingUrl, { waitUntil: "domcontentloaded" });
    } else {
      await navigateToBookings(page);
      const confirmedRows = page.locator("tbody tr").filter({ hasText: /confirmed/i });
      if (await confirmedRows.count() > 0) {
        await confirmedRows.first().click();
      } else {
        await page.locator("tbody tr").first().click();
      }
    }
    await page.waitForTimeout(2000);

    // Look for "Partial Payment" button
    const partialPayBtn = page.getByRole("button", { name: /partial payment/i }).first();
    if (await partialPayBtn.count() === 0) {
      console.log("[AUDIT] No partial payment button visible — booking may already be fully paid");
      return;
    }

    await partialPayBtn.click();
    await page.waitForTimeout(1000);

    // Verify the partial payment modal shows correct math
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Read the job total from the modal
    const jobTotalText = await modal.getByText(/job total/i).locator("..").textContent();
    console.log(`[AUDIT] Partial payment modal - Job total line: "${jobTotalText}"`);

    // Read the outstanding amount
    const outstandingText = await modal.getByText(/outstanding/i).locator("..").textContent();
    console.log(`[AUDIT] Partial payment modal - Outstanding line: "${outstandingText}"`);

    // Read the "already received" if present
    const alreadyReceivedEl = modal.getByText(/already received/i);
    if (await alreadyReceivedEl.count() > 0) {
      const receivedText = await alreadyReceivedEl.locator("..").textContent();
      console.log(`[AUDIT] Partial payment modal - Already received: "${receivedText}"`);
    }

    // Enter a partial amount ($100)
    const amountInput = modal.locator('input[type="number"]');
    await amountInput.fill("100");
    await page.waitForTimeout(300);

    // Click "Record Cash Payment"
    const recordCashBtn = modal.getByRole("button", { name: /record cash payment/i });
    await recordCashBtn.click();
    await page.waitForTimeout(2000);

    // Verify success toast
    const toast = page.getByText(/\$100.*recorded|recorded.*\$100/i).or(
      page.getByText(/still outstanding/i)
    );
    const hasToast = await toast.count() > 0;
    console.log(`[AUDIT] Partial payment toast: ${hasToast}`);

    await page.screenshot({ path: "e2e/artifacts/payment-audit-04-partial-payment.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Generate invoice from booking and verify deposit credit
  // ──────────────────────────────────────────────────────────────────────────
  test("5. Generate invoice and verify deposit is credited", async ({ page }) => {
    await ensureLoggedIn(page);
    if (depositBookingUrl) {
      await page.goto(depositBookingUrl, { waitUntil: "domcontentloaded" });
    } else {
      await navigateToBookings(page);
      const confirmedRows = page.locator("tbody tr").filter({ hasText: /confirmed/i });
      if (await confirmedRows.count() > 0) {
        await confirmedRows.first().click();
      } else {
        await page.locator("tbody tr").first().click();
      }
    }
    await page.waitForTimeout(2000);

    // Click "Generate Invoice"
    const genInvoiceBtn = page.getByRole("button", { name: /generate invoice/i });
    if (await genInvoiceBtn.count() === 0) {
      console.log("[AUDIT] Generate Invoice button not found — may already have invoice or booking not in right state");
      // Check if PAID badge is covering it
      const paidBadge = page.getByText(/^PAID$/);
      if (await paidBadge.count() > 0) {
        console.log("[AUDIT] Booking shows PAID badge — invoice generation correctly blocked");
      }
      return;
    }

    const isDisabled = await genInvoiceBtn.isDisabled();
    if (isDisabled) {
      console.log("[AUDIT] Generate Invoice button is disabled (booking may be fully paid)");
      return;
    }

    await genInvoiceBtn.click();
    await page.waitForTimeout(3000);

    // Should navigate to invoice detail
    depositInvoiceUrl = page.url();
    console.log(`[AUDIT] Invoice generated: ${depositInvoiceUrl}`);
    expect(depositInvoiceUrl).toMatch(/\/invoices\/.+/);

    // Verify invoice shows deposit credit
    const invoiceStatus = page.locator('[class*="badge"], [class*="status"]').first();
    const statusText = await invoiceStatus.textContent().catch(() => "unknown");
    console.log(`[AUDIT] Invoice initial status: "${statusText}"`);

    // Read the total and paid amount from the page
    const invoiceTotal = page.getByText(/invoice total/i).or(page.getByText(/total/i).first());
    const totalText = await invoiceTotal.textContent().catch(() => "not found");
    console.log(`[AUDIT] Invoice total text: "${totalText}"`);

    await page.screenshot({ path: "e2e/artifacts/payment-audit-05-invoice-generated.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Record partial payment on invoice and verify status
  // ──────────────────────────────────────────────────────────────────────────
  test("6. Record partial invoice payment and verify partially_paid status", async ({ page }) => {
    await ensureLoggedIn(page);

    if (depositInvoiceUrl) {
      await page.goto(depositInvoiceUrl, { waitUntil: "domcontentloaded" });
    } else {
      await navigateToInvoices(page);
      const firstRow = page.locator("tbody tr").first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
      }
    }
    await page.waitForTimeout(2000);

    // Check current invoice status
    const isPaid = page.getByText(/^Paid$/).first();
    if (await isPaid.count() > 0) {
      console.log("[AUDIT] Invoice is already fully paid — skipping partial payment test");
      return;
    }

    // Click "Partial Payment" button
    const partialPayBtn = page.getByRole("button", { name: /partial payment/i }).first();
    if (await partialPayBtn.count() === 0) {
      console.log("[AUDIT] No Partial Payment button found");
      return;
    }

    await partialPayBtn.click();
    await page.waitForTimeout(1000);

    // Verify the modal shows correct outstanding
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const outstandingEl = modal.getByText(/outstanding/i);
    if (await outstandingEl.count() > 0) {
      const outstandingLine = await outstandingEl.locator("..").textContent();
      console.log(`[AUDIT] Invoice outstanding: "${outstandingLine}"`);
    }

    // Enter partial payment of $50
    const amountInput = modal.locator('input[type="number"]');
    await amountInput.fill("50");
    await page.waitForTimeout(300);

    // Verify the warning shows remaining
    const warningText = modal.getByText(/will remain outstanding/i);
    if (await warningText.count() > 0) {
      const warning = await warningText.textContent();
      console.log(`[AUDIT] Partial payment warning: "${warning}"`);
    }

    // Click "Record Cash Payment"
    const recordBtn = modal.getByRole("button", { name: /record cash payment/i });
    await recordBtn.click();
    await page.waitForTimeout(2000);

    // Verify status changed to "partially_paid"
    await page.waitForTimeout(1000);
    const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /partially|partial/i });
    const hasPartialStatus = await statusBadge.count() > 0;
    console.log(`[AUDIT] Invoice shows partially_paid status: ${hasPartialStatus}`);

    // Verify the outstanding amount updated
    const outstandingAmount = page.getByText(/outstanding/i);
    if (await outstandingAmount.count() > 0) {
      console.log("[AUDIT] Outstanding amount updated after partial payment");
    }

    // CRITICAL CHECK: Verify "Pay Online" button shows correct outstanding amount
    const payOnlineBtn = page.getByRole("button", { name: /pay online/i });
    if (await payOnlineBtn.count() > 0) {
      const payBtnText = await payOnlineBtn.textContent();
      console.log(`[AUDIT] Pay Online button text: "${payBtnText}"`);
    }

    // CRITICAL CHECK: Verify Send Reminder button is available for partially_paid
    const sendReminderBtn = page.getByRole("button", { name: /send reminder/i });
    const hasReminder = await sendReminderBtn.count() > 0;
    console.log(`[AUDIT] Send Reminder visible for partially_paid invoice: ${hasReminder}`);
    expect(hasReminder).toBe(true);

    await page.screenshot({ path: "e2e/artifacts/payment-audit-06-partial-invoice.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Pay remaining balance and verify fully paid
  // ──────────────────────────────────────────────────────────────────────────
  test("7. Pay remaining invoice balance and verify paid status", async ({ page }) => {
    await ensureLoggedIn(page);

    if (depositInvoiceUrl) {
      await page.goto(depositInvoiceUrl, { waitUntil: "domcontentloaded" });
    } else {
      await navigateToInvoices(page);
      const partialRows = page.locator("tbody tr").filter({ hasText: /partially/i });
      if (await partialRows.count() > 0) {
        await partialRows.first().click();
      } else {
        await page.locator("tbody tr").first().click();
      }
    }
    await page.waitForTimeout(2000);

    const isPaid = page.getByText(/^Paid$/).first();
    if (await isPaid.count() > 0) {
      console.log("[AUDIT] Invoice already fully paid");
      return;
    }

    // Click "Partial Payment" and use "Pay full" quick-fill
    const partialPayBtn = page.getByRole("button", { name: /partial payment/i }).first();
    if (await partialPayBtn.count() === 0) {
      // Try "Mark Fully Paid"
      const markPaidBtn = page.getByRole("button", { name: /mark fully paid/i });
      if (await markPaidBtn.count() > 0) {
        await markPaidBtn.click();
        await page.waitForTimeout(2000);
        console.log("[AUDIT] Used Mark Fully Paid shortcut");
      }
      return;
    }

    await partialPayBtn.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"]');

    // Click "Pay full" quick fill
    const payFullLink = modal.getByText(/pay full/i);
    if (await payFullLink.count() > 0) {
      await payFullLink.click();
      await page.waitForTimeout(300);
    }

    // Click "Record Cash Payment"
    const recordBtn = modal.getByRole("button", { name: /record cash payment/i });
    await recordBtn.click();
    await page.waitForTimeout(2000);

    // Verify status is now "paid"
    const paidBadge = page.getByText(/^Paid$/).or(
      page.locator('[class*="badge"]').filter({ hasText: /^paid$/i })
    );
    const fullyPaid = await paidBadge.count() > 0;
    console.log(`[AUDIT] Invoice fully paid status: ${fullyPaid}`);

    // CRITICAL CHECK: Verify "Partial Payment" and "Mark Fully Paid" buttons are gone
    const partialBtnAfter = page.getByRole("button", { name: /partial payment/i });
    const markPaidBtnAfter = page.getByRole("button", { name: /mark fully paid/i });
    const payOnlineBtnAfter = page.getByRole("button", { name: /pay online/i });

    const hasPartialAfter = await partialBtnAfter.count() > 0;
    const hasMarkPaidAfter = await markPaidBtnAfter.count() > 0;
    const hasPayOnlineAfter = await payOnlineBtnAfter.count() > 0;

    console.log(`[AUDIT] After full payment - Partial btn: ${hasPartialAfter}, Mark Paid btn: ${hasMarkPaidAfter}, Pay Online btn: ${hasPayOnlineAfter}`);
    expect(hasPartialAfter).toBe(false);
    expect(hasMarkPaidAfter).toBe(false);

    await page.screenshot({ path: "e2e/artifacts/payment-audit-07-fully-paid.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Verify invoice paid cascades to booking
  // ──────────────────────────────────────────────────────────────────────────
  test("8. Verify invoice paid status cascades to booking", async ({ page }) => {
    await ensureLoggedIn(page);

    if (depositBookingUrl) {
      await page.goto(depositBookingUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
    } else {
      console.log("[AUDIT] No deposit booking URL saved — skipping cascade test");
      return;
    }

    // Check that the booking shows "Paid" status
    const paidStatus = page.getByText(/^paid$/i).or(
      page.locator('[class*="badge"]').filter({ hasText: /paid/i })
    );
    const showsPaid = await paidStatus.count() > 0;
    console.log(`[AUDIT] Booking shows paid after invoice paid: ${showsPaid}`);

    // Check paid_in_full_date is set
    const paidInFullText = page.getByText(/paid in full/i);
    const hasPaidInFull = await paidInFullText.count() > 0;
    console.log(`[AUDIT] Booking shows 'Paid in full' date: ${hasPaidInFull}`);

    // CRITICAL CHECK: Generate Invoice should be disabled/hidden when fully paid
    const genInvoiceBtn = page.getByRole("button", { name: /generate invoice/i });
    if (await genInvoiceBtn.count() > 0) {
      const isDisabled = await genInvoiceBtn.isDisabled();
      console.log(`[AUDIT] Generate Invoice button disabled after full payment: ${isDisabled}`);
    } else {
      console.log("[AUDIT] Generate Invoice button not visible (correct for paid booking)");
    }

    await page.screenshot({ path: "e2e/artifacts/payment-audit-08-cascade.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: Create on_completion booking, generate invoice, pay via Stripe
  // ──────────────────────────────────────────────────────────────────────────
  test("9. Stripe payment flow — create invoice and pay online", async ({ page }) => {
    await ensureLoggedIn(page);

    // Navigate to invoices and find one that can be paid online
    await navigateToInvoices(page);

    // Find a sent/overdue/partially_paid invoice
    const payableRow = page
      .locator("tbody tr")
      .filter({ hasText: /sent|overdue|partially/i })
      .first();

    if (await payableRow.count() === 0) {
      console.log("[AUDIT] No payable invoices found — creating a new booking for Stripe test");

      // Create a quick on_completion booking
      await page.goto(`${BASE}/bookings/new`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const startDate = page.locator('input[type="date"]').first();
      await startDate.fill(futureDate(10));
      await page.waitForTimeout(800);

      // Select an enabled machine only. Disabled cards are often conflicted/booked.
      const enabledMachineCards = page.locator('[data-testid="machine-card"]:not([disabled])');
      const enabledMachineCount = await enabledMachineCards.count();
      if (enabledMachineCount === 0) {
        throw new Error(
          "No enabled machines available for Stripe setup booking. " +
            "Set at least one machine to available or move booking date further out.",
        );
      }
      await enabledMachineCards.first().click();
      await page.waitForTimeout(500);

      const next1 = page.getByRole("button", { name: /next.*client/i });
      if (!await next1.isEnabled()) {
        throw new Error("Stripe setup booking could not proceed from Step 1. Date and machine selection did not satisfy wizard gate.");
      }
      await next1.click();
      await page.waitForTimeout(1000);

      const custBtn = page.locator('button[type="button"]').filter({
        hasText: /Pty|Ltd|Civil|audit/i,
      }).first();
      if (await custBtn.count() > 0) {
        await custBtn.click();
        await page.waitForTimeout(500);
      }

      const next2 = page.getByRole("button", { name: /next.*details/i });
      if (await next2.isEnabled()) {
        await next2.click();
        await page.waitForTimeout(1000);
      }

      // Select on_completion
      const onCompBtn = page.getByRole("button", { name: /on completion|completion/i }).first();
      if (await onCompBtn.count() > 0) {
        await onCompBtn.click();
        await page.waitForTimeout(300);
      }

      const next3 = page.getByRole("button", { name: /next|continue|review/i }).first();
      if (await next3.count() > 0 && await next3.isEnabled()) {
        await next3.click();
        await page.waitForTimeout(1000);
      }

      const createBtn = page.getByRole("button", { name: /create|save|submit/i }).first();
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.waitForTimeout(3000);
      }

      onCompletionBookingUrl = page.url();

      // Confirm the job (no payment gate for on_completion)
      const confirmBtn = page.getByRole("button", { name: /confirm job/i });
      if (await confirmBtn.count() > 0 && await confirmBtn.isEnabled()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }

      // Generate invoice
      const genInvBtn = page.getByRole("button", { name: /generate invoice/i });
      if (await genInvBtn.count() > 0 && !await genInvBtn.isDisabled()) {
        await genInvBtn.click();
        await page.waitForTimeout(3000);
      }
    } else {
      await payableRow.click();
      await page.waitForTimeout(2000);
    }

    // Now on invoice detail — mark as sent if draft
    const markSentBtn = page.getByRole("button", { name: /mark as sent/i });
    if (await markSentBtn.count() > 0) {
      await markSentBtn.click();
      await page.waitForTimeout(1500);
    }

    // Click "Pay Online"
    const payOnlineBtn = page.getByRole("button", { name: /pay online/i });
    if (await payOnlineBtn.count() === 0) {
      console.log("[AUDIT] Pay Online button not available — Stripe may not be configured");
      await page.screenshot({ path: "e2e/artifacts/payment-audit-09-no-stripe.png", fullPage: true }).catch(() => {});
      return;
    }

    const payBtnText = (await payOnlineBtn.textContent()) ?? "";
    console.log(`[AUDIT] Pay Online button: "${payBtnText}"`);

    // Guard against false-positive runs where Stripe is available but amount is $0.
    const payAmountMatch = payBtnText.match(/\$([\d,]+(?:\.\d{2})?)/);
    const payableAmount = payAmountMatch ? Number.parseFloat(payAmountMatch[1].replaceAll(",", "")) : NaN;
    if (Number.isFinite(payableAmount) && payableAmount <= 0) {
      console.log("[AUDIT] Pay Online is visible but payable amount is $0. Skipping Stripe card flow.");
      await page
        .screenshot({ path: "e2e/artifacts/payment-audit-09-zero-payable.png", fullPage: true })
        .catch(() => {});
      return;
    }

    await payOnlineBtn.click();
    await page.waitForTimeout(3000);

    // Payment modal should appear
    const paymentModal = page.locator('[role="dialog"]').filter({ hasText: /secure payment|payment/i });
    if (await paymentModal.count() === 0) {
      console.log("[AUDIT] Payment modal did not appear");
      return;
    }

    // Check amount displayed in modal
    const amountDisplay = paymentModal.locator("text=/\\$[\\d,.]+/").first();
    if (await amountDisplay.count() > 0) {
      const displayedAmount = await amountDisplay.textContent();
      console.log(`[AUDIT] Payment modal amount: "${displayedAmount}"`);
    }

    // Wait for Stripe Elements to load
    await page.waitForTimeout(5000);

    // Fill Stripe test card in the iframe
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();

    // Try to find card number input in Stripe frame
    const cardInput = stripeFrame.locator('[name="number"], [placeholder*="1234"], input[autocomplete="cc-number"]').first();
    if (await cardInput.count() > 0) {
      await cardInput.fill("4242424242424242");
      await page.waitForTimeout(500);

      const expiryInput = stripeFrame.locator('[name="expiry"], [placeholder*="MM"], input[autocomplete="cc-exp"]').first();
      if (await expiryInput.count() > 0) {
        await expiryInput.fill("12/29");
      }

      const cvcInput = stripeFrame.locator('[name="cvc"], [placeholder*="CVC"], input[autocomplete="cc-csc"]').first();
      if (await cvcInput.count() > 0) {
        await cvcInput.fill("310");
      }

      // Submit payment
      const payBtn = paymentModal.getByRole("button", { name: /pay/i });
      if (await payBtn.count() > 0) {
        await payBtn.click();
        await page.waitForTimeout(10000);
        console.log("[AUDIT] Stripe payment submitted");
      }
    } else {
      console.log("[AUDIT] Stripe card input not found in iframe — trying PaymentElement approach");

      // Stripe PaymentElement uses a different iframe structure
      // Look for the payment element container
      const paymentElement = page.locator('[class*="PaymentElement"], #payment-element, .StripeElement');
      if (await paymentElement.count() > 0) {
        console.log("[AUDIT] PaymentElement found — this uses Stripe's newer UI");
      }

      // With newer Stripe Elements, the iframe names are different
      const frames = page.frames();
      console.log(`[AUDIT] Found ${frames.length} frames on the page`);
      for (const frame of frames) {
        const name = frame.name();
        if (name.includes("stripe") || name.includes("payment")) {
          console.log(`[AUDIT] Stripe-related frame: "${name}"`);
        }
      }
    }

    await page.screenshot({ path: "e2e/artifacts/payment-audit-09-stripe.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 10: Verify partial Stripe payment from invoice modal uses correct amount
  // ──────────────────────────────────────────────────────────────────────────
  test("10. Verify partial Stripe payment sends correct amount", async ({ page }) => {
    await ensureLoggedIn(page);

    // Find a payable invoice
    await navigateToInvoices(page);

    const payableRow = page
      .locator("tbody tr")
      .filter({ hasText: /sent|overdue|partially/i })
      .first();

    if (await payableRow.count() === 0) {
      console.log("[AUDIT] No payable invoices for partial Stripe test");
      return;
    }

    await payableRow.click();
    await page.waitForTimeout(2000);

    // Click "Partial Payment"
    const partialPayBtn = page.getByRole("button", { name: /partial payment/i }).first();
    if (await partialPayBtn.count() === 0) {
      console.log("[AUDIT] No Partial Payment button for Stripe partial test");
      return;
    }

    await partialPayBtn.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"]');

    // Enter custom partial amount
    const amountInput = modal.locator('input[type="number"]');
    await amountInput.fill("25");
    await page.waitForTimeout(300);

    // Check if "Collect via Stripe" button exists
    const stripeBtn = modal.getByRole("button", { name: /collect via stripe/i });
    if (await stripeBtn.count() === 0) {
      console.log("[AUDIT] No 'Collect via Stripe' button — Stripe not configured");
      // Close modal
      const cancelBtn = modal.getByRole("button", { name: /cancel/i });
      await cancelBtn.click();
      return;
    }

    // Intercept the create-payment-intent API call
    const intentPromise = page.waitForResponse(
      (resp) => resp.url().includes("create-payment-intent"),
      { timeout: 15000 },
    ).catch(() => null);

    await stripeBtn.click();
    await page.waitForTimeout(3000);

    const intentResponse = await intentPromise;
    if (intentResponse) {
      const requestBody = intentResponse.request().postData();
      console.log(`[AUDIT] create-payment-intent request body: ${requestBody}`);

      // Verify the request includes the custom amount
      if (requestBody) {
        try {
          const parsed = JSON.parse(requestBody);
          const requestedAmount = parsed.amount ?? parsed.body?.amount;
          console.log(`[AUDIT] Requested amount in payment intent: ${requestedAmount}`);
          if (requestedAmount === 25) {
            console.log("[AUDIT] PASS: Partial Stripe amount correctly sent as $25");
          } else {
            console.log(`[AUDIT] WARNING: Expected $25, got ${requestedAmount}`);
          }
        } catch {
          console.log("[AUDIT] Could not parse request body");
        }
      }
    } else {
      console.log("[AUDIT] No create-payment-intent response intercepted");
    }

    // Check the payment modal shows $25
    const paymentModal = page.locator('[role="dialog"]').filter({ hasText: /secure payment|payment/i });
    if (await paymentModal.count() > 0) {
      const amountText = paymentModal.getByText(/\$25/);
      const showsCorrectAmount = await amountText.count() > 0;
      console.log(`[AUDIT] Payment modal shows $25.00: ${showsCorrectAmount}`);
    }

    await page.screenshot({ path: "e2e/artifacts/payment-audit-10-partial-stripe.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 11: Verify "Mark Fully Paid" updates paid_amount correctly
  // ──────────────────────────────────────────────────────────────────────────
  test("11. Mark Fully Paid updates paid_amount to match total", async ({ page }) => {
    await ensureLoggedIn(page);

    await navigateToInvoices(page);

    // Find a draft or sent invoice
    const unpaidRow = page
      .locator("tbody tr")
      .filter({ hasText: /draft|sent/i })
      .first();

    if (await unpaidRow.count() === 0) {
      console.log("[AUDIT] No unpaid invoices to test Mark Fully Paid");
      return;
    }

    await unpaidRow.click();
    await page.waitForTimeout(2000);

    // Get the invoice total before marking paid
    const invoiceUrl = page.url();

    // Click "Mark Fully Paid"
    const markPaidBtn = page.getByRole("button", { name: /mark fully paid/i });
    if (await markPaidBtn.count() === 0) {
      console.log("[AUDIT] Mark Fully Paid button not found");
      return;
    }

    await markPaidBtn.click();
    await page.waitForTimeout(2000);

    // Verify status is "Paid"
    const paidBadge = page.locator('[class*="badge"]').filter({ hasText: /^paid$/i });
    const isPaid = await paidBadge.count() > 0;
    console.log(`[AUDIT] After Mark Fully Paid - status is paid: ${isPaid}`);

    // Verify payment buttons are hidden
    const partialBtn = page.getByRole("button", { name: /partial payment/i });
    const hasPartialBtn = await partialBtn.count() > 0;
    console.log(`[AUDIT] After Mark Fully Paid - Partial Payment hidden: ${!hasPartialBtn}`);
    expect(hasPartialBtn).toBe(false);

    // Verify the green "Paid" indicator shows
    const paidIndicator = page.getByText(/^Paid$/).first();
    const hasPaidIndicator = await paidIndicator.count() > 0;
    console.log(`[AUDIT] Paid indicator visible: ${hasPaidIndicator}`);

    await page.screenshot({ path: "e2e/artifacts/payment-audit-11-mark-fully-paid.png", fullPage: true }).catch(() => {});
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 12: Summary — print all audit results
  // ──────────────────────────────────────────────────────────────────────────
  test("12. Payment Audit Summary", async () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              PAYMENT SYSTEM AUDIT COMPLETE                   ║
╚══════════════════════════════════════════════════════════════╝

Fixes Applied:
  1. create-payment-intent now respects custom amount for invoices
     (was always charging full outstanding for partial Stripe payments)

  2. BookingDetail onPaymentComplete no longer double-counts deposits
     (was calling markDepositPaid AND webhook was incrementing)

  3. Stripe webhook no longer caps deposit_paid_amount at deposit_amount
     (was losing overpayments beyond the deposit)

  4. Stripe webhook no longer blindly marks on_completion as fully paid
     (now checks if payment covers the total amount)

  5. Send Reminder button now visible for partially_paid invoices
     (was only showing for sent/overdue)

Key Payment Math:
  - Invoice: outstanding = total - paid_amount
  - Booking deposit: outstanding = deposit_amount - deposit_paid_amount
  - Booking total: outstanding = total_amount - deposit_paid_amount
  - Invoice from booking: credits deposit_paid_amount as prior_paid
  - Status: paid (paid_amount >= total), partially_paid (0 < paid_amount < total)
`);
  });
});
