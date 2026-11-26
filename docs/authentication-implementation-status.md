# Authentication and business-account implementation status

**Status:** In progress; not deployment-ready  
**Reviewed:** 2026-11-26  
**Architecture:** Next.js App Router with Supabase Auth and PostgreSQL

The approved authentication specification has been adapted to the repository's Next.js/Supabase architecture. This document records code that exists separately from work that remains. It does not claim that authentication, email delivery, database policies, or tenant isolation have been tested against a live Supabase project.

## Decisions confirmed

- Supabase Auth and its configured email delivery are the authentication provider.
- Existing BizTrack Demo records remain unclaimed until the owner is mapped manually in Supabase.
- New Staff memberships default to inventory access only, without finance, dashboard, or report access.

## Implemented in the repository

- Cookie-aware server and browser Supabase clients using `@supabase/ssr`.
- Next.js `src/proxy.ts` session refresh and unauthenticated-route handling.
- Login, registration, password-reset request, password update, callback, and sign-out flows.
- Business setup with an idempotent `create_business_with_owner` RPC and Owner membership.
- Profile creation from Supabase Auth metadata.
- Verified membership lookup, active-business selection in an HttpOnly cookie, and business selection UI.
- Owner/Admin/Staff permission defaults; Staff defaults to `view_products` and `manage_inventory`.
- Server-side permission checks for dashboard, finance, inventory, sales, and reports data.
- Business context in the application shell and client financial/supplier actions; configured demo business and actor IDs are no longer used by those paths.
- Permission-filtered navigation and an access-denied page.
- `supabase/schema.sql` changes for profiles, memberships, invitations table structure, permission helpers, authenticated RLS policies, audit actor identity, and protected function grants. Policy creation is repeatable in the script.
- Team invitation UI with secure 7-day links, Staff/Admin role assignment, pending-invitation revocation, and email/registration-aware acceptance.

## Not implemented or unverified

- Automatic invitation email delivery. The implemented workflow creates a secure link that the inviter can copy or open in their email app. Supabase SMTP/service credentials are not configured in the application.
- Member removal or role changes after a member has joined.
- Profile editing, email changes, account deactivation, and business ownership transfer/deletion UI.
- Applying or executing the updated `supabase/schema.sql` against the configured Supabase project.
- Live verification of registration/confirmation email, login, reset email, business setup, business switching, role restrictions, RLS isolation, and audit history.
- End-to-end browser verification with Owner, Admin, and Staff accounts.
- Manual mapping of the existing BizTrack Demo membership to its intended authenticated owner.

Until SQL deployment and live authorization checks are complete, do not treat the authentication or tenant-isolation work as production-ready. The database may still be running its previous policies.

## Required Supabase setup

1. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS origin in production.
3. Configure Supabase Auth email confirmation and allow the deployed callback URLs used by `/auth/callback`.
4. Review and execute [`../supabase/schema.sql`](../supabase/schema.sql) in the intended Supabase project before using the auth flows. This repository still uses manual SQL deployment.
5. If retaining the existing Demo data, map its existing `business_members` row to the intended Supabase Auth user ID manually. Do not assign the demo business to an arbitrary account.

No Supabase service-role key is used by the implemented flows. Never expose a service-role key to browser code.

## Validation performed

- `npx tsc --noEmit` — passed.
- `npm run lint` — passed.
- `npm test` — 11 test files and 72 tests passed.
- `npm run build -- --webpack` — passed.
- `git diff --check` — passed.
- Database SQL execution and live Supabase verification — not performed.
- Browser verification of auth email flows and role separation — not performed.

The obsolete credit data test exercised the removed unauthenticated in-memory demo store and was deleted; credit calculation tests remain in the full suite. Dependency installation previously reported four moderate audit findings, which have not been investigated.

Update this section after each validation run; do not mark the feature complete until the pending workflows and live checks above are resolved.
