# 02 — Customer credit (Udharo)

## Goal

Track credit sales and partial payments per customer so each customer's outstanding balance and overdue status are always current.

## Locked decisions

| Topic | Decision |
| --- | --- |
| Schema authority | `supabase/schema.sql` is authoritative. `parties.business_id` and `transactions.business_id` are `NOT NULL`; writes include them. |
| Business scope | Read/write only rows for `NEXT_PUBLIC_BIZTRACK_BUSINESS_ID`, falling back to the seeded demo business `11111111-1111-4111-8111-111111111111`. |
| Balance | `sum(customer_credit_sale.amount) - sum(customer_payment.amount)`, rounded to 2 decimals. |
| Overdue allocation | Payments are allocated FIFO to credit sales by due date, then transaction date, then creation order. |
| Overpayment | Reject on both client and server. Never store a payment greater than the outstanding balance. |
| Persistence | Supabase when configured; otherwise a server-side in-memory demo store that resets on restart. |
| Existing records | Add-only. No edit or delete for customers, sales or payments in this slice. |
| Categories | Free text, required, with editable defaults `Credit sale` and `Customer payment`. |
| Routes | `/parties` list + `/parties/[id]` detail. `/` redirects to `/parties`. |
| Tests | Vitest unit tests for the pure balance, allocation and overdue calculations. |

## User flow

1. Open **Parties**. See customer balances, total outstanding and an overdue section.
2. Add a customer with required `name`, optional `phone` and `address`, and `type` = `customer` or `both`. On success, go to that customer's detail page.
3. On the customer detail page, record a credit sale: positive `amount`, required `category`, required `due_date`, `transaction_date`, optional `description`, and `payment_method` fixed to `credit`.
4. Record a partial payment: positive `amount`, required `category`, a `payment_method` of `cash`, `bank`, `qr` or `online`, and `transaction_date`.
5. The balance immediately updates to credit sales minus payments.
6. A payment greater than the outstanding balance is rejected with a clear message showing the current balance. The form keeps its values so the user can correct the amount.
7. The customer is marked overdue when at least one unpaid credit sale has a `due_date` before today. The overdue view shows the customer, the past-due amount and the earliest overdue due date.
8. The overdue flag clears automatically when the balance reaches zero or no past-due sales remain unpaid.

## Database rules

### Tables and columns

- `parties`: `id`, `business_id`, `name`, `phone`, `type`, `address`, `created_at`.
- `transactions`: `id`, `business_id`, `type`, `party_id`, `amount`, `category`, `payment_method`, `description`, `due_date`, `transaction_date`, `created_at`.
- Customers are `parties.type IN ('customer', 'both')`, scoped by `business_id`.
- Credit sales are `transactions.type = 'customer_credit_sale'` with `payment_method = 'credit'`.
- Payments are `transactions.type = 'customer_payment'` with `payment_method IN ('cash', 'bank', 'qr', 'online')`.
- Allowed values and `amount > 0` come from `supabase/schema.sql`.
- Transactions with `party_id = null` are ignored by credit calculations.
- Normalize numeric columns to numbers in the data layer; PostgREST may return them as strings.
- `businesses`, `business_members` and `audit_log` exist in the schema but are not used by this slice.

### Business scoping

- `BUSINESS_ID` is `NEXT_PUBLIC_BIZTRACK_BUSINESS_ID?.trim()` or the demo UUID.
- Every read filters with `.eq("business_id", BUSINESS_ID)`.
- Every insert includes `business_id: BUSINESS_ID`.
- Party lookups by id must also match the business; a party from another business is treated as not found.

### Balance and allocation

Use ISO date strings (`YYYY-MM-DD`) for all date comparisons and take "today" as an explicit input to the pure calculation functions.

1. Sort a customer's credit sales by `due_date` ascending (missing dates last), then `transaction_date` ascending, then `created_at` ascending, then `id` ascending for determinism.
2. Pool all payment amounts into one allocatable total.
3. Walk the sorted sales and apply `min(remainingPayments, sale.amount)` to each sale. The unapplied remainder is the sale's outstanding amount.
4. `balance = max(0, round2(totalCreditSales - totalPayments))`. Overpaid legacy rows display `Rs. 0.00` outstanding.
5. `totalCredit` and `totalPaid` are plain sums rounded to 2 decimals.
6. Amounts are stored and compared at 2-decimal precision. Use a `0.005` tolerance when checking `paymentAmount > balance`.

### Overdue rules

