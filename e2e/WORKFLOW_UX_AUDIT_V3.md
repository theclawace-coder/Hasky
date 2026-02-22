# HireHub — Senior UX Workflow Audit v3
**Date:** 2026-02-21
**Previous audit score:** 74 / 100 (v2)
**Persona:** "Pete" — runs a 6-machine excavator/bobcat hire business.
**Auditor:** Senior CRM product designer, 8+ years in hire/rental software.
**Method:** Full deep-read of current source code across all key pages + diff against v2 findings.
**Files examined:** `Dashboard.tsx`, `NewBookingWizard.tsx`, `BookingDetail.tsx`, `BookingsList.tsx`,
`InvoiceDetail.tsx`, `InvoicesList.tsx`, `QuotesList.tsx`, `TopBar.tsx`, `BookingStatusBar.tsx`,
`constants.ts`, `api.ts` (getBookings, getAttentionItems).

---

## Executive Summary

Six of the eight bugs flagged in v2 have been fixed. The app is noticeably more polished. Score moves to
**79 / 100** — up 5 points. However this audit reveals **five new issues** not found before, including one
that is quietly corrupting Pete's dashboard every day, and one dangerous single-click action that can
silently cancel confirmed jobs on mobile.

**The three things that will still hurt adoption today:**
1. **"Upcoming Jobs" shows cancelled and completed jobs** — Dashboard query has no status filter. Pete's
   "upcoming" panel is polluted with noise.
2. **The Cancel button on BookingDetail has zero confirmation** — one misclick on mobile and the job is
   gone with no undo.
3. **InvoiceDetail action bar has 7–8 buttons with no hierarchy** — Pete doesn't know what to click next
   on the most important page in the app.

---

## What Was Fixed Since v2 ✅

| Old Issue | Fix Status | Evidence |
|-----------|-----------|----------|
| Edit booking sends `chargeItems: []` — data loss | ✅ FIXED | `BookingDetail.tsx:129` now maps `chargeItems` correctly |
| Mark Deposit Paid sends `depositDue` not `depositOutstanding` | ✅ FIXED | Line 95: `amount: depositOutstanding` |
| Duplicate date fields in Step 1 AND Step 3 | ✅ FIXED | Step 3 shows compact "summary + Change link" when dates set |
| Hardcoded notification bell pulse dot | ✅ FIXED | No `<span>` dot in `TopBar.tsx` |
| "New Quote" CTA goes to list page | ✅ FIXED | `to="/quotes?new=true"` auto-opens modal |
| "New Invoice" CTA goes to list page | ✅ FIXED | `to="/invoices?new=true"` auto-opens modal |
| Quote form doesn't auto-fill machine rates | ✅ FIXED | `handleMachineChange` in `QuotesList.tsx:63` auto-adds line item |

---

## Full Workflow Audit — Step by Step (Current State)

```
Real World:           App Reality (v3):                   Friction
──────────────────────────────────────────────────────────────────
1. Call comes in      TopBar UserPlus → quick add          ★☆☆☆☆  ← clean
2. Discuss machine    /fleet — OK                          ★☆☆☆☆
3. Give a price       Wizard Steps 1-3 — mostly solid      ★★☆☆☆
4. Customer agrees    "Confirm Job" — payment gate clear    ★★☆☆☆
5. Machine goes out   Machine → on_hire                    ★☆☆☆☆
6. Send invoice       Generate from confirmed booking       ★★☆☆☆
7. Get paid           7 buttons, no clear next step        ★★★★☆  ← NEW problem
8. Machine returns    "Complete Hire" + checklist           ★★☆☆☆
9. Check profitability → NOTHING exists                   ★★★★★
```

---

## Step-by-Step Findings

### Step 1: Dashboard

**What works well:**
- Greeting, monthly revenue, fleet utilisation bar — great at a glance
- "Needs Attention" shows overdue invoices, expiring quotes, AND pending jobs — excellent
- Quick Actions now correctly open forms directly (no intermediate list page)
- Stagger animation polished

---

**🔴 BUG: "Upcoming Jobs" includes cancelled and completed bookings**

