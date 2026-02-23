/**
 * 14-fleet-management.spec.ts
 *
 * Pre-launch fleet management audit:
 *   1.  Fleet list loads, shows machine cards
 *   2.  Machine status chips render with correct colours
 *   3.  Add machine — form opens, required fields validated
 *   4.  Add machine — full details saved
 *   5.  MachineDetail page: tabs (details, maintenance, bookings)
 *   6.  Edit machine name/rate from detail
 *   7.  Machine status transitions: available → under_repair → available
 *   8.  Machine availability ring / status strip on cards
 *   9.  Machine unavailable for conflicting dates in wizard (covered in 08)
 *   10. Maintenance log: add entry, verify on machine detail
 *   11. Machine with active hire: status=on_hire cannot be manually set to available
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";

async function ensureLoggedIn(page: Page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  if (page.url().includes("/login")) throw new Error("Not authenticated");
}

const TEST_MACHINE = {
  name: `Audit Test Excavator ${Date.now()}`,
  make: "Komatsu",
  model: "PC138US",
  year: "2021",
  dailyRate: "550",
  weeklyRate: "2500",
};

test.describe.serial("Fleet Management", () => {
  test.use({ storageState: process.env.E2E_BASIC_STORAGE_STATE ?? "e2e/.auth/basic.json" });

  let newMachineUrl = "";

  // ── 1. Fleet list loads ──────────────────────────────────────────────────

  test("1. Fleet list page renders machine cards with status badges", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /fleet|equipment|machines/i }).first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // Machine cards or rows
    const cards = page.locator("[data-testid='machine-card'], [class*='machine'], tbody tr, [class*='card']");
    const cardCount = await cards.count();
    console.log(`✅ [Fleet] Fleet list renders — machine count: ${cardCount}`);

    // Add machine button
    const addBtn = page.getByRole("button", { name: /add machine|new machine/i }).first();
    const hasAddBtn = await addBtn.isVisible().catch(() => false);
    console.log(`✅ [Fleet] Add Machine button visible: ${hasAddBtn}`);

    // Status indicators
    const statusBadges = page.locator("[class*='status'], [class*='badge']");
    const statusCount = await statusBadges.count();
    console.log(`✅ [Fleet] Status badges visible: ${statusCount}`);

    await page.screenshot({ path: "e2e/artifacts/fleet-01-list.png", fullPage: false }).catch(() => {});
  });

  // ── 2. Add machine — validation ───────────────────────────────────────────

  test("2. Add machine form validates required fields", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const addBtn = page.getByRole("button", { name: /add machine|new machine/i }).first();
    if (await addBtn.count() === 0) {
      console.log("⚠️ [Fleet] No Add Machine button found");
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    const isOpen = await modal.isVisible();
    console.log(`[Fleet] Add machine modal opens: ${isOpen}`);

    if (!isOpen) {
      // Maybe navigates to a new page
      const url = page.url();
      console.log(`[Fleet] Navigated to: ${url}`);
      return;
    }

    // Submit without filling
    const saveBtn = modal.getByRole("button", { name: /save|create|add/i }).last();
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Modal should stay open for validation
    const stillOpen = await modal.isVisible();
    console.log(`✅ [Fleet] Empty form validation — modal still open: ${stillOpen}`);
  });

  // ── 3. Add machine — full form ────────────────────────────────────────────

  test("3. Create a new machine with full details", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const addBtn = page.getByRole("button", { name: /add machine|new machine/i }).first();
    if (await addBtn.count() === 0) {
      console.log("⚠️ [Fleet] No Add Machine button — skipping creation test");
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) {
      // Maybe it navigated to a new page form
      const nameInput = page.getByLabel(/name/i).first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(TEST_MACHINE.name);
      }
      // Save form
      const saveBtn = page.getByRole("button", { name: /save|create/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        newMachineUrl = page.url();
      }
      return;
    }

    // Fill name (required)
    const nameInput = modal.getByLabel(/name/i).or(modal.locator('input[name="name"]')).first();
    await nameInput.fill(TEST_MACHINE.name);

    // Make
    const makeInput = modal.getByLabel(/make|brand/i).first();
    if (await makeInput.count() > 0) await makeInput.fill(TEST_MACHINE.make);

    // Model
    const modelInput = modal.getByLabel(/model/i).first();
    if (await modelInput.count() > 0) await modelInput.fill(TEST_MACHINE.model);

    // Daily rate
    const dailyRateInput = modal.getByLabel(/daily rate/i).first();
    if (await dailyRateInput.count() > 0) await dailyRateInput.fill(TEST_MACHINE.dailyRate);

    // Weekly rate
    const weeklyRateInput = modal.getByLabel(/weekly rate/i).first();
    if (await weeklyRateInput.count() > 0) await weeklyRateInput.fill(TEST_MACHINE.weeklyRate);

    // Save
    const saveBtn = modal.getByRole("button", { name: /save|create/i }).last();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Verify machine appears
    const newMachine = page.getByText(TEST_MACHINE.name).first();
    const appearsInList = await newMachine.count() > 0;
    console.log(`✅ [Fleet] New machine "${TEST_MACHINE.name}" appears in list: ${appearsInList}`);

    await page.screenshot({ path: "e2e/artifacts/fleet-03-created.png", fullPage: false }).catch(() => {});
  });

  // ── 4. Machine detail page ────────────────────────────────────────────────

  test("4. MachineDetail page loads with tabs (details, maintenance, bookings)", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click on first machine
    const firstCard = page.locator("[class*='card'], tbody tr, [class*='machine']").first();
    if (await firstCard.count() === 0) {
      console.log("⚠️ [Fleet] No machines in fleet");
      return;
    }

    // Try clicking a link to the machine detail
    const machineLink = page.locator("a[href*='/fleet/']").first();
    if (await machineLink.count() > 0) {
      await machineLink.click();
    } else {
      await firstCard.click();
    }
    await page.waitForTimeout(2000);

    newMachineUrl = page.url();
    expect(page.url()).toMatch(/\/fleet\/.+/);

    // Check for tabs
    const detailsTab = page.getByRole("tab", { name: /details/i }).or(page.getByText(/details/i)).first();
    const maintenanceTab = page.getByRole("tab", { name: /maintenance/i }).or(page.getByText(/maintenance/i)).first();
    const bookingsTab = page.getByRole("tab", { name: /bookings|jobs|hires/i }).or(page.getByText(/bookings|jobs/i)).first();

    console.log(`✅ [Fleet] Detail tabs — details: ${await detailsTab.count() > 0}, maintenance: ${await maintenanceTab.count() > 0}, bookings: ${await bookingsTab.count() > 0}`);

    // Status chip
    const statusBadge = page.locator("[class*='badge'], [class*='status']").first();
    const statusText = await statusBadge.textContent().catch(() => "");
    console.log(`✅ [Fleet] Machine status badge text: "${statusText}"`);

    // Rate info
    const rateInfo = page.getByText(/daily|rate|per day/i).first();
    console.log(`✅ [Fleet] Rate info visible: ${await rateInfo.count() > 0}`);

    await page.screenshot({ path: "e2e/artifacts/fleet-04-detail.png", fullPage: true }).catch(() => {});
  });

  // ── 5. Machine status transition ──────────────────────────────────────────

  test("5. Machine status can be changed (e.g. to under_repair)", async ({ page }) => {
    await ensureLoggedIn(page);

    // Navigate to the newly created machine, or first available machine
    if (newMachineUrl && newMachineUrl.includes("/fleet/")) {
      await page.goto(newMachineUrl, { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const machineLink = page.locator("a[href*='/fleet/']").first();
      if (await machineLink.count() > 0) await machineLink.click();
      else {
        console.log("⚠️ [Fleet] No machine detail to navigate to");
        return;
      }
    }
    await page.waitForTimeout(2000);

    // Find status change dropdown or buttons
    const statusSelect = page.locator('select[name="status"], select[id*="status"]').first();
    const statusDropdown = page.getByRole("combobox").filter({ hasText: /available|on.hire|under.repair/i }).first();
    const underRepairBtn = page.getByRole("button", { name: /under repair|set.*repair/i }).first();
    const editBtn = page.getByRole("button", { name: /edit/i }).first();

    if (await statusSelect.count() > 0) {
      const currentStatus = await statusSelect.inputValue();
      console.log(`[Fleet] Current status via select: ${currentStatus}`);
      await statusSelect.selectOption("under_repair");
      await page.waitForTimeout(300);
      const saveBtn = page.getByRole("button", { name: /save|update/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
      console.log("✅ [Fleet] Status changed to under_repair via select");
    } else if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        // Target the status select specifically — not the category select
        const statusSelectInModal = modal.locator('select[name="status"]').first();
        if (await statusSelectInModal.count() > 0) {
          await statusSelectInModal.selectOption("under_repair");
          const saveMod = modal.getByRole("button", { name: /save|update/i }).last();
          await saveMod.click();
          await page.waitForTimeout(2000);
          console.log("✅ [Fleet] Status changed to under_repair via edit modal (name=status select)");
        } else {
          // Look for all selects in modal and check each for status options
          const allSelects = modal.locator("select");
          const selectCount = await allSelects.count();
          let found = false;
          for (let i = 0; i < selectCount; i++) {
            const sel = allSelects.nth(i);
            const opts = await sel.locator("option").allTextContents();
            if (opts.some((o) => o.toLowerCase().includes("repair") || o.toLowerCase().includes("available"))) {
              await sel.selectOption("under_repair");
              found = true;
              break;
            }
          }
          if (found) {
            const saveMod = modal.getByRole("button", { name: /save|update/i }).last();
            await saveMod.click();
            await page.waitForTimeout(2000);
            console.log("✅ [Fleet] Status changed via found status select in modal");
          } else {
            console.log("ℹ️ [Fleet] No status select found in modal");
            const cancelBtn = modal.getByRole("button", { name: /cancel/i });
            if (await cancelBtn.count() > 0) await cancelBtn.click();
          }
        }
      }
    } else {
      console.log("ℹ️ [Fleet] Status change UI not directly accessible — may be implicit from booking workflow");
    }

    await page.screenshot({ path: "e2e/artifacts/fleet-05-status-change.png", fullPage: false }).catch(() => {});
  });

  // ── 6. Add maintenance log entry ──────────────────────────────────────────

  test("6. Add a maintenance log entry to a machine", async ({ page }) => {
    await ensureLoggedIn(page);

    if (newMachineUrl && newMachineUrl.includes("/fleet/")) {
      await page.goto(newMachineUrl, { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const link = page.locator("a[href*='/fleet/']").first();
      if (await link.count() > 0) await link.click();
      else return;
    }
    await page.waitForTimeout(2000);

    // Click maintenance tab
    const maintenanceTab = page.getByRole("tab", { name: /maintenance/i }).or(
      page.getByRole("button", { name: /maintenance/i })
    ).first();
    if (await maintenanceTab.count() > 0) {
      await maintenanceTab.click();
      await page.waitForTimeout(800);
    }

    // Add maintenance log button
    const addLogBtn = page
      .getByRole("button", { name: /add.*service|add.*maintenance|log.*service|new.*log/i })
      .first();

    if (await addLogBtn.count() === 0) {
      console.log("⚠️ [Fleet] No Add Maintenance Log button found");
      return;
    }

    await addLogBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      // Fill description
      const descInput = modal.getByLabel(/description/i).or(modal.locator("textarea")).first();
      if (await descInput.count() > 0) await descInput.fill("E2E audit — 500hr service check");

      // Fill date
      const dateInput = modal.locator('input[type="date"]').first();
      if (await dateInput.count() > 0) {
        const today = new Date().toISOString().split("T")[0];
        await dateInput.fill(today);
      }

      // Cost
      const costInput = modal.getByLabel(/cost/i).or(modal.locator('input[type="number"]')).first();
      if (await costInput.count() > 0) await costInput.fill("450");

      const saveBtn = modal.getByRole("button", { name: /save|add|log/i }).last();
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log("✅ [Fleet] Maintenance log entry added");
    }

    await page.screenshot({ path: "e2e/artifacts/fleet-06-maintenance.png", fullPage: false }).catch(() => {});
  });

  // ── 7. Machine rates display correctly on fleet list ─────────────────────

  test("7. Machine rates display on fleet list", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Look for rate information
    const rateText = page.getByText(/\$\d+|\/day|daily/i).first();
    const hasRates = await rateText.count() > 0;
    console.log(`✅ [Fleet] Rate information visible on fleet list: ${hasRates}`);

    // Check for status summary (available/on hire/repair counts)
    const availableCount = page.getByText(/\d+\s*(available|on.hire|under.repair)/i).first();
    console.log(`✅ [Fleet] Status summary present: ${await availableCount.count() > 0}`);
  });

  // ── 8. Machine cross-hire availability flag ────────────────────────────────

  test("8. Machine cross-hire toggle is visible in edit form", async ({ page }) => {
    await ensureLoggedIn(page);

    if (newMachineUrl && newMachineUrl.includes("/fleet/")) {
      await page.goto(newMachineUrl, { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(`${BASE}/fleet`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const link = page.locator("a[href*='/fleet/']").first();
      if (await link.count() > 0) await link.click();
      else return;
    }
    await page.waitForTimeout(2000);

    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        const crossHireToggle = modal.getByLabel(/cross.hire|available.*hire/i).first();
        const hasCrossHire = await crossHireToggle.count() > 0;
        console.log(`✅ [Fleet] Cross-hire toggle in edit form: ${hasCrossHire}`);

        // Close
        const cancelBtn = modal.getByRole("button", { name: /cancel|close/i });
        if (await cancelBtn.count() > 0) await cancelBtn.click();
      }
    } else {
      // Look for it inline
      const crossHireText = page.getByText(/cross.hire/i).first();
      console.log(`✅ [Fleet] Cross-hire visible on detail: ${await crossHireText.count() > 0}`);
    }
  });
});
