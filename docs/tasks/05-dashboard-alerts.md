# 05 — Dashboard and in-app alerts

## Goal
Give the owner a single dashboard of the business's financial and stock position, plus one alert centre combining low-stock, customer-overdue and supplier-overdue items.

## User Flow
1. Open the dashboard; show loading, empty and error states while data loads.
2. Show today's income and expenses from `transactions.transaction_date`, cash balance from `payment_method = 'cash'` income minus expense, and bank/online balance from `bank`, `qr` and `online` income minus expense.
3. Show customer receivables from `customer_credit_sale` minus `customer_payment`, supplier payables from `supplier_purchase` minus `supplier_payment`, and inventory value from `products.current_stock × products.purchase_price`.
4. Show counts of active products at or below `min_stock` and of parties past `due_date` with an outstanding balance; list recent transactions and upcoming payment reminders.
5. Open **Alerts** to see the same low-stock and overdue items with the product/party, amount and due date; the list updates automatically when stock is replenished or balances are cleared.

## Database tables and columns used
- `transactions`: `id`, `type`, `party_id`, `amount`, `category`, `payment_method`, `description`, `due_date`, `transaction_date`, `created_at`.
- `parties`: `id`, `name`, `type` (to distinguish customer and supplier balances).
- `products`: `id`, `name`, `current_stock`, `min_stock`, `purchase_price`, `is_active`.
- `stock_movements`: `id`, `product_id`, `type`, `quantity`, `created_at` (for recent stock activity if shown).

Schema note: this is a read-only slice over the existing tables. `supabase/schema.sql` does define `businesses`, `business_members`, `audit_log` and a NOT NULL `business_id` on `parties`, `products`, `transactions` and `stock_movements`, but its RLS policies are demo-only (`anon` has full access) and the app scopes to a single configured business, so the view cannot assume per-business or per-role scoping is enforced at the DB layer.