> `Dashboard.tsx:54-57` — `upcomingQuery` calls:
> ```js
> getBookings({ dateFrom: new Date().toISOString().split('T')[0] })
> ```
> `getBookings()` with only `dateFrom` does NOT filter by status (`api.ts:297-298` — status filter
> only applied when passed). So any cancelled or completed booking whose `start_date` is today or
> later will appear in "Upcoming Jobs". Pete sees "14t Excavator — Smith Bros — CANCELLED" in his
> upcoming list every morning.
>
> **Fix:** Add `{ dateFrom: today, status: 'confirmed' }` to the upcomingQuery, or filter client-side
> to exclude `cancelled` and `completed`.

---

**🟡 COSMETIC: Revenue hero says "You've collected $0 this month" on day 1**
> When `paidThisMonth = 0`, the sentence "You've collected $0 this month" is demoralising for a new
> user. Consider showing "Get started by creating your first job" instead when stats are zero.

---

### Step 2: New Job Wizard — Step 1 (Machine + Dates)

**What works well:**
- Date pickers appear FIRST — dates filter machine availability ✅
- Machines with conflicts show "Booked" amber badge ✅
- Daily rate visible on each card ✅
- Visual selection state (violet ring + checkmark) is clear ✅

---

**🟠 FRICTION: Date conflict detection can be bypassed**

> Wizard Step 1 shows date pickers but they're optional — `nextDisabled={!values.machine}` only
> requires a machine to proceed. If Pete picks a machine without entering dates, the conflict check
> `conflictedMachineIds` is empty (it returns early on `!values.startDate`).
>
> Pete then enters dates in Step 3. The machine he selected in Step 1 might now be booked for those
> dates — but no warning ever appears. He can create a double-booked job.
>
> **Fix:** Either require dates in Step 1 before the machine grid appears, or re-run conflict
> detection in Step 3 and warn: "⚠️ This machine has a confirmed booking overlapping your dates."

---

**🟡 MINOR: "Available" machines include status='available' but NOT date-checked by default**
> `availableMachines` filters `m.status === 'available'`. A machine could be `status='available'`
> but have a confirmed booking next week. The date filter only marks them as "Booked" — they're
> still selectable. Acceptable, but a tooltip would help: "Available today but booked Feb 24-28."

---

### Step 3: New Job Wizard — Step 2 (Customer)

**No new issues found.** The "Add new client" modal inside wizard is still slightly disorienting
(noted in v1, acknowledged as liveable). Customer search with phone number showing is correct.

---

### Step 4: New Job Wizard — Step 3 (Job Details)

**What works well:**
- Dates show as a compact summary with "Change" link when already set ✅
- Rate auto-fills from machine config, switches correctly when rate type changes ✅
- Payment plan buttons clear, deposit preview correct ✅
- GST breakdown in live estimate ✅
- Extras table functional ✅
- Delivery address + notes behind a "show more" toggle (reduces clutter) ✅

**No new issues found on this step.**

---

### Step 5: New Job Wizard — Step 4 (Review & Create)

**What works well:**
- Correctly says "saved as **Pending**" ✅
- Shows total inc. GST as large number ✅
- Extras listed ✅
- Machine, customer, dates, payment plan all visible ✅

**No new issues found. This step is now clean.**

---

### Step 6: BookingDetail — Confirming the Job

**What works well:**
- Payment gate amber card with correct amount and primary CTA ✅
- Status bar (Pending → Confirmed → Completed) uses correct terminology ✅
- Edit button available for Pending bookings ✅
- chargeItems preserved on edit (v2 bug fixed) ✅
- Deposit paid uses `depositOutstanding` not `depositDue` (v2 bug fixed) ✅

---

**🔴 BUG: Cancel button has no confirmation dialog**

> `BookingDetail.tsx:257` and `:268` — Both "Cancel" buttons (one for pending, one for confirmed)
> fire immediately:
> ```js
> <Button variant="danger" onClick={() => void handleStatusChange('cancelled', 'available')}>
>   Cancel
> </Button>
> ```
> No `window.confirm()`, no modal, no "Are you sure?". On a mobile device, "Cancel" sits right
> beside "Confirm Job". One misclick and a confirmed job with a paying customer is silently
> cancelled. Machine goes back to available, booking is gone. Pete has no undo.
>
> **Fix (15 min):** Wrap in a `useState` modal: "Are you sure you want to cancel this job? This
> cannot be undone." with Confirm / Go Back buttons.

---

**🟠 FRICTION: No human-readable booking number** *(still from v2)*

