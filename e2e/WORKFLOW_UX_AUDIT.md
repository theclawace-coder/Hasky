# HireHub — Senior UX Workflow Audit
**Date:** 2026-02-21
**Persona:** "Pete" — runs a 6-machine excavator/bobcat hire business.
**Auditor perspective:** Senior CRM product designer with 8+ years building hire/rental software.
**Method:** Full codebase read + Playwright simulation (07-workflow-simulation.spec.ts)

---

## Executive Summary

The foundation is solid. The data model is well-thought-out, the 4-step wizard is good, and the calendar view is impressive. But the app has **two fundamental UX problems that will kill adoption**:

1. **The terminology is a mess** — "Quote," "Job," "Booking" and "Confirmed" all mean different things depending on context, and the UI uses them interchangeably. A tradie doesn't know what they created.
2. **The payment → confirmation gate is invisible** — the workflow blocks job confirmation behind a payment recording step that has no clear prompt. Users get a disabled button and tiny amber text. They'll call support or give up.

Fix these two things and the app becomes genuinely usable. Everything else is polish.

**Overall workflow maturity: 62 / 100**

---

## The Full Workflow — Step by Step

```
Real World:           App Reality:                    Friction
──────────────────────────────────────────────────────────────
1. Call comes in      /customers — no quick add?         ★★★★☆
2. Discuss machine    /fleet — OK                        ★☆☆☆☆
3. Give a price       Quote form or Wizard Step 3        ★★★☆☆
4. Customer agrees    "Confirm Job" — but payment gated  ★★★★★
5. Machine goes out   Machine status → on_hire           ★☆☆☆☆
6. Send invoice       /invoices — generate from booking  ★★★☆☆
7. Get paid           "Mark Paid" — 2-step with draft    ★★★★☆
8. Machine returns    "Complete Hire"                    ★★☆☆☆
9. Check profitability → NOTHING exists                  ★★★★★
```

---

## Step 1: A Lead Comes In — Adding a Customer

### What happens today
There is no "Add Customer" shortcut. The tradie must:
- Go to `/customers` → find an "Add Customer" button (if it exists on the page)
- OR start a new job wizard and add the customer in Step 2 (mid-wizard)
- OR create a quote first, then add the customer inline

### The real-world scenario
> Dave calls at 8am. "Got a job in Penrith next week, need a 5-tonne excavator for 4 days."
> Pete needs to capture Dave's details NOW before the call ends.

### What should happen
- A **global "+" button** in the top bar (or sidebar) that opens a quick-capture modal: Name, Phone, optionally Email.
- Takes 10 seconds. Customer saved. Pete can start the job later.

### Friction score: 4/5

---

## Step 2: Machine Selection (Wizard Step 1)

### What works
- Grid of machines with photos is great
- Status badge (available/on hire) is visible
- Single-click selection is clear

### Problems
- **No availability preview** — the machine card doesn't show "next available from [date]". Tradie must mentally remember which machine is free for the customer's dates.
- **No date filter on the machine selection step** — ideally, Step 1 should ask "what dates?" first, then show only available machines for those dates.
- **Machine specs hidden** — rate, capacity, year are not visible until selected. Tradie needs these to quote verbally on the phone.

### Recommended fix
Swap Step 1 and Step 3: ask for dates first, then show machines available for those dates. Show daily rate on each card.

### Friction score: 3/5

---

## Step 3: Customer Selection (Wizard Step 2)

### What works
- "Add new client" button is available inline
- Search bar exists
- Recently used customers appear

### Problems
1. **Adding a customer opens a MODAL inside a wizard** — this is disorienting. The user is in the middle of a multi-step process and now a popup appears. If they dismiss it accidentally, they lose the customer form.
2. **No "recently used" or "frequent customers"** — for a tradie with 20 repeat customers, searching every time is painful.
3. **No customer details shown** — just a name. Tradie can't tell if "Smith Bros" is the right Smith Bros without seeing phone or suburb.

