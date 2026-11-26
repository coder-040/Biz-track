# BizTrack implementation status

**Reviewed:** 2026-11-26

**Scope:** [`prd/Prd.md`](./prd/Prd.md), all six files in [`tasks/`](./tasks/), the user-assigned follow-up work in this development history, and the current application/schema.

## Executive summary

The six task areas have working application code for their core workflows. Several of the user-assigned extensions are also implemented, including supplier orders, product sales, order-linked stock receiving, identity duplicate guards, branding, and toast feedback. The approved authentication and business-account feature is now in progress: SSR session handling, auth routes/actions, business setup/context, permission checks, and restrictive RLS changes are in the codebase, but invitations, member management, profile editing, and live database verification remain.

This is **not yet a fully verified MVP deployment**. The latest `supabase/schema.sql` changes have not been applied to the configured Supabase database. The last known browser verification found the live database missing `supplier_orders.product_id`, so supplier-order workflows can fail until the schema is applied. The new RLS policies and authenticated flows have not been validated against a live Supabase project; existing demo data is still intentionally unclaimed and must not be exposed until its owner is mapped.

## Status key

- **Implemented** — the requested behavior is present in the application code.
- **Partial** — the main workflow exists, but an acceptance criterion, safety property, or integration step remains.
- **Not implemented** — no complete implementation was found.
- **Blocked operationally** — code exists, but depends on a deployment or database step that has not been completed.

## `docs/tasks/` task status

| Task | Status | What is implemented | Remaining notes |
| --- | --- | --- | --- |
| [01 — Income and expense](./tasks/01-income-expense.md) | Implemented; deployment blocked | Money Flow recording, filtering, pagination, editing/deleting, audit entries, Quick Add income/expense dialog, and cash-basis totals across paid transaction types. | The task file says its schema was executed, but that conflicts with later live-browser evidence of missing supplier-order columns. Verify the configured database before relying on database-backed flows. |
| [02 — Customer credit](./tasks/02-customer-credit.md) | Implemented; deployment blocked | Customer records, credit sales, partial payments, balance/overdue calculations, customer-list actions, detail ledger, duplicate-identity checks, and deletion protection for open credit. | Payment overage is checked in application code; simultaneous payments are not serialized by a database RPC/constraint. Authentication is intentionally out of scope. |
| [03 — Supplier payments](./tasks/03-supplier-payments.md) | Implemented; deployment blocked | Supplier payables, payments, due dates, deletion guard, order/payment history, FIFO allocation for supplier-level payments, and automatic balance-derived Credit/Paid tags. | Apply and verify the current Supabase schema. The formal task predates the additional supplier-order board and product-linked orders. |
| [04 — Inventory and stock](./tasks/04-inventory-stock.md) | Implemented; deployment blocked | Product catalogue, stock movements, low-stock thresholds, archive/history, restocking, product sales, and atomic order receipt stock updates with audit records. | The optional barcode field from the PRD is not implemented. Database functions and constraints require the latest schema to be applied. |
| [05 — Dashboard and alerts](./tasks/05-dashboard-alerts.md) | Partial | Financial/inventory summary, weekly flow, recent transactions, low-stock alerts, overdue customer/supplier balances, navbar alert access, and a regression-tested fix preventing a settled supplier purchase from appearing as a due alert. | The PRD's monthly dashboard overview and accurate upcoming-due reminders are not fully represented. The existing future-due query is not a complete per-transaction outstanding allocation model. |
| [06 — Reports and exports](./tasks/06-reports-export.md) | Implemented | Date-filtered daily/monthly income-expense, customer outstanding, supplier payable, inventory, low-stock, stock movement, and payment-history reports, with CSV and Excel-compatible export. | Excel export is SpreadsheetML with an `.xls` extension rather than a modern `.xlsx` workbook. Live-data reconciliation depends on the deployed schema and data. |

## PRD acceptance review