> `BookingDetail.tsx:151` — `Job #a3f2b1c0` (UUID truncated). Pete can't tell Dave over the phone
> "your job number is BOK-0043". Invoices and quotes both have sequential numbers — bookings don't.
>
> **Fix:** Generate `BOK-{company_prefix}-{seq}` on booking creation, same pattern as invoices.

---

**🟡 MINOR: BookingStatusBar doesn't distinguish "done" from "current"**

> `BookingStatusBar.tsx:21-27` — All steps at or before the current index get the same
> `border-blue-200 bg-blue-50 text-blue-700` style. So a Completed job shows all three boxes as
> identical blue. Pete can't tell which box is the current state vs which are done.
>
> **Fix:** Use a different style for past steps (e.g. emerald with a ✓) vs the current active step
> (violet/blue). E.g: done = `bg-emerald-50 text-emerald-700`, current = `bg-violet-100 text-violet-700`.

---

**🟡 MINOR: Edit only available for `status === 'quote'` (pending)**

> Once a job is confirmed, Pete cannot change dates or notes. If the customer pushes back their
> start date, Pete has to cancel and recreate. This was noted in v2. Still not fixed.

---

### Step 7: InvoiceDetail — Send and Collect Payment

**What works well:**
- PDF download via Edge Function with print fallback ✅
- `Mark Fully Paid` available on both draft AND sent status ✅
- `Record Payment` partial payment modal with running balance ✅
- Share link + email send ✅

---

**🔴 UX: Action bar has 7–8 buttons with no visual hierarchy**

> When an invoice is in `sent` status, the header action area renders ALL of:
> 1. `Record Payment` (secondary)
> 2. `Mark Fully Paid` (success — green, but same size as others)
> 3. `Pay Now — $X,XXX` (primary — violet)
> 4. `Send Email` (secondary)
> 5. `Copy Link` (secondary)
> 6. `Download PDF` (secondary)
> 7. `Print` (secondary)
>
> Seven buttons. Six of them look identical (secondary grey). There's no "What should I do right
> now?" guidance. Pete, who just wants to record that a customer paid by bank transfer, sees 7
> options and doesn't know where to start.
>
> **Fix:** Group actions into two zones:
> - **Primary zone**: "Record Payment" as the largest button (most common action for a tradie)
> - **Secondary zone**: collapse "Send Email", "Copy Link", "Download PDF", "Print" into a `⋮` More
>   actions dropdown or a 2-column grid below the invoice
>
> For a paid invoice: collapse everything except "Download PDF" — the job is done.

---

**🟠 UX: No "View Job" link from InvoiceDetail** *(new)*

> An invoice has a `booking_id` but InvoiceDetail shows no link back to the source booking.
> Pete generates an invoice, lands on InvoiceDetail, and if he wants to Complete the hire, he has
> to navigate back manually: Back to Invoices list → find booking → navigate. This is 3 steps.
>
> **Fix (10 min):** In `InvoiceDetail.tsx`, if `invoice.booking_id` exists, show a small
> "View Job →" link in the header below the invoice number.

---

**🟠 UX: "Record Payment" modal requires manually typing the full amount**

> The amount input has `placeholder={outstanding.toFixed(2)}` but no "Pay full outstanding"
> one-click button. Pete always wants to record the full remaining amount. He has to type it
> every time.
>
> **Fix (5 min):** Add a `<button>` next to the input: "Pay full ($1,200)" that sets
> `paymentAmount` to `outstanding.toFixed(2)`.

---

**🟠 UX: `canPayOnline` gate still unexplained**

> `InvoiceDetail.tsx:140` — `canPayOnline = invoice.status === 'sent' || invoice.status === 'overdue'`.
> Draft invoices don't show "Pay Now". No explanation shown to Pete about WHY it's not available on
> drafts. He sees the button appear after clicking "Mark as Sent" and wonders what changed.
>
> **Fix:** When status is draft, show a greyed "Pay Now" with tooltip: "Mark invoice as Sent to
> enable online payment."

---

**🟡 MINOR: Invoice status not auto-promoted to "overdue"**

> Without a cron job, `overdue` status is never set automatically. The "Overdue" filter tab on
> InvoicesList always shows 0 results. The Needs Attention panel works around this by querying
> `due_date < today AND status != paid` directly. But the badge on individual invoices shows "sent"
> (blue) even when 30 days overdue.
>
> **Fix:** Add a Supabase scheduled function (pg_cron or Edge Function with CRON schedule) that
> daily runs `UPDATE invoices SET status='overdue' WHERE status='sent' AND due_date < now()`.