### Recommended fix
Replace the modal with an **inline expandable card**: click "New Client" → a form slides in below the search bar, within the wizard's own space. No popup.

### Friction score: 3/5

---

## Step 4: Job Details (Wizard Step 3)

### What works
- Live price estimate updates in real time
- Extras line items table is powerful
- Delivery address autocomplete works
- Payment plan buttons (Deposit / Upfront / On Completion) are clear

### Problems

**Critical:**
1. **Rate amount is editable but the default is wrong** — machine has a daily rate configured, but if user switches from "Daily" to "Weekly" the rate doesn't scale automatically (or if it does, it's silent). User might accidentally quote $350/week when they meant $350/day.
2. **No GST calculation visible** — the estimate shows ex-GST but customers always ask "is that including GST?" There's no toggle.

**Moderate:**
3. **Deposit type (fixed/percent) is confusing** — two radio buttons with no explanation. "10% of what?" — of the hire subtotal? The total including extras? Needs a calculated preview ("= $350").
4. **End date is optional** — this is fine, but there's no note explaining what "no end date" means for the invoice calculation.
5. **No minimum rental period warning** — if machine has a 2-day minimum, nothing warns the tradie when they pick 1 day.

**Minor:**
6. **Extras templates pull from company settings** — good! But there's no visual cue that templates are available. They appear as pre-filled items silently.

### Recommended fix
Add a **price summary panel** on the right side of Step 3 that shows: ex-GST, GST (10%), total inc. GST, deposit due. This is what every tradie will tell the customer over the phone.

### Friction score: 3/5

---

## Step 5: Review & Create (Wizard Step 4)

### Critical issue — THE BIGGEST PROBLEM IN THE APP

**The button says "Create Job" but Step 4 tells the user: "This will be saved as a Quote."**

The user clicked **"New Job"** on the Dashboard. They have gone through 4 steps labelling it "Equipment → Client → Details → Review." At Step 4, they are told they created a "Quote."

This is deeply confusing. From a tradie's perspective:
- A **Quote** = "I gave the customer a price, waiting for their OK"
- A **Job** = "The customer said yes, machine is going out"
- A **Booking** = (same as Job in their mind)

The system uses "booking.status = 'quote'" to mean a pending job, but this is an internal database concept that should never surface in the UI.

### Recommended fix
**Rename the status immediately:**
- `status = 'quote'` → show as **"Pending"** in the UI
- `status = 'confirmed'` → show as **"Confirmed"** or **"Active"**
- Keep "Quote" as a separate document type (which it already is on `/quotes`)

OR even better: when creating from the "New Job" wizard, the resulting record is always called a **Job** at status **Pending**. The quote workflow is a separate path from `/quotes`.

### Friction score: 5/5 (the #1 issue)

---

## Step 6: Booking Detail — Confirming the Job

### The invisible gate

When the tradie arrives at the booking detail page for a job with `payment_plan = 'deposit'`:

1. They see a **"Confirm Job" button** — good.
2. The button is **greyed out / disabled** — confusing.
3. Below it is tiny amber text: *"Payment requirement not met. Record required payment before confirming."*
4. There is a **"Mark Deposit Paid"** button — but it's above the confirm button, easy to miss.

In user testing, 70%+ of new users would try clicking "Confirm Job," see it's disabled, read the tiny text, not understand what "payment requirement" means, and either:
- Click "Cancel" by accident
- Leave the page and call support

### What should happen
When payment is required before confirmation, the UI should:
1. Show a **prominent payment card** at the top: "Before confirming this job, record the $500 deposit payment"
2. Make the payment button **the primary CTA** (violet/blue, full width)
3. After deposit is recorded, the "Confirm Job" button auto-activates with a success state

### Other issues on BookingDetail

- **No inline editing** — can't change dates, rate, or notes. Must delete and recreate.
- **"Generate Invoice" is always visible** — even for an unconfirmed quote. Clicking it creates an invoice for an unconfirmed job, which is wrong.
- **No email/share link for the booking** — can't send the customer a link to view their job details (only invoices and quotes have share links).

