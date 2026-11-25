<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repo shape

- Single npm package (no workspaces). App Router entrypoints are `src/app/layout.tsx` and `src/app/page.tsx`; `@/*` maps to `src/*`.
- `README.md` is unchanged create-next-app boilerplate with stale paths/package managers. Product scope is in `docx/Prd.md` (BizTrack MVP: finance, customer/supplier credit, inventory, reports).
- Supabase is configured for the demo: `supabase/schema.sql` contains the schema and demo seed, `.env.local` holds public/client env vars, and anon-key browser/server clients live in `src/lib/`. There is still no migration tool; execute schema SQL in Supabase manually.

## Commands and verification

- `npm run lint` and `npx tsc --noEmit` are the practical checks; there is no `typecheck` script. `npm run build` also runs TypeScript and currently passes.
- No test setup: no `test` script, no Vitest config/tests, and no test runner in dependencies. Don't claim tests ran. The `npm test` step in `.opencode/skills/pr-writer/SKILL.md` is stale.
- Add new UI primitives with `npx shadcn add <component>`; `components.json` targets Base Nova, RSC, Tailwind 4, and `src/components/ui/`. `src/lib/utils.ts` re-exports `cn` from the `cn` package.

## Toolchain quirks

- Next 16.4.6 with Cache Components and Partial Prefetching enabled in `next.config.ts`. Don't use removed route segment configs (`dynamic`, `revalidate`, `fetchCache`, `dynamicParams`, `runtime`); use `use cache`/`cacheLife` or wrap fresh async work in `<Suspense>`. Follow `node_modules/next/dist/docs/` for canonical patterns.
- `LayoutProps<'/'>` in `layout.tsx` is a globally generated route type; regenerate via `next dev`, `next build`, or `next typegen`. Never edit `next-env.d.ts` or replace that helper with a hand-written import.
- Tailwind 4 is compiled through the explicit `@tailwindcss/turbopack` loader rule in `next.config.ts`; there is no PostCSS config. Theme tokens and the `tailwindcss` / `tw-animate-css` / `shadcn/tailwind.css` imports live in `src/app/globals.css`.

## Product constraints from the PRD

- Treat strict per-business data isolation, owner/staff RBAC, audit history for financial and inventory changes, in-app low-stock/overdue alerts, and date-filtered CSV/Excel reports as MVP requirements.


## MVP Guardrails

- **Architecture:** Follow the existing Next.js App Router, TypeScript, Tailwind CSS 4, shadcn/ui, and Supabase JavaScript client architecture.
- **Database:** Always read `supabase/schema.sql` before writing Supabase queries or database types. Never invent table or column names. Before changing persistence, update `supabase/schema.sql` and tell the user to execute the SQL in Supabase.
- **Authentication:** Do not implement authentication unless explicitly approved in an updated product requirement.
- **Testing:** Do not claim tests ran unless they actually ran. Current practical checks are `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Do not add Playwright or Cypress.
- **Scope:** Keep solutions simple, maintainable, and demo-ready. Avoid over-engineering.
- **Product requirements:** Follow `docx/Prd.md` as the source of truth for product scope.

## UI Guidelines

- **Components:** Prefer existing shadcn/ui components. Add new primitives using `npx shadcn add <component>`. Use lucide-react for icons.
- **Styling:** Use Tailwind CSS 4 utility classes and existing theme tokens. Use `cn()` for conditional classes.
- **Layout:** Mobile-first and responsive. Maintain consistent spacing and typography.
- **States:** Every data-driven view must handle loading, empty, and error states. Use sonner for action feedback if already configured.
- **Architecture:** Server Components by default. Use "use client" only when client-side interaction is required.
- **Accessibility:** Use semantic HTML, labels for inputs, and alt text for images.
- **Next.js documentation:** Before implementing Next.js features, read the relevant documentation under `node_modules/next/dist/docs/`. Follow the repository's Next.js agent rules.
- **Security:** Enforce strict per-business data isolation, owner/staff RBAC, and audit history for financial and inventory changes when implementing the corresponding backend features.
- **Reports:** Support date-filtered CSV/Excel exports and in-app low-stock and overdue alerts as specified in the PRD.

## Supabase Database Architecture

The official database is Supabase PostgreSQL.

### Existing Tables
- `parties`: Customers and suppliers.
- `products`: Product catalogue, pricing and inventory.
- `transactions`: Financial transactions, credit sales, payments and purchases.
- `stock_movements`: Inventory movement history.

### Database Rules
- Always inspect `supabase/schema.sql` before writing queries or database types.
- Never invent table names, columns, relationships or database functions.
- Use the existing PostgreSQL schema as the source of truth.
- Update `supabase/schema.sql` before introducing schema changes.
- Maintain consistency between `products.current_stock` and `stock_movements`.
- Use database transactions for operations that modify multiple related records.
- Use appropriate constraints, indexes and Row Level Security policies.
- Never expose Supabase service-role credentials in frontend code.
- Generate TypeScript database types from the actual Supabase schema when configured.