---

### Step 8: InvoicesList

**What works well:**
- `?new=true` auto-opens create modal ✅
- Send Email + Copy Link actions per row ✅

---

**🟠 UX: No "Outstanding" or "Paid" amount column in InvoicesList**

> The invoice list shows: Invoice #, Customer, Total, Status, Issue, Due, Actions.
> But there's no "Outstanding" column. A tradie with 20 invoices can't scan the list to see which
> ones have partial payments. He has to click into each invoice to see the running balance.
>
> **Fix:** Add an `Outstanding` column: `formatCurrency(Math.max(invoice.total - (invoice.paid_amount ?? 0), 0))`.
> Show in red if outstanding > 0, green/grey if zero.

---

**🟡 MINOR: Searching/filtering by customer name not available on InvoicesList**

> Only status filter tabs. No text search. With 50+ invoices, finding "Dave's" invoice means
> scrolling through the entire list.

---

### Step 9: BookingsList

**What works well:**
- Calendar view with click-to-create — excellent ✅
- Status filter tabs correctly use `BOOKING_STATUS_LABELS` (shows "Pending" not "quote") ✅
- "New Job" button is clearly named ✅

---

**🟠 UX: No text search in list view**

> List view has status filter tabs but no search by customer or machine name.
> Pete has 30 jobs this month — finding Smith Bros' job requires scrolling.
>
> **Fix:** Add a search input above the table that filters `booking.customers?.name` and
> `booking.machines?.name` client-side (data is already loaded).

---

**🟡 MINOR: Calendar loads all bookings regardless of visible date range**

> `bookingsQuery` in `BookingsList.tsx:35` fetches all bookings with no date range filter.
> With 200+ bookings, this sends a huge payload every time the calendar loads.

---

### Step 10: QuotesList

**What works well:**
- Machine rate auto-fill via `handleMachineChange` (v2 bug fixed) ✅
- `?new=true` auto-opens create modal ✅
- Send + Copy Link per row ✅

---

**🟠 UX: Quotes with no expiry date never appear in "Needs Attention"**

> `api.ts:1229-1233` — `expiringQuotes` query filters `expiry_date <= soon`. If expiry_date is
> null (never set), these quotes are excluded. The create modal has expiry date as optional with no
> default. So Pete can create and send a quote, never set an expiry, and it disappears into the
> void — never flagged as expiring, never chased up.
>
> **Fix:** Default expiry date to 30 days from issue date in the create modal. Or flag
> `status='sent'` quotes with no expiry date older than 14 days as "Awaiting response" in the
> Needs Attention panel.

---

**🟠 UX: Accepted quote still converts to "Pending" booking, not "Confirmed"**

> `convertMutation` in `QuotesList.tsx:136-143` navigates to the new booking. The booking is
> created at `status='quote'` (Pending). But if a quote is `accepted`, the customer has already
> said yes — the job should be confirmed immediately, not pending.
>
> Path A: Customer called and said yes → New Job Wizard → "Pending" job (makes sense, deposit may
> be needed)
> Path B: Sent quote → Customer said yes → Mark "Accepted" → "Convert" → Also "Pending"?
>
> In Path B, the business logic is: the customer acceptance of a formal quote IS confirmation.
> Converting an accepted quote should create a `confirmed` booking.
>
> **Fix:** In `convertMutation` (or its API function), set the booking's initial status to
> `'confirmed'` and machine status to `'on_hire'` when converting an accepted quote.

---

**🟠 UX: "Convert" button is buried in a table Actions column**

> When a quote is `accepted`, the "Convert" button appears in the last column of the quotes table.
> On mobile, this column is off-screen. Pete doesn't see it.
>
> **Fix:** Show a prominent banner at the top of the QuoteDetail (or as a highlighted row) when
> status is `accepted`: "This quote has been accepted — Convert to Job."

---

### Step 11: TopBar — Notifications

**🟠 UX: Notification bell has no click handler and does nothing**

> `TopBar.tsx:109-115` — Bell button exists but has no `onClick` prop. It's a clickable element
> that does nothing. Pete clicks it, nothing happens. He tries again, waits, nothing. He wonders if
> the app is broken. Every time he sees it he loses a bit of confidence.
>
> **Fix (5 min):** Either wire it up (even to a placeholder "No notifications yet" toast) or remove
> the bell entirely until notifications are built. A dead button is worse than no button.