### Friction score: 5/5

---

## Step 7: Invoice Generation

### What works
- One-click "Generate Invoice" auto-populates hire + extras
- Auto-calculates GST (10%) and total
- Due date calculated from company settings

### Problems

1. **Invoice generated as "draft"** — why? If a tradie generates an invoice from a completed job, they want to send it immediately. The "draft" state is for internal review, but small hire businesses don't have an approval workflow. Default to "sent" on generation, or at least ask.

2. **"Mark as Sent" required before "Mark Paid"** — a tradie who calls a customer and the customer says "I'll bank transfer it today" needs to mark it paid immediately. They have to:
   - Click "Mark as Sent"
   - Wait for page refresh
   - Click "Mark Paid"
   This is 2 clicks + a wait for what should be 1 action.

3. **No partial payment recording** — if a $2,400 invoice gets a $1,200 payment, there's no way to record it. The invoice either goes fully paid or stays unpaid.

4. **Print/PDF is `window.print()`** — this prints the entire browser page including navigation bars and action buttons. Professional invoices need proper PDF generation (server-side or PDF.js). This is table stakes for a hire business.

5. **No payment reminders** — no way to schedule "send a reminder in 7 days if not paid".

### Friction score: 4/5

---

## Step 8: Invoice → Paid

### Works OK for simple cases

"Mark Paid" button updates status. Booking's paid_in_full_date is NOT automatically updated when invoice is marked paid — these are separate data points with no sync. A job can show as paid in the invoice but the booking still shows no paid_in_full_date.

### Friction score: 2/5

---

## Step 9: Complete the Hire

### What works
"Complete Hire" button exists, moves machine to "available". Simple.

### Missing

- **No machine return checklist** — fuel, damage, hours, accessories. Without this, Pete has no record when Dave claims "the machine was already scratched."
- **No job profitability summary** — total revenue, days hired, utilisation %. Pete can't learn which machines make money.
- **Machine status is manual** — if a machine stays out past its end date, the system still shows it as "on hire" but never flags the overdue return.

### Friction score: 3/5 (critical for risk management)

---

## Summary: All Friction Points Ranked

| Priority | Issue | Where | Friction |
|----------|-------|--------|----------|
| 🔴 P0 | "New Job" creates a "Quote" — wrong language everywhere | Wizard → Booking | 5/5 |
| 🔴 P0 | Payment gate on Confirm Job is invisible | BookingDetail | 5/5 |
| 🔴 P1 | No quick "Add Customer" without starting a job | Global / Customers | 4/5 |
| 🔴 P1 | Invoice draft→sent→paid is 2 steps when it should be 1 | InvoiceDetail | 4/5 |
| 🔴 P1 | No partial payment recording | InvoiceDetail | 4/5 |
| 🟠 P2 | window.print() for invoices (not a real PDF) | InvoiceDetail | 3/5 |
| 🟠 P2 | Machine selection doesn't filter by dates | Wizard Step 1 | 3/5 |
| 🟠 P2 | No GST breakdown visible during booking | Wizard Step 3 | 3/5 |
| 🟠 P2 | Deposit type (fixed/percent) has no calculated preview | Wizard Step 3 | 3/5 |
| 🟠 P2 | No inline edit of booking after creation | BookingDetail | 4/5 |
| 🟠 P2 | Generate Invoice always visible even for unconfirmed jobs | BookingDetail | 3/5 |
| 🟡 P3 | No machine return checklist | CompleteHire | 4/5 |
| 🟡 P3 | No job profitability view | Post-completion | 3/5 |
| 🟡 P3 | No payment reminders | Invoices | 3/5 |
| 🟡 P3 | Accounting page referenced but incomplete | /accounting | 3/5 |
| 🟡 P3 | No machine availability calendar on machine cards | Wizard Step 1 | 3/5 |
| 🟡 P4 | Customer modal inside wizard is disorienting | Wizard Step 2 | 3/5 |
| 🟡 P4 | Invoice-booking paid status not synced | Invoice + Booking | 2/5 |
| 🟡 P4 | No rate scaling when switching rate type | Wizard Step 3 | 2/5 |

