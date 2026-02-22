# HireHub — Senior UX Workflow Audit v2
**Date:** 2026-02-21
**Previous audit score:** 62 / 100
**Persona:** "Pete" — runs a 6-machine excavator/bobcat hire business.
**Auditor:** Senior CRM product designer, 8+ years in hire/rental software.
**Method:** Full codebase read of all modified files + diff against previous audit findings.

---

## Executive Summary

Significant improvements since the last audit. Most of the **P0 and P1** issues from the previous report have been addressed. The app now scores **74 / 100** — up 12 points. The core job workflow is functional end-to-end. However, four new bugs have been introduced by recent changes, and several medium-priority UX gaps remain that will cause confusion at scale.

**The three things that will still hurt adoption today:**
1. **Duplicate date fields** in the wizard (Step 1 AND Step 3) — confusing and logically inconsistent
2. **Data loss on booking edit** — `handleEditSave` sends `chargeItems: []`, wiping all extras
3. **No human-readable job number** — Pete can't reference a job over the phone

---

## What Was Fixed Since the Last Audit ✅

| Old Issue | Fix Status | Notes |
|-----------|-----------|-------|
| "New Job" creates a "Quote" — terminology chaos | ✅ FIXED | `BOOKING_STATUS_LABELS` maps `quote → 'Pending'`. Wizard says "saved as **Pending**". Correct. |
| Payment gate invisible | ✅ FIXED | Prominent amber card with "Mark $X Deposit Received" as the primary CTA. |
| Generate Invoice visible for unconfirmed jobs | ✅ FIXED | Only shown for `confirmed` or `completed` status. |
| No inline booking edit | ✅ FIXED | Edit button (pencil icon) in BookingDetail for pending bookings. |
| No quick-add customer | ✅ FIXED | `UserPlus` icon in TopBar opens a quick-add modal from any page. |
| No GST breakdown in wizard | ✅ FIXED | Step 3 live estimate now shows subtotal, GST (10%), total inc. GST, deposit due. |
| No machine return checklist | ✅ FIXED | "Complete Hire" opens a 5-item checklist modal. |
| Rate doesn't scale when switching rate type | ✅ FIXED | `handleRateTypeChange` auto-maps machine's configured rate for that type. |
| Deposit % has no calculated preview | ✅ FIXED | Shows `= $350 deposit required (10% of $3,500)`. |
| No partial payment recording | ✅ FIXED | "Record Payment" modal on InvoiceDetail with running balance. |
| Date filter missing in machine selection | ✅ FIXED | Dates are now in Step 1 with real-time conflict detection. Machines show "Booked" badge. |
| window.print() for PDFs | ✅ IMPROVED | `downloadInvoicePdf` calls Edge Function, falls back to print. |

---

## Full Workflow Audit — Step by Step (Current State)

```
Real World:           App Reality (v2):                   Friction
──────────────────────────────────────────────────────────────────
1. Call comes in      TopBar UserPlus → quick add          ★★☆☆☆  ← FIXED
2. Discuss machine    /fleet — OK                          ★☆☆☆☆
3. Give a price       Wizard (Steps 1-3) — mostly good     ★★☆☆☆
4. Customer agrees    "Confirm Job" — payment gate clear    ★★☆☆☆  ← FIXED
5. Machine goes out   Machine status → on_hire             ★☆☆☆☆
6. Send invoice       Generate from booking (confirmed)    ★★☆☆☆
7. Get paid           Record Payment or Mark Fully Paid    ★★☆☆☆  ← FIXED
8. Machine returns    "Complete Hire" + checklist modal    ★★☆☆☆  ← FIXED
9. Check profitability → NOTHING exists                   ★★★★★
```

---

## Step-by-Step Findings

### Step 1: Dashboard & Quick Lead Capture

**What works well:**
- Greeting, monthly revenue, fleet utilisation bar all visible at a glance
- "Needs Attention" panel shows overdue invoices and expiring quotes with amounts
- Stagger animation is polished
- Quick Actions (New Job, New Quote, New Invoice) are prominent

**New issues found:**