---

### Step 12: Settings Page

**🟡 SECURITY: Stripe secret key saved to Supabase via UI**

> `Settings.tsx` has a Stripe form that saves `publishable_key`, `secret_key`, and `webhook_secret`
> to Supabase. Storing a Stripe secret key in a database row that is accessible to frontend queries
> is a security risk. Any XSS or RLS misconfiguration could expose it.
>
> Secret keys should ONLY be environment variables in Edge Functions, never stored in the database.
>
> **Fix:** Remove the `secret_key` field from the Settings UI. Document that it must be set as a
> Supabase Edge Function secret (`supabase secrets set STRIPE_SECRET_KEY=sk_live_...`).

---

## Summary: All Issues Ranked (v3)

### New bugs / issues found in v3:

| | Issue | File | Severity |
|--|-------|------|----------|
| 🔴 | "Upcoming Jobs" includes cancelled/completed bookings | `Dashboard.tsx:54` | P0 / Noise |
| 🔴 | Cancel button has no confirmation dialog | `BookingDetail.tsx:257,268` | P0 / Data loss |
| 🔴 | InvoiceDetail: 7–8 buttons with no hierarchy | `InvoiceDetail.tsx:164` | P1 / UX |
| 🟠 | Notification bell does nothing when clicked | `TopBar.tsx:109` | P1 / Trust |
| 🟠 | Date conflict detection bypassed if dates skipped in Step 1 | `NewBookingWizard.tsx` | P1 / Data integrity |
| 🟠 | InvoicesList missing "Outstanding" column | `InvoicesList.tsx` | P2 / Visibility |
| 🟠 | No "View Job" link from InvoiceDetail | `InvoiceDetail.tsx` | P2 / Navigation |
| 🟠 | "Record Payment" has no "Pay full outstanding" quick-fill | `InvoiceDetail.tsx` | P2 / Friction |
| 🟠 | Quotes with no expiry never flagged in Needs Attention | `api.ts:1229` | P2 / Chase-up |
| 🟠 | BookingStatusBar: no visual distinction between done/current | `BookingStatusBar.tsx` | P2 / Clarity |
| 🟡 | No text search in BookingsList list view | `BookingsList.tsx` | P3 / Scale |
| 🟡 | Stripe secret key saved to database via UI | `Settings.tsx` | P3 / Security |

### Still-open from v2:

| | Issue | Status |
|--|-------|--------|
| 🟠 | No booking number (human-readable reference) | Still missing |
| 🟠 | Accepted quote converts to Pending, not Confirmed | Still wrong |
| 🟠 | Quote→Booking conversion has no dates | Still missing |
| 🟠 | Stripe payment requires "sent" status (not explained) | Still unexplained |
| 🟡 | Invoice status not auto-promoted to "overdue" | Still missing |
| 🟡 | No profitability summary after hire completion | Still missing |
| 🟡 | No overdue machine return alert | Still missing |
| 🟡 | Edit only for pending bookings (not confirmed) | Partially fixed |

---

## Quick Wins — Fix This Week

### Fix 1: Filter "Upcoming Jobs" by active status (30 min)
`Dashboard.tsx:54` — Change the query:
```js
queryFn: () => getBookings({
  dateFrom: new Date().toISOString().split('T')[0],
  status: 'confirmed',   // ← add this
}),
```
Or filter client-side: `.filter(b => !['cancelled', 'completed'].includes(b.status))`.

### Fix 2: Add Cancel confirmation modal (20 min)
`BookingDetail.tsx` — Add `const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)`.
Replace the Cancel button's `onClick` with `onClick={() => setCancelConfirmOpen(true)}`.
Add a minimal `<Modal>` with: "Cancel this job? The machine will be marked available. This cannot
be undone." + Confirm Cancel / Go Back.

### Fix 3: Simplify InvoiceDetail action bar (1h)
Group into two zones:
1. **Do it now** (full-width group): "Record Payment" primary, "Mark Fully Paid" secondary
2. **Share** (icon row below): Email • Copy Link • Download PDF • Print
This removes visual noise and gives Pete a clear next step.

