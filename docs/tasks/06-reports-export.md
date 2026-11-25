# 06 — Date-filtered reports and CSV/Excel export

## Goal
Let owners review and export transaction, credit, payable, inventory and stock reports with a date filter, with totals that match the underlying records.

## User Flow
1. Open **Reports** and choose a report: daily or monthly income/expense, customer outstanding, supplier payable, inventory, low stock, stock movement, or payment history.
2. Pick a date range; apply the filter and preview rows plus totals, with loading, empty and error states handled.
3. Verify totals match the records shown in the transactions, parties, products and stock-movement views.
4. Export the filtered report as CSV and as Excel; the exported rows and totals match the on-screen report.

## Database tables and columns used
- `transactions`: `id`, `type`, `party_id`, `amount`, `category`, `payment_method`, `description`, `due_date`, `transaction_date`, `attachment_url`, `created_at`. Filter primarily on `transaction_date`; use `due_date` for outstanding and overdue views.
- `parties`: `id`, `name`, `phone`, `type`, `address`, `created_at` (customer/supplier identity and contact details).
- `products`: `id`, `name`, `sku`, `category`, `purchase_price`, `selling_price`, `current_stock`, `min_stock`, `is_active`, `created_at` (inventory and low-stock reports).
- `stock_movements`: `id`, `product_id`, `transaction_id`, `type`, `quantity`, `unit_cost`, `reason`, `created_at`. Filter on `created_at` for stock-movement history.

Schema note: no new tables or columns are needed. `supabase/schema.sql` does define `businesses`, `business_members`, `audit_log` and a NOT NULL `business_id` on `parties`, `products`, `transactions` and `stock_movements`, but its RLS policies are demo-only (`anon` has full access), so exports cannot assume per-business scoping is enforced at the DB layer.
