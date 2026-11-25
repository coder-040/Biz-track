# 03 — Supplier and dealer payments

## Goal
Track supplier purchases and partial payments so outstanding payables and overdue supplier dues are visible in one place. "Dealer" means a supplier in this app: a party with `type` = `supplier` or `both`.

## User Flow
1. Add a supplier under **Parties** with `name`, optional `phone` and `address`, and `type` = `supplier` (or `both`). A `both` party is treated as a supplier here and as a customer in spec 02.
2. Record a purchase: `type` = `supplier_purchase`, `party_id` set to that supplier, positive `amount`, required free-text `category` (e.g. "Inventory", "Supplies"), `payment_method` = `credit`, required `due_date`, `transaction_date`, optional `description` and `attachment_url` (bill). Cash/bank/qr/online supplier buys are recorded as `expense` and create no payable.
3. Record a payment: `type` = `supplier_payment`, the same `party_id`, positive `amount`, `category`, a `cash`/`bank`/`qr`/`online` `payment_method`, `transaction_date`, optional `description` and `attachment_url` (receipt). A payment exceeding the party's outstanding payable is rejected on save with a clear validation message.
4. Show the payable as the sum of that party's `supplier_purchase` amounts minus the sum of its `supplier_payment` amounts (cumulative; no invoice-level allocation).
5. Mark a supplier overdue when `due_date < CURRENT_DATE` and the payable is greater than 0; show supplier name, remaining amount (the whole payable) and the earliest past-due date in-app, surfaced in the alert centre from spec 05. The status clears automatically when payable reaches 0.
6. Edit or delete purchases and payments as in spec 01; payable and overdue status always recompute from the current rows.

## Calculation rules
- Supplier party = `parties.type IN ('supplier','both')`.
- Payable(party) = `SUM(amount WHERE type='supplier_purchase' AND party_id=party.id)` − `SUM(amount WHERE type='supplier_payment' AND party_id=party.id)`. `amount > 0` is DB-enforced.
- Only `supplier_purchase` rows with `payment_method='credit'` create payables.
- Payments are not allocated to individual purchases, so no FIFO/invoice matching exists; the whole payable is the displayed remaining amount.
- Overdue is derived at read time (no stored flag): `payable > 0` **and** at least one credit purchase has `due_date < CURRENT_DATE`. Displayed due date = the earliest such date.
- Amounts use the schema's `numeric(12,2)` precision.

## Edge cases
- Overpayment is rejected, so payable never goes negative and there is no supplier-credit state.
- With multiple purchases and partial payments, an older past-due purchase still contributes to "overdue" even if payments have effectively settled it — because there is no allocation; the reliable settlement signal is `payable = 0`.
- Cash/bank/qr/online supplier purchases are `expense`, not payables.
- A `both` party carries a separate customer balance (spec 02) and supplier payable (this spec).
- Deleting a party with supplier transactions is blocked at the app layer; `ON DELETE SET NULL` remains only as a DB fallback.
- Edits/deletes recompute payable and overdue; audit logging stays in spec 01's scope.

## Database tables and columns used
- `parties`: `id`, `name`, `phone`, `type`, `address`, `created_at`. `type IN ('supplier','both')` = suppliers, per `supabase/schema.sql`.
- `transactions`: `id`, `type`, `party_id`, `amount`, `category`, `payment_method`, `description`, `due_date`, `transaction_date`, `attachment_url`, `created_at`. `party_id` references `parties.id`; allowed `type`/`payment_method` values come from `supabase/schema.sql`.

Schema note: `supabase/schema.sql` does define `businesses`, `business_members` (roles `owner`/`staff`), `audit_log`, and a NOT NULL `business_id` on `parties`, `products`, `transactions` and `stock_movements`. Its RLS policies are demo-only (`anon` has full access), so per-business isolation is not enforced at the DB layer. Business scoping, RBAC and change auditing are handled outside this slice — do not reimplement them here.
