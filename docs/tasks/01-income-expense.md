# 01 — Income and expense tracking

## Goal
Let owners and staff record, review, filter, edit and delete everyday cash, bank, QR and online income/expenses so daily financial totals stay accurate.

## User Flow
1. Open **Transactions** and choose **New transaction**.
2. Select `type` = `income` or `expense`; enter a positive `amount`, `transaction_date`, the required `category`, and `payment_method` (`cash`, `bank`, `qr`, `online`); optionally add a `description` and a bill `attachment_url`.
3. Save. The transaction appears in the list and the dashboard totals update.
4. Filter the list by date range, `category` and `payment_method`.
5. Edit or delete a transaction, with confirmation; record who changed what and when in the audit history.

## Database tables and columns used
- `transactions`: `id`, `type`, `amount`, `category`, `payment_method`, `description`, `attachment_url`, `transaction_date`, `created_at`. Use the `amount > 0` check and the allowed `type` / `payment_method` values defined in `supabase/schema.sql`.
- `audit_log`: `id`, `business_id`, `entity_type`, `entity_id`, `action`, `actor_id`, `actor_name`, `changes`, `created_at` (edit/delete auditing).

Schema note: `supabase/schema.sql` does define `businesses`, `business_members` (roles `owner`/`staff`), `audit_log`, and a NOT NULL `business_id` on `parties`, `products`, `transactions` and `stock_movements`. Its RLS policies are demo-only (`anon` has full access), so per-business isolation is not enforced at the DB layer. Business scoping and RBAC are handled outside this slice; edit/delete auditing writes to `audit_log` as described above.
