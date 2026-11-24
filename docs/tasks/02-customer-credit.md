# 02 — Customer credit (Udharo)

## Goal
Track credit sales and partial payments per customer so each customer's outstanding balance and overdue status are always current.

## User Flow
1. Add a customer under **Parties** with `name`, optional `phone` and `address`, and `type` = `customer` (or `both`).
2. Record a credit sale: `type` = `customer_credit_sale`, `party_id` set, positive `amount`, `category`, `payment_method` = `credit`, `due_date`, `transaction_date`, and optional `description`.
3. Record a partial payment: `type` = `customer_payment`, the same `party_id`, positive `amount`, `category`, a cash/bank/qr/online `payment_method`, and `transaction_date`.
4. Show the balance as the sum of that party's `customer_credit_sale` amounts minus the sum of its `customer_payment` amounts; reject or clearly flag a payment greater than the outstanding balance.
5. Mark a customer overdue when `due_date` has passed and the balance is greater than 0; show the customer, amount and due date in-app, and clear the flag when the balance reaches 0.

## Database tables and columns used
- `parties`: `id`, `name`, `phone`, `type`, `address`, `created_at`. Treat `type IN ('customer', 'both')` as customers, per `supabase/schema.sql`.
- `transactions`: `id`, `type`, `party_id`, `amount`, `category`, `payment_method`, `description`, `due_date`, `transaction_date`, `created_at`. `party_id` references `parties.id`; allowed `type` and `payment_method` values come from `supabase/schema.sql`.

Schema note: `supabase/schema.sql` has no business/owner/role or audit-history table or column. Do not assume these fields exist when implementing isolation, RBAC or change auditing.
