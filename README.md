# HireBase

HireBase is a free CRM for Australian machine hire companies.

It includes:
- Multi-tenant fleet, bookings, customers, quotes, invoices, and settings.
- Platform-admin tools for cross-company machine availability and cross-hire brokerage deals.
- Supabase-backed auth, database, storage, and edge functions.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Supabase (`@supabase/supabase-js`)
- React Router DOM
- TanStack Query
- Zustand
- lucide-react
- date-fns
- clsx + tailwind-merge
- react-hook-form + zod
- sonner

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set values:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
PLATFORM_ADMIN_EMAIL=
```

3. Apply migration:

- SQL files:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_machine_model_catalog.sql`
  - `supabase/migrations/003_document_sharing_and_quote_payments.sql`
  - `supabase/migrations/004_company_stripe_keys.sql`
  - `supabase/migrations/005_company_settings_trigger.sql`
  - `supabase/migrations/006_security_hardening.sql`
  - `supabase/migrations/007_booking_status_atomic_update.sql`
  - `supabase/migrations/008_machine_weekend_rate_and_catalog_categories.sql`
  - `supabase/migrations/009_job_first_flow_payments_extras_map.sql`

4. Deploy edge functions:

- `supabase/functions/invite-team-member/index.ts`
- `supabase/functions/promote-platform-admin/index.ts`
- `supabase/functions/create-payment-intent/index.ts`
- `supabase/functions/send-document-email/index.ts`
- `supabase/functions/get-public-document/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/get-stripe-config/index.ts`
- `supabase/functions/set-stripe-config/index.ts`
- `supabase/functions/notify-new-user/index.ts` (emails product owner on new signup)

5. Configure edge function secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL` (for customer private links, e.g. `https://your-app-domain.com`)
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY` (optional fallback when company-level Stripe keys are not set)
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PLATFORM_ADMIN_EMAIL` (for new-user notifications and promote-platform-admin)

6. Enable new-user notifications (optional): run this SQL in Supabase SQL Editor to notify the product owner when someone signs up:

```sql
INSERT INTO public.webhook_config (key, value) VALUES
  ('notify_new_user_url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-new-user'),
  ('notify_new_user_anon_key', 'YOUR_ANON_KEY')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

7. Run app:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Typecheck + production build
- `npm run preview` - Preview production build
- `npm run test` - Run Vitest suite
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:e2e` - Run Playwright generic audit suite
- `npm run test:e2e:matrix` - Run Playwright audit across `anonymous,basic,admin` role projects
- `npm run test:e2e:headed` - Run Playwright audit in headed mode
- `npm run test:e2e:ui` - Run Playwright with interactive UI mode
- `npm run test:e2e:report` - Open Playwright HTML report
- `npm run e2e:auth:states` - Generate `basic` and `admin` storage states from env credentials
- `npm run e2e:auth:states:basic` - Generate only `basic` storage state
- `npm run e2e:auth:states:admin` - Generate only `admin` storage state
- `npm run scrape:tvh-model-catalog` - Scrape TVH model + image catalog into JSON
- `npm run sync:tvh-model-catalog` - Scrape and upsert into Supabase (requires `SUPABASE_SERVICE_ROLE_KEY`)
- `powershell -ExecutionPolicy Bypass -File scripts/deploy-supabase.ps1 ...` - Push migrations, deploy edge functions, and optionally set secrets

## E2E Audit (Playwright)

1. Configure env values in `.env`:

```env
E2E_BASE_URL=http://127.0.0.1:3000
E2E_START_COMMAND=
E2E_ARTIFACTS_DIR=e2e/artifacts
E2E_ROLES=anonymous
E2E_BASIC_STORAGE_STATE=e2e/.auth/basic.json
E2E_ADMIN_STORAGE_STATE=e2e/.auth/admin.json
```

2. Install browser runtime (once per machine):

```bash
npx playwright install chromium
```

3. Run the audit:

```bash
npm run test:e2e
```

For details, see `e2e/README.md`.

## TVH Model Catalog Import

1. Run scraper only:

```bash
npm run scrape:tvh-model-catalog
```

2. Upsert scraped models into Supabase (service role required):

```bash
SUPABASE_URL=https://<project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run sync:tvh-model-catalog
```

## Notes

- RLS is enabled across tenant tables.
- Platform admin can access `/admin/*` routes and cross-hire deals.
- Default quote/invoice GST is 10%.
- Invoice PDF is generated via browser print stylesheet.
- Quotes and invoices can be emailed via Resend with secure private customer links.
- Stripe payments from private links are finalized by `stripe-webhook` and mark documents as paid automatically.
- Company admins can set their own Stripe keys in Settings -> Invoice Settings.