| PRD story / area | Status | Assessment |
| --- | --- | --- |
| US-1 — Registration, login, business setup | **Partial; in progress** | Supabase Auth SSR sessions, login, registration, recovery, callback, and atomic business/Owner setup are implemented in code. Live email delivery, SQL deployment, and end-to-end flows are not verified. |
| US-2 — Staff accounts and permissions | **Partial; in progress** | Owner/Admin/Staff permission defaults and route/data-layer guards are present. Invitation and member lifecycle workflows remain unimplemented. |
| US-3 — Dashboard | **Partial** | Core daily financial, balance, inventory, recent-transaction, and weekly-flow views exist. Monthly overview and fully accurate future-due reminders remain incomplete. |
| US-4 — Record income and expenses | **Implemented** | Positive amount, date, category, payment method, optional description/attachment, and dashboard/report accounting are present. |
| US-5 — Edit/delete with audit history | **Implemented in code** | Transaction changes are audited; audit persistence must be verified against the current Supabase schema. |
| US-6 — Customer credit and payments | **Implemented with concurrency caveat** | Credit, partial payment, outstanding balances, and overpayment rejection are present. Concurrent payments can race because balance validation is not an atomic database operation. |
| US-7 — Overdue customers | **Implemented** | Remaining credit is allocated to sales for overdue calculation; cleared balances stop appearing as overdue. |
| US-8 — Supplier purchases and payments | **Implemented; deployment blocked** | Supplier payables, order creation/receipt, order-specific payments, FIFO supplier-level payments, and payable updates exist in code/schema. |
| US-9 — Overdue suppliers | **Implemented at party level** | Outstanding payable and past-due supplier balances are surfaced; order card Credit/Paid status is derived from outstanding amount. |
| US-10 — Product and stock management | **Implemented, except barcode** | Stock changes are tied to movements for the implemented restock, sale, and order-receipt flows. Barcode is absent. |
| US-11 — Low-stock alerts | **Implemented** | Active products at/below minimum are listed, and stock replenishment clears the condition when above threshold. |
| US-12 — Reports and exports | **Implemented** | The requested report families, date ranges, totals, CSV, and Excel-compatible export are present. |
| US-13 — In-app alerts | **Partial** | Low-stock and overdue alerts are present, including the settled-supplier stale-alert regression fix. Future reminders are not yet a complete outstanding-by-due-date view. |
| Responsive UI | **Implemented in code** | Responsive layouts and mobile interactions are used across the new flows; this review did not repeat a full device-by-device manual test. |
| Strict tenant isolation / secure access | **Partial; not production-ready** | Server loaders use the authenticated active-business membership, browser operations use that verified context, and the schema now defines authenticated permission-based RLS. These changes are not applied or live-tested; the configured database may still have the older demo policies. |
| Audit history | **Implemented in code; DB verification pending** | Financial and inventory operations write audit records in the implemented flows. Confirm the latest database schema/functions are deployed. |
| Backups | **Not verified / not implemented here** | No backup or restore workflow was found in the reviewed implementation. |

## Additional user-assigned work outside the six formal task files

### Implemented

- Changed the sidebar location to **Pokhara** and removed the duplicate loading shell.
- Consolidated Quick Add into a clear income/expense modal; added a dashboard sale modal and a Product Sales page.
- Added supplier-aware restocking with paid/partial/unpaid amounts; paid portions are expenses and unpaid balances become supplier payables.
- Added product/customer selection for sales and supplier orders, quantity on orders, and stock increase/decrease plus movement/audit history on receipt/sale.
- Added the two-lane **Ordered / Received** supplier board, derived Credit/Paid tags, order details/payment history, drag/touch/keyboard interaction, and FIFO supplier payment allocation.
- Moved customer and supplier creation into dialogs/buttons; kept customer credit and payment actions on the customer list.
- Moved the dashboard Alerts action into the navbar, removed the requested dashboard action buttons, and reordered Record sale before Quick Add.
- Blocked deletion of parties with open customer credit or supplier payable at the database layer; supplier UI also gives a specific outstanding-payable message. No customer-delete UI currently exists.
- Added duplicate product-name prevention and duplicate party name/phone detection across customer/supplier types.
- Fixed the supplier-order payment form so its default Cash method is also the value submitted and validated.
- Added BizTrack SVG branding for the sidebar/favicon, operation toasts, and [`design.md`](../design.md). Dashboard, Stockroom, and Reports now share prominent page-specific skeleton layouts between route-level loading and their data-streaming Suspense fallbacks, with accessible loading labels.
- Added a consistent red asterisk for required fields across dialogs and transaction forms; labels no longer spell out “required,” and conditional fields only show the marker while required.
- Fixed the stale supplier reminder path: the alert no longer presents a raw supplier purchase when no current supplier balance exists.

