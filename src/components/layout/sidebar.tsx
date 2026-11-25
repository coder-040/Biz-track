"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangleIcon,
  DatabaseIcon,
  PlusIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarProps {
  demo: boolean;
}

const NAV_ITEMS = [
  {
    href: "/parties",
    label: "Customers",
    icon: UsersIcon,
    matches: ["/parties"],
  },
  {
    href: "/parties#overdue",
    label: "Overdue",
    icon: AlertTriangleIcon,
  },
  {
    href: "/parties#add-customer",
    label: "Add customer",
    icon: UserPlusIcon,
  },
];

export function Sidebar({ demo }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-svh w-[268px] shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground lg:flex">
      <div className="px-6 pt-7">
        <Link href="/parties" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-orange text-brand-orange-foreground shadow-float">
            <WalletIcon className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-heading text-xl font-bold leading-none tracking-tight text-white">
              BizTrack
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Nepal Edition
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-8 px-5">
        <Link
          href="/parties#add-customer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange text-sm font-semibold text-brand-orange-foreground shadow-float transition-colors hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/25"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Quick add
        </Link>
      </div>

      <div className="mt-9 px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
          Main ledger
        </p>
        <nav aria-label="Main navigation" className="mt-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.matches?.some(
                (match) =>
                  pathname === match || pathname.startsWith(`${match}/`),
              ) ?? false;

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active ? "text-brand-orange" : "text-white/45",
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-orange/15 text-brand-orange">
              <DatabaseIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {demo ? "Demo workspace" : "Live workspace"}
              </p>
              <p className="truncate text-[11px] text-white/50">
                {demo ? "Resets on restart" : "Connected to Supabase"}
              </p>
            </div>
          </div>
        </div>
        <p className="px-1 pt-3 text-[10px] leading-relaxed text-white/35">
          Customer credit · Udharo
          <br />
          BizTrack Nepal Edition
        </p>
      </div>
    </aside>
  );
}