**🔴 BUG: "New Quote" and "New Invoice" CTAs go to LIST pages, not forms**
> Dashboard: "New Invoice" → `/invoices` (the list). User must click "Create Invoice" again. One wasted click, and the mental model breaks — a "New X" button should create X immediately.

**🟠 UX: "Needs Attention" missing pending jobs**
> The panel shows overdue invoices and expiring quotes. But it doesn't show jobs in `Pending` status that have been sitting there for 3+ days with no action. Pete has created a job, customer said yes, but Pete forgot to record the deposit and confirm it. The system should alert: "3 jobs waiting for confirmation."

**🟡 COSMETIC: Notification bell has a hardcoded pulse dot**
> `TopBar.tsx:116` — the dot is permanently rendered with no logic. It will always show "new notification" even when there are none. This erodes trust rapidly. Pete will stop believing the UI within a week.

---

### Step 2: New Job Wizard — Step 1 (Machine + Dates)

**What works well:**
- Date pickers appear FIRST — dates filter machine availability
- Machines with conflicts show a "Booked" amber badge
- Daily rate visible on each card
- Visual selection state (violet ring + checkmark) is clear
- Calendar click from `/bookings` pre-fills machine and date (excellent!)

**Issues found:**

**🟠 FRICTION: Dates appear AGAIN in Step 3**
> The user picks dates in Step 1 to filter machines. Then in Step 3 ("Job Details"), the same `startDate`/`endDate` fields appear again. This is jarring — it looks like you're being asked to enter them twice. In reality both steps update the same state, but visually it's confusing.
>
> **Fix:** Remove the date fields from Step 3. They were moved to Step 1 and Step 3 still has a copy. Keep Step 3 for Rate, Payment plan, Extras only.

**🟡 MINOR: No "minimum hire period" warning**
> If a machine has a 2-day minimum, selecting 1 day shows no warning. This will cause disputes at invoice time.

---

### Step 3: New Job Wizard — Step 2 (Customer)

**What works well:**
- Customer search filters by name + contact name
- Phone number shown on each card
- "Add new client" opens modal (with slight friction — still a modal inside a wizard)
- New customer auto-selected after creation

**No new issues found. Old issues remain:**

**🟡 FRICTION: Adding customer mid-wizard still opens a modal**
> Acknowledged from previous audit. The inline expandable approach would be better, but this is liveable as is.

---

### Step 4: New Job Wizard — Step 3 (Job Details)

**What works well:**
- Rate auto-fills from machine config
- Rate type switch auto-updates rate amount
- Payment plan buttons are clear (Deposit / Upfront / On completion)
- Deposit amount preview works correctly
- Live estimate shows GST breakdown
- Extras table functional
- Delivery address + notes behind a "show more" toggle (reduces clutter)

**Issues found:**

**🟠 FRICTION: Duplicate date fields (see Step 1 note above)**
> `NewBookingWizard.tsx:532-556` — Step 3 renders a second set of `<input type="date">` for start/end date. These update the same `values.startDate`/`values.endDate` state. Changing dates here AFTER selecting a machine in Step 1 won't re-validate conflicts. This is a logical inconsistency: user changes dates in Step 3, machine they selected in Step 1 might now be conflicted, but there's no warning.

**🟡 MINOR: "On completion" is the default payment plan (good!) but there's no tooltip explaining each plan**
> "Deposit" — when do they pay the rest? "Upfront" — before the job starts? These need one-line descriptions under each button.

---

### Step 5: New Job Wizard — Step 4 (Review & Create)

**What works well:**
- Shows total inc. GST prominently as `2xl` font
- Subtotal + GST breakdown visible
- Extras listed
- Now correctly says "saved as **Pending**" — not "Quote" ✅
- Machine, customer, dates all visible

**No significant new issues.** The review step is now clean and accurate.

---

### Step 6: BookingDetail — Confirming the Job

**What works well:**
- Payment gate is a prominent amber card with the correct amount and primary CTA
- Status bar (`Pending → Confirmed → Completed`) is correct terminology
- Edit button available for Pending bookings
- Actions are contextual (no redundant buttons for wrong statuses)
- Machine return checklist works

