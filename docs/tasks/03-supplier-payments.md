# 03 — Supplier and dealer payments

## Goal
Track supplier purchases and partial payments so outstanding payables and overdue supplier dues are visible in one place.

## User Flow
1. Add a supplier under **Parties** with `name`, optional `phone` and `address`, and `type` = `supplier` (or `both`).
2. Record a purchase: `type` = `supplier_purchase`, `party_id` set, positive `amount`, `category`, `payment_method` = `credit` when bought on credit, `due_date`, `transaction_date`, and optional `description`.
3. Record a payment: `type` = `supplier_payment`, the same `party_id`, positive `amount`, `category`, a cash/bank/qr/online `payment_method`, and `transaction_date`.
4. Show the payable as the sum of that party's `supplier_purchase` amounts minus the sum of its `supplier_payment` amounts.
5. Mark a supplier overdue when `due_date` has passed and the payable is greater than 0; show the supplier name, remaining amount and due date in-app, and clear the flag once the balance is settled.

## Database tables and columns used
- `parties`: `id`, `name`, `phone`, `type`, `address`, `created_at`. Treat `type IN ('supplier', 'both')` as suppliers, per `supabase/schema.sql`.
- `transactions`: `id`, `type`, `party_id`, `amount`, `category`, `payment_method`, `description`, `due_date`, `transaction_date`, `created_at`. `party_id` references `parties.id`; allowed `type` and `payment_method` values come from `supabase/schema.sql`.

Schema note: `supabase/schema.sql` has no business/owner/role or audit-history table or column. Do not assume these fields exist when implementing isolation, RBAC or change auditing.