- A sale is overdue when `outstanding > 0` and `due_date < today` (strictly before today; a sale due today is not overdue).
- A sale with a missing `due_date` is never overdue.
- A customer is overdue when at least one sale is overdue.
- `overdueAmount` is the sum of outstanding amounts on overdue sales only.
- `overdueDueDate` is the earliest due date among overdue sales.
- `nextDueDate` is the earliest due date at or after today among sales that still have an outstanding amount; otherwise `null`.
- When `balance` is 0, every sale is fully allocated, so the customer is never overdue.
- Overdue state is always computed from transactions. No overdue column, flag or scheduled job is written.

### Validation

Server actions and client forms enforce the same rules.

**Create customer**

- `name` is required after trimming.
- `type` must be `customer` or `both`; this form never creates `supplier`.
- `phone` and `address` are optional; blank values are stored as `null`.
- Duplicate names and phone numbers are allowed; the schema has no uniqueness constraint.

**Credit sale**

- The party must exist, belong to the business, and be `customer` or `both`.
- `amount` must be finite, greater than 0, at most 2 decimal places, and within `numeric(12,2)` range.
- `category` is required; default `Credit sale`.
- `payment_method` is always `credit` and is not user-selectable.
- `due_date` is required, a valid ISO date, and `due_date >= transaction_date`.
- `transaction_date` is required, a valid ISO date, and cannot be in the future.
- `description` is optional and stored as `null` when blank.

**Payment**

- The party must exist, belong to the business, and be `customer` or `both`.
- `amount` must be finite, greater than 0, at most 2 decimal places, and within `numeric(12,2)` range.
- `category` is required; default `Customer payment`.
- `payment_method` must be one of `cash`, `bank`, `qr`, `online`.
- `transaction_date` is required, a valid ISO date, and cannot be in the future.
- `due_date` is always `null`.
- Reject when `amount > balance + 0.005`, with a message such as: `Payment of Rs. 5,000.00 exceeds the outstanding balance of Rs. 3,000.00.`
- A payment on a customer with a zero balance is therefore rejected.

### Concurrency limitation

The overpayment check reads the balance and then inserts the payment. Two payments submitted at the same moment can both pass the check. This slice documents that race; it does not add a database function or constraint because `supabase/schema.sql` is authoritative and unchanged.

## Persistence modes

### Supabase mode

Enabled when both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. Use `@supabase/supabase-js` from server components and server actions with a server-only client (`persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`). Never query with a browser client for this slice.

If the variables are present but the database/API fails, show the normal error state. Do not silently fall back to demo data.

### Demo mode

Enabled when either Supabase variable is missing.

- Seed a server-side in-memory dataset through a `globalThis` singleton so pages and server actions share it.
- Seed at least:
  - one current customer with a future due date and a partial payment;
  - one overdue customer with a past due date and a partial payment;
  - one settled customer with a zero balance.
- Seed dates relative to the current day so the demo never goes stale.
- Mutations work for the lifetime of the server process and reset on restart.
- Show a small, non-blocking banner: `Demo data — connect Supabase to persist changes.`
- Demo mode ignores `BUSINESS_ID` isolation because there is only one in-memory business.

## UI specification

### Shared shell

- Root layout gets a simple header: `BizTrack` wordmark and a `Parties` link.
- `/` redirects to `/parties`.
- Currency: `Rs.` with `en-IN` grouping and 2 decimals.
- Dates: ISO in the data layer, human-readable medium dates in the UI (for example `26 Nov 2026`).

### `/parties`

- Page title and a short description of customer credit.
- Summary cards:
  - number of customers;
  - total outstanding across customers;
  - number of overdue customers and total past-due amount.
- Overdue section, shown only when at least one customer is overdue, listing customer name, past-due amount and earliest overdue due date, with a link to the customer.
- Customer table or list:
  - name, phone;
  - type badge (`Customer` / `Customer & supplier`);
  - total outstanding balance;
  - overdue badge and past-due amount when applicable;
  - earliest overdue date, otherwise next due date, otherwise `—`;
  - `View` link to `/parties/[id]`.
- Sort overdue customers first by earliest overdue date, then by balance descending, then by name ascending.
- Add-customer form with name, phone, address, type (`customer` / `both`) and a submit button.
- Empty state when there are no customers, with a prompt to add the first one.
- Loading skeleton and an error boundary with a retry action.

### `/parties/[id]`

- Back link to `/parties`.
- Customer name, phone, address and type.
- Prominent balance card with total credit sales, total paid and outstanding balance.
- Overdue alert when overdue, showing past-due amount and earliest overdue due date; a settled state when balance is 0.
- Credit sale form:
  - amount, category (default `Credit sale`), due date, transaction date (default today), description;
  - visible note that the payment method is `Credit`.
- Payment form:
  - amount, category (default `Customer payment`), payment method (default `cash`), transaction date (default today);
  - visible outstanding balance and a `Pay full balance` shortcut that fills the amount.
