# 04 — Products, stock movements and low-stock alerts

## Goal
Maintain a product catalogue whose stock level always matches its logged purchase, sale, damage, loss and adjustment history, with low-stock items flagged automatically.

## User Flow
1. Create a product with `name`, optional `sku` and `category`, `purchase_price`, `selling_price`, starting `current_stock`, `min_stock`, optional `supplier_id`, and `is_active = true`.
2. Record a stock movement of type `purchase`, `sale`, `damaged`, `lost` or `adjustment` with a positive `quantity`, optional `unit_cost`, and a `reason` for damage/loss/adjustment. Optionally link a related `transaction_id`.
3. In one database transaction, insert the `stock_movements` row and update `products.current_stock`: add for purchases, subtract for sales/damaged/lost, apply the signed change for adjustments.
4. Show movement history per product and a low-stock list where `current_stock <= min_stock` and `is_active = true`; the alert clears once stock rises above the threshold.
5. Archive a product by setting `is_active = false` so it disappears from active lists but keeps its history. Show inventory value as `current_stock × purchase_price`.

## Database tables and columns used
- `products`: `id`, `name`, `sku`, `category`, `purchase_price`, `selling_price`, `current_stock`, `min_stock`, `supplier_id`, `is_active`, `created_at`. `supplier_id` references `parties.id`.
- `stock_movements`: `id`, `product_id`, `transaction_id`, `type`, `quantity`, `unit_cost`, `reason`, `created_at`. `product_id` references `products.id`; `transaction_id` references `transactions.id`; allowed `type` values and `quantity > 0` come from `supabase/schema.sql`.
- `parties`: `id` only, as the target of `products.supplier_id`.

Schema note: the PRD mentions an optional barcode, but `supabase/schema.sql` has no corresponding column. It does define `businesses`, `business_members`, `audit_log` and a NOT NULL `business_id` on `parties`, `products`, `transactions` and `stock_movements`; its RLS policies are demo-only (`anon` has full access), so per-business isolation is not enforced at the DB layer. Business scoping, RBAC and change auditing are handled outside this slice — do not reimplement them here.
