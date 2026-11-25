<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BizTrack agent notes

## Commands

- Single npm package: use npm (`package-lock.json`), not the yarn/pnpm/bun commands in the stock README. Source lives in `src/`; the README's `app/page.tsx` is stale.
- Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm test`.
- Typecheck: `npx next typegen && npx tsc --noEmit`. `PageProps`, `LayoutProps`, and `RouteContext` are generated globals, so bare `tsc` fails in `layout.tsx` before typegen. `next-env.d.ts` and `.next/types` are generated and gitignored — don't edit them.

## MVP guardrails

- Single-user demo: no login, signup, or Supabase Auth. Don't add auth flows.
- Stack is fixed: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, `@supabase/supabase-js`. Keep solutions simple, clean, demo-ready; avoid over-engineering.
- `supabase/schema.sql` is the source of truth for tables/columns/types — read it before any Supabase query or DB type. Never guess names. If a feature needs a new table/column, update it first and tell the user to apply the SQL in Supabase. Its header says it is context-only and may not execute as-is, so verify SQL before advising.
- Supabase is wired in `src/lib/supabase/server.ts` using the public URL and anon key. `.env.local` is gitignored and only holds those two public values. Inventory writes call the `record_stock_movement` RPC, so apply that function definition from `supabase/schema.sql` in Supabase before testing stock changes.

## Next.js specifics

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Under this model, uncached data needs `use cache` or a `<Suspense>` boundary; legacy `dynamic`/`revalidate` segment config is replaced. Read `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` before adding fetches or cookie reads.
- `src/app/layout.tsx` uses the global `LayoutProps<"/">` helper with no import.

## UI guidelines

- Use shadcn/ui first: `npx shadcn@latest add <component>`. Don't hand-build buttons, inputs, dialogs, etc. Use `lucide-react` for icons.
- Tailwind utility classes only; no new custom CSS or inline styles. Use theme tokens (`bg-background`, `text-muted-foreground`), not hardcoded colors, and `cn()` for conditional classes. `src/app/globals.css` is shadcn-managed theme tokens plus `shadcn/tailwind.css`; treat it as generated. Tailwind v4 runs via the `@tailwindcss/turbopack` loader in `next.config.ts`; no `tailwind.config.*`.
- `cn` comes from `@/lib/utils` (re-exports the `cn` package, not clsx/tailwind-merge).
- Mobile-first, responsive, consistent spacing/typography. Every data-driven view handles loading, empty, and error states. Use `sonner` toasts for action feedback; the shared `Toaster` is mounted in the root layout.
- Server Components by default; `"use client"` only for state, effects, or event handlers.
- Accessibility: semantic HTML, labels on all inputs, alt text on images.

## Tests

- Vitest (`npm test`) is the only test runner; do not install Playwright or Cypress. Write unit tests for pure business logic. Pure inventory rules live in `src/lib/inventory.ts` with tests in `src/lib/inventory.test.ts`.
- No jsdom or `@testing-library/*` is installed; DOM tests need new deps. `vite` is installed as the Vitest peer.

## Repo-local instructions

- PR bodies follow `.opencode/skills/pr-writer/SKILL.md`: Conventional Commits title, DB-changes note, `npm test` steps; do not run `gh` or push.
- `.agents/skills/` is vendored via `skills-lock.json`; treat it as managed.