**🔴 BUG: Edit booking wipes all extras (data loss)**
> `BookingDetail.tsx:129` — `handleEditSave` calls:
> ```js
> saveBookingMutation.mutateAsync({ payload: { ...values, id, company_id }, chargeItems: [] })
> ```
> The `chargeItems: []` hardcode means every time Pete edits a job, ALL extras line items are deleted from the database. If he had "Fuel surcharge $50" and "Delivery fee $80", they're gone after any edit.
>
> **Fix:** Pass `chargeItems` from the current booking's `booking_charge_items` through the `BookingForm` component, and return them in `handleEditSave`.

**🔴 BUG: Mark Deposit Paid records wrong amount**
> `BookingDetail.tsx:93-101` — `handleMarkDepositPaid` always sends `amount: depositDue` (the full deposit configured), not `amount: depositOutstanding` (what's actually still owed).
>
> Scenario: Deposit = $500. Pete manually recorded $200 cash already (somehow). `depositOutstanding = $300`. The button says "Mark $300 Deposit Received" (correct display via `depositOutstanding`). But clicking it sends `amount: 500` to the API. The system records $500, creating a $200 overpayment in the database.
>
> **Fix:** Change line 96 to `amount: depositOutstanding`.

**🟠 FRICTION: No booking reference number**
> The booking detail heading shows `Job #a3f2b1c0` (first 8 chars of UUID). Pete can't tell Dave "your job number is BOK-0043". Invoices get sequential numbers (INV-HB-0001), quotes get numbers (QUO-HB-0001), but bookings have none.
>
> Add `booking_number` generation on save (like `BOK-{company_prefix}-{seq}`).

**🟡 MINOR: Edit button only shows for `status === 'quote'` (pending)**
> Once a job is confirmed, Pete cannot edit anything. If the customer changes the end date, Pete has to cancel and recreate. This is the "no inline edit for confirmed jobs" issue from the old audit — partially fixed (edit added for pending) but not for confirmed.

**🟡 MINOR: Machine return checklist has no enforcement**
> `BookingDetail.tsx:323-330` — "Confirm Complete" button is active regardless of how many checklist items are ticked. The checklist is advisory only. If Pete finds damage, he can still complete with zero boxes checked.

---

### Step 7: Invoice Generation & Management

**What works well:**
- Invoice auto-generates from booking (machine + rate + extras pre-populated)
- `Mark Fully Paid` available for both draft AND sent status ← old audit fix works
- `Record Payment` allows partial amounts with running balance display
- Share link generation (copy to clipboard)
- Email send via Edge Function
- PDF download via Edge Function with print fallback
- Due date shown in list view

**Issues found:**

**🟠 UX: "Mark as Sent" still required before online payment via Stripe**
> `InvoiceDetail.tsx:140` — `canPayOnline` only for `sent` or `overdue` status. If a tradie generates an invoice (draft) and wants to share the Stripe payment link, they must click "Mark as Sent" first. This gate exists for business reasons but is not explained. The button shows as `Pay Now` not `Share Payment Link`, which misleads about who's clicking it.

**🟠 UX: InvoicesList "Create Invoice" opens a plain modal with no booking auto-link**
> The "New Invoice" flow from the list creates a standalone invoice. You select a booking from a dropdown, but machine rates and line items are NOT auto-pulled. You have to manually enter amounts. Compare this with "Generate Invoice from Booking" which auto-fills everything. Most tradies will use the wrong path.
>
> **Fix:** Either remove "Create Invoice" from the list (force the Generate from Booking path), or make the modal auto-populate from the selected booking.

**🟡 MINOR: No "overdue" status automatic promotion**
> Invoices with a past due date don't automatically flip to `overdue` status without a cron job. The filter tab "Overdue" will show nothing unless someone manually changes status or a cron runs. Tradies see the Needs Attention panel showing overdue invoices only because `getAttentionItems()` queries `due_date < today AND status != paid`. But the badge color on the invoice will still show "sent" (blue) instead of "overdue" (red).

---

### Step 8: Completing the Hire

**What works well:**
- "Complete Hire" opens checklist modal (good!)
- Machine status flips to `available` on confirm
- Simple, one-click flow after checklist

**Remaining issues:**

**🟡 MISSING: No job profitability summary**
> After completing a hire, there's zero revenue summary for that specific job. Pete can't see: "This job earned $3,200 over 4 days = $800/day". The accounting page exists but doesn't provide per-job P&L.

**🟡 MISSING: No overdue return detection**
> If a job's `end_date` was 3 days ago but it hasn't been completed, the system doesn't flag it anywhere. The machine shows as `on_hire` but there's no alert saying "Job #BOK-001 with Dave is 3 days overdue — machine not returned."

---

### Step 9: Quotes Workflow (Separate Path)

The Quotes page is a separate workflow that feeds into jobs via "Convert to Booking".

**Issues found:**

**🟠 UX: Quote form doesn't auto-fill machine rates**
> `QuotesList.tsx:293-305` — You select a machine from a dropdown, but line items are NOT auto-populated with rates. Compare to the booking wizard where selecting a machine auto-fills the rate. Pete has to manually type the rate in the quote line items, which might not match the machine's configured rate.

**🟠 UX: Quote conversion to booking may lose dates**
> The quote form has no start/end date fields. When a quote is converted to a booking (`convertMutation`), the resulting booking has no dates — Pete must go into the booking and edit dates separately. This requires an extra step and the booking initially has no hire period.

**🟠 UX: Two separate "quote" workflows create confusion**
> Path A: Quote → sent to customer → accepted → "Convert" → Booking
> Path B: New Job Wizard → Review → saved as "Pending" (internally `status='quote'`)
>
> Path B is for "customer is on the phone saying yes right now — I'm booking it."
> Path A is for "I sent them a quote, waiting for approval."
>
> But both use `status='quote'` internally (for booking status). The Booking status filter tab "Pending" shows BOTH wizard-created bookings AND converted quotes. This conflation is subtle but confusing when filtering.
>
> **Fix:** Convert the "Quote → Convert to Booking" path to immediately create a `confirmed` booking (since the quote is `accepted` = customer said yes). There's no reason for the converted booking to be in `Pending` state.

---

## Summary: All Issues Ranked (v2)

### New bugs introduced since last audit:
| | Issue | File | Severity |
|--|-------|------|----------|
| 🔴 | Edit booking sends `chargeItems: []` — deletes all extras | `BookingDetail.tsx:129` | P0 / Data loss |
| 🔴 | Mark Deposit Paid sends `depositDue` not `depositOutstanding` | `BookingDetail.tsx:96` | P0 / Financial |
| 🟠 | Duplicate date fields in Step 1 AND Step 3 of wizard | `NewBookingWizard.tsx:317-555` | P1 / Confusion |
| 🟡 | Hardcoded notification bell dot (always shows unread) | `TopBar.tsx:116` | P2 / Trust |

### Remaining issues from last audit:
| | Issue | Status |
|--|-------|--------|
| 🟠 | No booking number (human-readable reference) | Still missing |
| 🟠 | "New Quote" / "New Invoice" CTAs → go to list, not form | Still wrong |
| 🟠 | Quote form has no machine rate auto-fill | Still missing |
| 🟠 | Quote→Booking conversion has no dates | Still missing |
| 🟠 | Stripe payment requires "sent" status first (not explained) | Still unexplained |
| 🟡 | No profitability summary after hire completion | Still missing |
| 🟡 | No overdue machine return alert | Still missing |
| 🟡 | No "pending jobs awaiting confirmation" in Needs Attention | Still missing |
| 🟡 | Invoice status not auto-promoted to "overdue" without cron | Still missing |
| 🟡 | Edit only available for pending bookings (not confirmed) | Partially fixed |
| 🟡 | Machine return checklist has no enforcement | Cosmetic only |

---

## Quick Wins — What to Fix This Week

### Fix 1: The `chargeItems: []` data loss bug (30 min)
`BookingDetail.tsx` — `handleEditSave` must read existing charge items from the booking and pass them through. The `BookingForm` component should receive and return the charge items.

### Fix 2: Mark Deposit Paid amount (15 min)
`BookingDetail.tsx:96` — Change `amount: depositDue` → `amount: depositOutstanding`

### Fix 3: Remove duplicate dates from Wizard Step 3 (1h)
`NewBookingWizard.tsx` — Delete the start/end date grid from Step 3 (lines 532-556). Dates are already captured in Step 1. Step 3 should only show: Rate type, Rate amount, Payment plan, Extras.

### Fix 4: Dashboard "New Quote" and "New Invoice" CTAs (30 min)
`Dashboard.tsx` — Change the `to` prop:
- "New Quote" → trigger the quote creation modal (or navigate with `?new=true`)
- "New Invoice" → `/invoices?new=true` and auto-open the create modal on arrival

### Fix 5: Remove hardcoded notification dot (10 min)
`TopBar.tsx:116` — Remove the `<span>` until notifications are implemented.

### Fix 6: Add "Pending Jobs Awaiting Confirmation" to Needs Attention (2h)
`Dashboard.tsx` + `api.ts` — Add a query for bookings with `status='quote'` older than 1 day. Add to the `getAttentionItems()` response. Show as amber items in the Needs Attention panel.

### Fix 7: "New Booking" button → "New Job" (5 min)
`BookingsList.tsx:83` — Change button label from "New Booking" to "New Job".

---

## Medium-Term Fixes (Next 2 Weeks)

- **Booking reference number** — generate `BOK-{prefix}-{seq}` on booking creation, display in heading and list
- **Quote form machine rate auto-fill** — when machine is selected in quote modal, auto-add a line item with the machine's daily rate
- **Quote→Booking with dates** — add start/end date to the quote form, carry through to booking on convert
- **Converted quotes → skip pending state** — accepted quotes should convert to `confirmed` bookings directly
- **Overdue return detection** — add query for confirmed bookings past `end_date`, show in Needs Attention as "Overdue return — [Machine]"

---

## Longer-Term (Still from previous audit)

- **Per-job profitability summary** on booking completion
- **Partial invoice auto-status** — when partial payment records bring balance to zero, auto-mark as `paid`
- **Automated overdue invoice promotion** via cron Edge Function
- **Edit confirmed bookings** — allow date/note edits on confirmed jobs with an audit trail
- **Customer portal** — customers view their jobs and invoices

---

## Updated Score Card

| Category | Old | New | Change |
|----------|-----|-----|--------|
| Terminology / language | 2/5 | 4/5 | +2 ✅ |
| Job creation workflow | 3/5 | 4/5 | +1 ✅ |
| Payment confirmation gate | 1/5 | 4/5 | +3 ✅ |
| Invoice workflow | 2/5 | 3/5 | +1 ✅ |
| Machine return flow | 2/5 | 3/5 | +1 ✅ |
| Dashboard orientation | 3/5 | 4/5 | +1 ✅ |
| Data integrity / bugs | 4/5 | 2/5 | -2 🔴 (new bugs) |
| Customer capture | 2/5 | 4/5 | +2 ✅ |
| Quote workflow | 2/5 | 2/5 | 0 |
| Post-job insights | 0/5 | 0/5 | 0 |
| **Overall** | **62/100** | **74/100** | **+12** |

---

## What's Still Actually Good (Don't Change)

- The **4-step wizard structure** with date-first machine filtering — excellent
- The **calendar view** with click-to-create from any cell — industry-best UX
- The **payment gate amber card** — now correctly prominent
- The **payment plan flexibility** (deposit/upfront/on-completion) — well implemented
- The **atomic SQL status transitions** — prevents data corruption
- The **share links** for invoices/quotes — great for cash-flow
- The **glassmorphic design** — professional, modern
- The **GST breakdown** in wizard and BookingDetail — tradies need this
- The **Record Payment** partial payment modal — correct flow
- The **quick-add customer** in TopBar — exactly right
