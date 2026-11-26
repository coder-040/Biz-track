"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Calendar,
  FileText,
  LayoutGrid,
  Menu,
  Package,
  Search,
  Truck,
  Users,
  X,
  ChevronsUpDown,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", href: "/", icon: LayoutGrid },
  { id: "transactions", label: "Money Flow", href: "/transactions", icon: ArrowLeftRight },
  { id: "parties", label: "Customers", href: "/parties", icon: Users },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: Truck },
  { id: "inventory", label: "Stockroom", href: "/inventory", icon: Package },
  { id: "reports", label: "Reports", href: "/reports", icon: FileText },
];

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname !== null &&
          (item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/12 text-white shadow-xs"
                : "text-emerald-100/70 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavigation({ onNavigate }: { onNavigate: () => void }) {
  return (
    <NavigationLinks pathname={usePathname()} onNavigate={onNavigate} />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0C3B37] px-3.5 py-5 text-white">
      <div>
        <div className="border-b border-white/10 px-2 pb-5 text-center">
          <h1 className="text-lg font-bold tracking-tight text-white">
            BizTrack
          </h1>
          <p className="mt-0.5 text-[11px] text-emerald-200/75">
            व्यापार खाता • Nepal Edition
          </p>
        </div>

        <div className="mt-4 px-1">
          <Link
            href="/transactions"
            onClick={() => setMobileNavOpen(false)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#F4C44E] text-sm font-semibold text-[#0C3B37] shadow-sm transition-colors hover:bg-[#e5b53f]"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Quick Add
          </Link>
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/50">
            Main Ledger
          </p>
          <Suspense
            fallback={
              <NavigationLinks
                pathname={null}
                onNavigate={() => setMobileNavOpen(false)}
              />
            }
          >
            <ActiveNavigation onNavigate={() => setMobileNavOpen(false)} />
          </Suspense>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2.5 rounded-xl bg-white/8 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F4C44E]/40 bg-[#F4C44E]/20 text-xs font-bold text-[#F4C44E]">
              BT
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                BizTrack General Store
              </p>
              <p className="truncate text-[10px] text-emerald-200/70">
                Pokhara
              </p>
            </div>
          </div>
          <ChevronsUpDown
            className="h-3.5 w-3.5 shrink-0 text-emerald-200/60"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F6F2] text-stone-900">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 lg:block">
        {sidebarContent}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 h-full w-60">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 p-1 text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 px-4 py-3 backdrop-blur lg:px-7">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex max-w-md flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
                className="rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  aria-label="Search"
                  placeholder="Search bills, items, udharo party..."
                  className="h-9 w-full rounded-xl border border-stone-200/80 bg-[#F8F6F2] pl-9 pr-3 text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0C3B37]/20 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-1.5 rounded-xl border border-stone-200/80 bg-[#F8F6F2] px-3 py-1.5 text-xs text-stone-600 md:flex">
                <Calendar className="h-3.5 w-3.5 text-[#0C3B37]" />
                <span>Today</span>
              </div>
              <Link
                href="/transactions"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0C3B37] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#092e2b]"
              >
                <span aria-hidden="true" className="text-base leading-none">+</span>
                Add
              </Link>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#0C3B37] text-xs font-semibold text-white sm:flex">
                RJ
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
