# 01 â€” Income and expense tracking

Status: **implemented**. Schema was executed and environment configured by the user; `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed.

## Goal

Let owners and staff record, review, filter, edit, and delete everyday `income` and `expense` transactions so daily financial totals stay accurate. Persistence is Supabase-backed through the Supabase JavaScript client using the anon key.

## Scope

**In scope**

- Single `/transactions` page.
- Inline create/edit form.
- Date/category/payment-method filters and pagination.
- Hard delete with confirmation.
- App-written audit history.
- A totals strip on the Transactions page.

**Out of scope**

- Login/authentication UI.
- Full `/dashboard` route (owned by task 05).
- CSV/Excel export (owned by task 06).
- Customer/supplier credit fields, stock movements, barcode, reminders, and notifications.
- New automated test framework.

`AGENTS.md` points to `supabase/schema.sql` as the source of truth; the schema contains `parties`, `products`, `transactions`, `stock_movements`, and Task 01's isolation/audit additions.

## Schema changes required

Edit `supabase/schema.sql` in place with additive DDL, then instruct the user to execute it in Supabase. No migration tooling exists.

- Add `businesses`:
  - `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
  - `name text NOT NULL`
  - `created_at timestamptz DEFAULT now()`
- Add `business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE` to `parties`, `products`, `transactions`, and `stock_movements`. This is safe because the tables currently contain no rows.
- Add `business_members`:
  - `business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE`
  - `actor_id text NOT NULL`
  - `role text NOT NULL CHECK (role IN ('owner', 'staff'))`
  - Seed the demo actor in SQL.
- Add `audit_log`:
  - `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
  - `business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE`
  - `entity_type text NOT NULL`
  - `entity_id uuid NOT NULL`
  - `action text NOT NULL CHECK (action IN ('insert', 'update', 'delete'))`
  - `actor_id text NOT NULL`
  - `actor_name text`
  - `changes jsonb NOT NULL`
  - `created_at timestamptz DEFAULT now()`
- Enable RLS on all tables. For this demo slice, anon policies are permissive (`using (true)`); effective isolation is app-layer filtering by the env business ID. This is explicitly **not production-safe** and must be replaced before real deployment.
- Do not implement authentication and never expose a service-role key in frontend code.

## Environment

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BIZTRACK_BUSINESS_ID`
- `NEXT_PUBLIC_BIZTRACK_ACTOR_ID`
- `NEXT_PUBLIC_BIZTRACK_ACTOR_NAME` (optional, used in audit entries)

## Roles

- **Owner:** may view, create, edit, and delete transactions.
- **Staff:** may view and create transactions only; edit/delete actions are hidden or disabled.

Role is read from `business_members` using the env actor ID.

## User flow

1. Open **Transactions**.
2. Select `type` = `income` or `expense`; enter a positive `amount`, `transaction_date`, required `category`, and required `payment_method` (`cash`, `bank`, `qr`, `online`); optionally add `description` and an `http(s)` `attachment_url`.
3. Save. The row appears in the list, totals remain accurate, and an audit row is written.
4. Filter by inclusive `transaction_date` range, presets, `category`, and `payment_method`; paginate 20 rows per page.
5. Edit any create field, including `type`, with confirmation and an audit row.
6. Delete with `window.confirm()`; the row is hard-deleted and an audit row captures the before image.

## Page architecture

- `src/app/transactions/page.tsx` is a Server Component.
- The initial list read is **uncached**: an async Server Component using a server-safe anon-key Supabase client, wrapped in a granular `<Suspense>` fallback. Do not use `use cache` or `cacheLife` for this read.
- One `TransactionsClient` client island receives initial rows and totals as props; it owns the form, filters, and pagination.
- `src/app/transactions/error.tsx` is a client error boundary with a Retry button.
- Supabase client factories:
  - `src/lib/supabase/client.ts` â€” browser client, anon key.
  - `src/lib/supabase/server.ts` â€” server client, anon key.
- No `loading.tsx` is needed; the granular `<Suspense>` boundary is preferred.
- Filter/pagination state lives in URL search params: `from`, `to`, `category`, `method`, `page`.

## Fields and validation

- `type`: `income` or `expense` only. The database still permits the other schema values for other tasks.
- `amount`: numeric `> 0`, stored as `numeric(12,2)` and displayed as `Rs. 1,234.56`.
- `transaction_date`: required; backdated dates allowed; future dates rejected.
- `category`: required free text.
- `payment_method`: required; allowed values are `cash`, `bank`, `qr`, `online`.
- `description`: optional.
- `attachment_url`: optional text field; if present, must be a valid `http(s)` URL. No file upload or Supabase Storage setup in this slice.
- `party_id` remains NULL and `due_date` is ignored for income/expense rows; those fields belong to the customer/supplier tasks.

## List behavior

- Sort: `transaction_date DESC, created_at DESC`.
- Pagination: 20 rows per page, client-side.
- No free-text search.
- Date filters are inclusive on `transaction_date`, with presets for Today, 7 days, and This month; default is all-time.
- Additional filters: `category` and `payment_method`.

## Totals strip

- Shown only on the Transactions page; `/dashboard` remains task 05.
- Todayâ€™s income and expenses are computed by `transaction_date`.
- Cash/bank balances are cumulative net (`income - expense`) by `payment_method`; `qr` and `online` are combined as â€œbank/onlineâ€.
- Totals are computed server-side from the full dataset and passed as props.
- Totals are independent of active list filters.

## Audit behavior

- App-written `audit_log` rows after successful `insert`, `update`, and `delete` operations.
- `changes` payload shape: `{ "before": <row|null>, "after": <row|null> }`.
  - Insert: `before` null, `after` new row.
  - Update: both before and after rows.
  - Delete: `before` old row, `after` null.
- Actor is stored as `actor_id` plus optional `actor_name` from env.
- If the audit insert fails after a successful transaction write, keep the transaction success, show a visible warning, and allow manual retry.

## UI and states

- Use existing `button`, `card`, `input`, and `badge` primitives.
- Use native `<select>`, `<textarea>`, `<label>`, and `<input type="date">` styled with existing Tailwind tokens; do not add new shadcn primitives in this slice.
- Inline form at the top of the page; no dialog primitive.
- Inline success/error messages; do not add `sonner`.
- Loading: skeleton rows in the `<Suspense>` fallback.
- Empty: empty-state card.
- Error: inline error panel with Retry, plus the segment-level `error.tsx` boundary.

## Mutation and refresh

- The client island calls Supabase directly with the anon key for create/edit/delete.
- After a successful mutation, call `router.refresh()` to re-run the uncached server read. No separate client-side data cache is introduced, so no additional invalidation is needed.
- URL search params preserve filters and page across refresh.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Manual checks: loading/empty/error states, owner vs staff capabilities, refresh after mutation, totals accuracy, URL filter preservation, and audit rows for insert/update/delete.

No automated tests are added and no test run should be claimed.