### Fix 4: Wire up or remove notification bell (5 min)
`TopBar.tsx:109` — Either add `onClick={() => toast.info('No new notifications')}` as a placeholder,
or remove the `<button>` entirely until notifications are implemented.

### Fix 5: Add "View Job" link in InvoiceDetail (10 min)
```jsx
{invoice.booking_id && (
  <Link to={`/bookings/${invoice.booking_id}`} className="text-xs text-violet-600 hover:underline">
    View Job →
  </Link>
)}
```

### Fix 6: Add "Pay full outstanding" button to Record Payment modal (5 min)
```jsx
<button onClick={() => setPaymentAmount(outstanding.toFixed(2))} className="text-xs text-violet-600">
  Pay full ({formatCurrency(outstanding)})
</button>
```

### Fix 7: Default quote expiry to 30 days from today (5 min)
`QuotesList.tsx:34` — Change:
```js
const [expiryDate, setExpiryDate] = useState('');
```
to:
```js
const [expiryDate, setExpiryDate] = useState(
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
);
```

### Fix 8: Conflict re-check in Step 3 (45 min)
`NewBookingWizard.tsx:760` — In Step 3, after dates change, check `conflictedMachineIds`. If the
selected machine is in the conflicted set, show a warning banner:
```
⚠️ Heads up: [Machine Name] has a confirmed booking overlapping your selected dates.
   Go back to Step 1 to choose a different machine.
```

---

## Medium-Term Fixes (Next 2 Weeks)

- **Booking reference number** — generate `BOK-{prefix}-{seq}` on creation
- **"Outstanding" column on InvoicesList** — show outstanding balance per invoice
- **Accepted quote → Confirmed booking** — skip Pending state on convert
- **Text search on BookingsList list view** — filter by customer/machine name
- **BookingStatusBar done vs current styling** — emerald for done, violet for current
- **canPayOnline tooltip on draft** — explain why Pay Now is hidden on drafts
- **Stripe secret key**: remove from database, document as Edge Function env var

---

## Longer-Term (Still from previous audits)

- **Per-job profitability summary** on booking completion
- **Automated overdue invoice promotion** via cron Edge Function
- **Edit confirmed bookings** — date/note edits with audit trail
- **Overdue return detection** — confirmed jobs past `end_date`, show in Needs Attention
- **Customer job history page** — all bookings and invoices for a given customer
- **Payment reminders** — scheduled email reminders for overdue invoices

---

## Updated Score Card

| Category | v1 | v2 | v3 | Change |
|----------|----|----|-----|--------|
| Terminology / language | 2/5 | 4/5 | 4.5/5 | +0.5 ✅ |
| Job creation workflow | 3/5 | 4/5 | 4/5 | 0 |
| Payment confirmation gate | 1/5 | 4/5 | 4/5 | 0 |
| Invoice workflow | 2/5 | 3/5 | 2.5/5 | -0.5 🔴 (action bar chaos) |
| Machine return flow | 2/5 | 3/5 | 3/5 | 0 |
| Dashboard orientation | 3/5 | 4/5 | 3.5/5 | -0.5 🔴 (upcoming jobs bug) |
| Data integrity / bugs | 4/5 | 2/5 | 4/5 | +2 ✅ (v2 bugs fixed) |
| Customer capture | 2/5 | 4/5 | 4/5 | 0 |
| Quote workflow | 2/5 | 2/5 | 2.5/5 | +0.5 ✅ (machine rate auto-fill) |
| Post-job insights | 0/5 | 0/5 | 0/5 | 0 |
| **Overall** | **62/100** | **74/100** | **79/100** | **+5** |

---

## What's Actually Good (Don't Touch)

- The **4-step wizard** with date-first machine filtering and compact date summary in Step 3 — excellent
- The **calendar view** with click-to-create from any cell — industry-best UX
- The **payment gate amber card** — prominent, correct, with the right amount
- The **payment plan flexibility** (deposit/upfront/on-completion) — well implemented
- The **atomic SQL status transitions** — prevent data corruption
- The **share links** for invoices/quotes
- The **GST breakdown** in wizard, BookingDetail, and review step
- The **Record Payment** partial payment modal with running balance
- The **quick-add customer** in TopBar
- The **Needs Attention panel** with pending jobs — exactly right
- The **auto-open modal via `?new=true`** on Quotes and Invoices — clean pattern
- The **glassmorphic design** — professional, modern
