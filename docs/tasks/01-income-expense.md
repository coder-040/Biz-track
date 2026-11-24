# 01 — Income and expense tracking

## Goal
Let owners and staff record, review, filter, edit and delete everyday cash, bank, QR and online income/expenses so daily financial totals stay accurate.

## User Flow
1. Open **Transactions** and choose **New transaction**.
2. Select `type` = `income` or `expense`; enter a positive `amount`, `transaction_date`, the required `category`, and `payment_method` (`cash`, `bank`, `qr`, `online`); optionally add a `description` and a bill `attachment_url`.
3. Save. The transaction appears in the list and the dashboard totals update.
4. Filter the list by date range, `category` and `payment_method`.
5. Edit or delete a transaction, with confirmation; once the schema supports it, record who changed what and when in the audit history.

## Database tables and columns used
- `transactions`: `id`, `type`, `amount`, `category`, `payment_method`, `description`, `attachment_url`, `transaction_date`, `created_at`. Use the `amount > 0` check and the allowed `type` / `payment_method` values defined in `supabase/schema.sql`.
- No other table is needed for this slice.

Schema note: `supabase/schema.sql` has no business/owner/role or audit-history table or column. Per `AGENTS.md`, design and apply those schema changes with approval before implementing data isolation, RBAC and edit/delete auditing; do not assume they already exist.