- Ledger of that customer's credit sales and payments, newest first:
  - type/description, transaction date, category, payment method;
  - for sales: due date, outstanding amount and status (`Paid`, `Partial`, `Unpaid`, `Overdue`);
  - for payments: amount applied.
- Success message after each mutation; forms reset on success.
- If the party is not a customer/both, or does not belong to the business, call `notFound()`.
- Loading skeleton and an error boundary with a retry action.

### Forms and actions

- Use React server actions with `useActionState`; disable submit buttons while pending.
- Return a structured `{ status: "idle" | "success" | "error", message, fieldErrors? }` state.
- Revalidate `/parties` and the relevant `/parties/[id]` after each successful mutation.
- Show field-level errors next to the offending input and a form-level message for server errors.
- Labels are explicit, errors use `aria-invalid`/`aria-describedby`, and every form is keyboard usable.

## Implementation map

Suggested layout (names may change, responsibilities may not):

- `src/lib/config.ts` — `BUSINESS_ID` and Supabase configuration helpers.
- `src/lib/supabase/server.ts` — lazily created server-only Supabase client.
- `src/lib/credit/types.ts` — party, transaction, allocation and summary types.
- `src/lib/credit/calculations.ts` — pure allocation, balance, overdue and validation helpers.
- `src/lib/credit/calculations.test.ts` — Vitest unit tests.
- `src/lib/credit/data.ts` — Supabase/demo reads and writes, scoped by business.
- `src/lib/credit/demo-store.ts` — seeded `globalThis` demo dataset.
- `src/app/parties/actions.ts` — `createCustomer`, `recordCreditSale`, `recordPayment`.
- `src/app/parties/page.tsx`, `loading.tsx`, `error.tsx` — list route.
- `src/app/parties/[id]/page.tsx`, `loading.tsx`, `error.tsx` — detail route.
- `src/components/parties/*` — list, overdue panel, add-customer form, sale form, payment form, ledger.
- `src/components/ui/*` — add the shadcn primitives this slice needs (card, badge, input, label, textarea, table, skeleton).

Project constraints:

- Next.js 16 App Router with `cacheComponents: true`: `params` and `searchParams` are promises, and runtime data is read inside `<Suspense>` with a fallback.
- Do not add RBAC, owner/staff checks, audit history, edit or delete flows.
- Do not change `supabase/schema.sql` for this slice.
- Add `@supabase/supabase-js` and Vitest, plus a `test` script.

## Required tests

Vitest, pure functions only:

1. A single unpaid sale becomes overdue only after its due date, not on the due date.
2. FIFO allocation across two sales with different due dates marks only the past-due remainder as overdue.
3. Payments that exactly clear the balance produce `overdue = false` and `overdueAmount = 0`.
4. Partial payment produces the correct balance, per-sale outstanding amount and status.
5. A payment greater than the balance is rejected; a payment equal to the balance is accepted.
6. A sale with a missing due date is never overdue.
7. Rounding to 2 decimals is stable across multiple sales and payments.

## Acceptance criteria

- [ ] A customer can be added with only a name, and appears in `/parties` with a zero balance.
- [ ] `customer` and `both` parties are treated as customers; suppliers never appear.
- [ ] A credit sale writes `type = customer_credit_sale`, `payment_method = credit`, the selected party, amount, category, due date and transaction date.
- [ ] A payment writes `type = customer_payment`, the same party, amount, category, a cash/bank/qr/online method and no due date.
- [ ] The balance equals credit sales minus payments, rounded to 2 decimals.
- [ ] A payment greater than the outstanding balance is blocked in both the browser and the server action, and no row is inserted.
- [ ] Overdue status is computed from the FIFO allocation, not from the total balance alone.
- [ ] The overdue section shows each overdue customer's name, past-due amount and earliest overdue due date.
- [ ] A settled customer is removed from the overdue section without any manual cleanup.
- [ ] All reads and writes are scoped to `BUSINESS_ID`; inserts include `business_id`.
- [ ] With no Supabase env vars, the app runs on seeded demo data, all flows work, and the demo banner is visible.
- [ ] With Supabase env vars set, reads and writes use Supabase; failures show the error state instead of demo data.
- [ ] `/` redirects to `/parties`; the header links to `/parties`.
- [ ] Loading, empty and error states exist for both routes.
- [ ] `npm run build`, `npm run lint` and `npm test` pass.

## Out of scope

- Editing or deleting customers, credit sales or payments.
- Supplier purchases and supplier payments (task 03).
- Dashboard totals, alerts centre, reports and exports (tasks 05 and 06).
- Authentication, RBAC, owner/staff permissions and audit history.
- Database schema changes, stored overdue flags, cron jobs or real-time subscriptions.
- Email/SMS reminders and browser notifications.