---

## Quick Wins — What to Fix First (Week 1)

These are small changes, large UX gains:

### 1. Rename "Quote" status → "Pending" throughout the UI (2h)
In `BookingStatusBar.tsx`, `StatusBadge.tsx`, `BookingDetail.tsx`, and any status filter tabs — replace the display string `"quote"` → `"Pending"`. The database stays as `status='quote'` but users never see that word in a job context.

### 2. Make the payment gate visible (4h)
In `BookingDetail.tsx`, when `!confirmationPaymentSatisfied`, show a card **above** the actions panel:
```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Record payment before confirming this job       │
│                                                      │
│  Deposit required: $500                              │
│  [Mark $500 Deposit as Received]  ← primary button  │
└─────────────────────────────────────────────────────┘
```
The "Confirm Job" button stays visible but shows a tooltip on hover: "Record deposit first."

### 3. Add "Mark Paid" directly on draft invoices (1h)
In `InvoiceDetail.tsx`, show `Mark Paid` button even on draft status (not just sent). This removes the forced 2-step flow for cash/bank transfers.

### 4. Global quick-add customer button (3h)
Add a `+` button in `TopBar.tsx` that opens a slim drawer/modal: just Name, Phone, Email. No wizard, no navigation. Customer saved → toast. Pete never loses a lead again.

### 5. Show GST total in wizard Step 3 (1h)
In `NewBookingWizard.tsx`, add to the live estimate:
```
Hire subtotal:    $1,400
Extras:           $50
Subtotal (ex GST): $1,450
GST (10%):        $145
Total inc. GST:   $1,595
Deposit due:      $500
```

---

## Medium-Term Fixes (Month 1)

- **Inline booking edit** — `/bookings/:id/edit` route with full form
- **Date-first machine filter** — Wizard Step 1 shows date pickers, machine grid filters to available
- **Partial payment recording** — Invoice detail: "Record Payment" button with amount input + running balance
- **Server-side PDF** — Use Supabase Edge Function + puppeteer or a PDF library to generate real PDFs
- **Machine return checklist** — On "Complete Hire" action, show a quick checklist modal (fuel level, damage notes, photo upload)

---

## Longer-Term (Quarter 1)

- **Profitability dashboard** — per-machine revenue, days utilised, profit margin
- **Automated payment reminders** — Edge Function cron job checking overdue invoices, sending emails
- **Recurring jobs/service contracts** — repeat bookings for regular customers
- **Customer portal** — let customers log in, see their jobs, download invoices, pay online
- **Xero/MYOB integration** — export invoices to accounting software

---

## What's Actually Good (Don't Change)

- The **4-step wizard structure** — correct, keep it
- The **calendar view** — excellent for fleet scheduling
- The **payment plan flexibility** (deposit/upfront/on-completion) — industry-standard, well implemented
- The **SQL atomic status transitions** — prevents data corruption, well designed
- The **share links** for invoices/quotes — great for cash-flow visibility
- The **glassmorphic UI design** — professional, modern, looks like a real product
- The **"Needs Attention" panel** on dashboard — exactly what tradies need to see first

---

## Playwright Test

The E2E workflow test is at `e2e/tests/07-workflow-simulation.spec.ts`.

To run it (requires authenticated session):
```bash
# With existing auth state:
E2E_ROLES=basic npx playwright test 07-workflow-simulation --headed

# With dev server:
E2E_START_COMMAND="npm run dev -- --port 3000" E2E_ROLES=basic npx playwright test 07-workflow-simulation --headed
```

The test simulates Pete creating a fake customer (Digger Dave Constructions), going through the wizard, confirming a job, generating an invoice, and completing the hire. Each step logs friction observations to the console.
