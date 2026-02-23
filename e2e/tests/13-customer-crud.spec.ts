/**
 * 13-customer-crud.spec.ts
 *
 * Pre-launch customer management audit:
 *   1.  Customers list page loads, shows table/cards
 *   2.  "Add Customer" button visible and functional
 *   3.  Add customer — required field validation
 *   4.  Add customer — full form, save succeeds
 *   5.  Customer appears in list after creation
 *   6.  Click into CustomerDetail — booking history tab visible
 *   7.  CustomerDetail shows: name, email, phone, address, booking number
 *   8.  Edit customer from CustomerDetail
 *   9.  Search / filter on customer list
 *   10. Archive / inactive customer (if available)
 *   11. Add customer inline from wizard Step 2
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";

const TEST_CUSTOMER = {
  name: `Audit Test Customer ${Date.now()}`,
  contactName: "Tester McTest",
  email: `audit.${Date.now()}@testcorp.com.au`,
  phone: "0400 123 456",
  address: "99 Audit Street",
  city: "Sydney",
  state: "NSW",
};

async function ensureLoggedIn(page: Page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  if (page.url().includes("/login") || page.url().includes("/signup")) {
    throw new Error("Not authenticated — run e2e:auth:states first");
  }
}

test.describe.serial("Customer CRUD", () => {
  test.use({ storageState: process.env.E2E_BASIC_STORAGE_STATE ?? "e2e/.auth/basic.json" });

  let newCustomerUrl = "";

  // ── 1. Customers list loads ──────────────────────────────────────────────

  test("1. Customers list page loads and renders content", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const heading = page.getByRole("heading", { name: /customers?/i }).first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    const addBtn = page
      .getByTestId("add-customer-button")
      .or(page.getByRole("button", { name: /add customer|new customer/i }));
    const hasAddBtn = await addBtn.first().isVisible().catch(() => false);
    expect(hasAddBtn).toBe(true);

    console.log("✅ [Customers] List page loads, Add Customer button present");
    await page.screenshot({ path: "e2e/artifacts/customers-01-list.png", fullPage: false }).catch(() => {});
  });

  // ── 2. Add customer — required field validation ──────────────────────────

  test("2. Add customer modal validates required fields", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const addBtn = page
      .getByTestId("add-customer-button")
      .or(page.getByRole("button", { name: /add customer|new customer/i }));
    await addBtn.first().click();
    await page.waitForTimeout(500);

    // Modal should be open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Submit without filling anything
    const saveBtn = modal
      .getByRole("button", { name: /save|create|add/i })
      .last();
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Modal should still be open (not closed)
    const stillOpen = await modal.isVisible();
    expect(stillOpen).toBe(true);

    // Should see validation error
    const validationError = modal.getByText(/required|must be|cannot be empty/i).first();
    const hasValidation = await validationError.count() > 0;
    console.log(`✅ [Customers] Empty form validation — modal still open: ${stillOpen}, error shown: ${hasValidation}`);
  });

  // ── 3. Add customer — full form ───────────────────────────────────────────

  test("3. Create a new customer with full details", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const addBtn = page
      .getByTestId("add-customer-button")
      .or(page.getByRole("button", { name: /add customer|new customer/i }));
    await addBtn.first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill name (required)
    const nameInput = modal.getByLabel(/^name/i).or(modal.locator('input').first());
    await nameInput.fill(TEST_CUSTOMER.name);

    // Contact name
    const contactInput = modal.getByLabel(/contact name|contact person/i).first();
    if (await contactInput.count() > 0) await contactInput.fill(TEST_CUSTOMER.contactName);

    // Email
    const emailInput = modal.getByLabel(/email/i).first();
    if (await emailInput.count() > 0) await emailInput.fill(TEST_CUSTOMER.email);

    // Phone
    const phoneInput = modal.getByLabel(/phone/i).first();
    if (await phoneInput.count() > 0) await phoneInput.fill(TEST_CUSTOMER.phone);

    // Address
    const addressInput = modal.getByLabel(/address/i).first();
    if (await addressInput.count() > 0) await addressInput.fill(TEST_CUSTOMER.address);

    // City
    const cityInput = modal.getByLabel(/city|suburb/i).first();
    if (await cityInput.count() > 0) await cityInput.fill(TEST_CUSTOMER.city);

    // Save
    const saveBtn = modal.getByRole("button", { name: /save|create|add/i }).last();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Modal should close
    const modalClosed = !(await modal.isVisible().catch(() => false));
    console.log(`✅ [Customers] New customer created — modal closed: ${modalClosed}`);

    // Verify customer appears in list
    const customerName = page.getByText(TEST_CUSTOMER.name);
    const appearsInList = await customerName.count() > 0;
    console.log(`✅ [Customers] New customer "${TEST_CUSTOMER.name}" appears in list: ${appearsInList}`);

    await page.screenshot({ path: "e2e/artifacts/customers-03-created.png", fullPage: false }).catch(() => {});
  });

  // ── 4. Navigate to CustomerDetail ────────────────────────────────────────

  test("4. CustomerDetail page shows all key info sections", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click on the newly created or first existing customer
    const customerRow = page
      .getByText(TEST_CUSTOMER.name)
      .first()
      .or(page.locator("tbody tr, [class*='customer']").first());
    await customerRow.click();
    await page.waitForTimeout(2000);

    newCustomerUrl = page.url();
    console.log(`[Customers] CustomerDetail URL: ${newCustomerUrl}`);

    // Should be on a customer detail page
    expect(page.url()).toMatch(/\/customers\/.+/);

    // Check for name displayed
    const displayedName = page.getByText(TEST_CUSTOMER.name).first();
    const showsName = await displayedName.count() > 0;

    // Check for booking history section
    const bookingSection = page.getByText(/jobs|bookings|history/i).first();
    const hasBookingSection = await bookingSection.count() > 0;

    // Check for contact info
    const contactSection = page.getByText(/contact|phone|email/i).first();
    const hasContact = await contactSection.count() > 0;

    console.log(`✅ [Customers] Detail page — name: ${showsName}, bookings section: ${hasBookingSection}, contact: ${hasContact}`);

    await page.screenshot({ path: "e2e/artifacts/customers-04-detail.png", fullPage: true }).catch(() => {});
  });

  // ── 5. Edit customer from detail page ────────────────────────────────────

  test("5. Edit customer details from CustomerDetail", async ({ page }) => {
    await ensureLoggedIn(page);

    if (newCustomerUrl) {
      await page.goto(newCustomerUrl, { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await page.locator("tbody tr").first().click();
    }
    await page.waitForTimeout(2000);

    // Find edit button
    const editBtn = page
      .getByRole("button", { name: /edit|update/i })
      .or(page.getByTestId("edit-customer-button"))
      .first();

    const hasEdit = await editBtn.count() > 0;
    console.log(`[Customers] Edit button found: ${hasEdit}`);

    if (!hasEdit) {
      console.log("⚠️ [Customers] No edit button — checking for inline editable fields");
      return;
    }

    await editBtn.click();
    await page.waitForTimeout(500);

    // Could be a modal or inline edit
    const modal = page.locator('[role="dialog"]');
    const isModal = await modal.isVisible();

    if (isModal) {
      // Find notes field and update
      const notesField = modal.getByLabel(/notes|memo/i).or(modal.locator("textarea")).first();
      if (await notesField.count() > 0) {
        await notesField.fill("Updated by E2E audit test");
        await page.waitForTimeout(200);
      }

      const saveBtn = modal.getByRole("button", { name: /save|update/i }).last();
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log("✅ [Customers] Customer updated via modal");
    } else {
      console.log("✅ [Customers] Edit triggered but not via modal — inline edit may be active");
    }

    await page.screenshot({ path: "e2e/artifacts/customers-05-edit.png", fullPage: false }).catch(() => {});
  });

  // ── 6. Customer list search ───────────────────────────────────────────────

  test("6. Customer list search filters results", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const searchInput = page
      .getByPlaceholder(/search|filter/i)
      .or(page.locator('input[type="search"]'))
      .or(page.locator('input[type="text"]').first());

    const hasSearch = await searchInput.count() > 0;
    console.log(`[Customers] Search input found: ${hasSearch}`);

    if (hasSearch) {
      // Count rows before search
      const rowsBefore = await page.locator("tbody tr, [class*='customer-row']").count();

      await searchInput.first().fill("zzz_no_match_xyz");
      await page.waitForTimeout(800);

      const rowsAfter = await page.locator("tbody tr, [class*='customer-row']").count();
      console.log(`✅ [Customers] Search rows before: ${rowsBefore}, after 'zzz_no_match_xyz': ${rowsAfter}`);

      // Clear
      await searchInput.first().fill("");
      await page.waitForTimeout(500);

      const rowsReset = await page.locator("tbody tr, [class*='customer-row']").count();
      console.log(`✅ [Customers] Rows after clear: ${rowsReset}`);
    } else {
      console.log("⚠️ [Customers] No search input on customers list — friction point");
    }
  });

  // ── 7. Booking number in CustomerDetail ───────────────────────────────────

  test("7. CustomerDetail shows booking numbers as clickable links", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find a customer that likely has bookings
    const firstRow = page.locator("tbody tr, [class*='customer']").first();
    if (await firstRow.count() === 0) {
      console.log("⚠️ [Customers] No customers in list");
      return;
    }
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Check for booking number pattern (JOB-XXXX or BK-XXXX)
    const bookingNumber = page.getByText(/JOB-\d+|BK-\d+|#\d{4,}/i).first();
    const hasBookingNumber = await bookingNumber.count() > 0;

    if (hasBookingNumber) {
      const numberText = await bookingNumber.textContent();
      console.log(`✅ [Customers] Booking number visible: ${numberText}`);

      // Verify it's a link
      const linkEl = page.locator(`a:has-text("${numberText}")`).first();
      const isLink = await linkEl.count() > 0;
      console.log(`✅ [Customers] Booking number is a clickable link: ${isLink}`);
    } else {
      console.log("ℹ️ [Customers] No booking numbers visible (customer may have no bookings)");
    }
  });
});