### Follow-up changes

- Money Flow filters now update the list in the client and synchronize the URL with the native History API, avoiding a server-component refresh for filter changes.
- Transfer/Reconcile and Passbook routes were removed at the user's request; their dashboard buttons had already been removed.

## Authentication and business-account feature status

**Status: In progress; not deployment-ready.** The attached specification has been adapted to this repository's Next.js App Router and Supabase architecture. A separate, more detailed progress record is maintained in [`authentication-implementation-status.md`](./authentication-implementation-status.md).

### Confirmed decisions

- Use Supabase Auth and its configured email delivery for authentication, recovery, and invitations.
- Leave the existing BizTrack Demo business and its records unclaimed; the user will map an owner manually using SQL.
- New Staff memberships default to inventory operations only, with no financial dashboard or report access.

### Implementation checklist

| Area | Status | Current finding / required outcome |
| --- | --- | --- |
| Cookie-backed auth and protected routes | Implemented in code; needs live verification | SSR cookie clients, Next.js proxy session refresh, protected routes, login/logout, registration, callback, and password reset/update are present. |
| Profile and business onboarding | Partial | Auth metadata/profile creation, business setup validation, idempotent business/Owner RPC, and selection are present. Profile editing and account/email management are not. |
| Business context and switching | Partial | Active business selection uses a verified membership and HttpOnly cookie. Server loaders and audited browser flows no longer use configured demo business/actor IDs. |
| Roles and permissions | Partial | Owner/Admin/Staff defaults, sidebar filtering, server data guards, Server Action checks, and matching SQL permission helpers are present. Staff defaults to inventory only. |
| Team invitations and member lifecycle | Not implemented | The invitation table exists, but invite creation, acceptance, revocation, member removal, and invitation email delivery are not implemented. |
| PostgreSQL isolation and audit identity | Implemented in schema; unverified | Authenticated permission-based RLS, identity-derived audit actor, and function permissions are in `supabase/schema.sql`. The SQL has not been applied or tested against a database; the existing demo business remains unclaimed. |
| Verification and setup documentation | Partial | Focused permission/validation tests and a separate status file exist. Supabase Auth/email settings, redirect allow-list, schema deployment, manual legacy-owner mapping, and live flow verification remain operational steps. |

## Operational and product gaps to resolve

1. **Apply the latest [`supabase/schema.sql`](../supabase/schema.sql) in Supabase.** The current repository includes new supplier-order columns, indexes, policies, triggers, and RPC functions. The last known live error was that `supplier_orders.product_id` did not exist.
2. Before applying uniqueness indexes, check existing product names and party name/phone pairs for duplicates; resolve conflicts without discarding referenced transaction or stock history.
3. Finish the approved authentication feature: implement team invitations/member lifecycle and profile management, then verify every flow against Supabase. Until the schema is deployed and tested, the current database policies cannot be assumed restrictive.
4. Complete accurate future-due reminders/monthly dashboard overview and decide whether concurrent customer payments need atomic database enforcement.
5. Decide whether to add barcode support and a modern `.xlsx` export if those exact formats are required.

## Verification snapshot

The latest UI updates passed:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build -- --webpack`
- `git diff --check`

The initial streamed HTML contains page-specific skeletons for `/`, `/inventory`, and `/reports`; all three routes returned HTTP 200 after the changes. No automated test command was run for these UI-only updates. These checks do **not** validate the Supabase migration or live database RPC behavior.
