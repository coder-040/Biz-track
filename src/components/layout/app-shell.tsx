"use client";

import { Suspense, useCallback, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Calendar,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  X,
  ChevronsUpDown,
} from "lucide-react";
import { NavbarActionContext } from "@/components/layout/navbar-action-context";
import {
  BusinessContextProvider,
  useBusinessContext,
} from "@/components/auth/business-context";
import { signOut } from "@/app/auth/actions";
import { can, type BusinessPermission } from "@/lib/auth/permissions";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutGrid },
  { id: "transactions", label: "Money Flow", href: "/transactions", icon: ArrowLeftRight },
  { id: "sales", label: "Product Sales", href: "/sales", icon: ShoppingCart },
  { id: "parties", label: "Customers", href: "/parties", icon: Users },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: Truck },
  { id: "inventory", label: "Stockroom", href: "/inventory", icon: Package },
  { id: "reports", label: "Reports", href: "/reports", icon: FileText },
  { id: "settings", label: "Team", href: "/settings/members", icon: Settings },
];

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate: () => void;
}) {
  const { context, loading } = useBusinessContext();
  if (loading) {
    return (
      <p className="px-3 py-2 text-xs text-emerald-100/60" role="status">
        Loading navigation…
      </p>
    );
  }

  const activeRole = context?.activeRole;
  const visibleItems = activeRole
    ? NAV_ITEMS.filter((item) => {
        const permission: BusinessPermission =
          item.id === "overview"
            ? "view_dashboard"
            : item.id === "settings"
              ? "manage_members"
              : item.id === "transactions" ||
                item.id === "parties" ||
                item.id === "suppliers"
              ? "view_finances"
              : item.id === "sales"
                ? "manage_finances"
                : item.id === "inventory"
                  ? "view_products"
                  : "view_reports";
        return can(
          activeRole,
          permission,
          context.activePermissions,
        );
      })
    : [];

  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname !== null &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

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

function BusinessWorkspace() {
  const { context, loading, error } = useBusinessContext();
  const activeBusiness = context?.activeBusinessName;
  const activeRole = context?.activeRole;

  const content = (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F4C44E]/40 bg-[#F4C44E]/20 text-xs font-bold text-[#F4C44E]">
        BT
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-white">
          {activeBusiness ?? (loading ? "Loading business…" : "No business selected")}
        </p>
        <p className="truncate text-[10px] capitalize text-emerald-200/70">
            {error ?? activeRole ?? "Business workspace"}
        </p>
      </div>
    </div>
  );

  if ((context?.memberships.length ?? 0) > 1) {
    return (
      <Link
        href="/business/select"
        className="flex items-center justify-between gap-2.5 rounded-xl bg-white/8 px-3 py-2.5 hover:bg-white/12"
        aria-label="Switch business"
      >
        {content}
        <ChevronsUpDown
          className="h-3.5 w-3.5 shrink-0 text-emerald-200/60"
          aria-hidden="true"
        />
      </Link>
    );
  }

  return <div className="rounded-xl bg-white/8 px-3 py-2.5">{content}</div>;
}

function AccountControls() {
  const { context, loading } = useBusinessContext();
  const displayName = context?.user.fullName || context?.user.email || "";
  const initials =
    displayName
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || (loading ? "…" : "?");

  return (
    <div className="flex items-center gap-2">
      <div className="hidden max-w-36 truncate text-xs font-medium text-stone-600 xl:block">
        {displayName}
      </div>
      <div
        className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#0C3B37] text-xs font-semibold text-white sm:flex"
        aria-label={displayName ? `Signed in as ${displayName}` : "Account"}
      >
        {initials}
      </div>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Log out"
          title="Log out"
          className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navbarAction, setNavbarAction] = useState<{
    id: string;
    element: ReactNode;
  } | null>(null);
  const registerNavbarAction = useCallback(
    (id: string, element: ReactNode | null) => {
      setNavbarAction((current) => {
        if (element === null) return current?.id === id ? null : current;
        return { id, element };
      });
    },
    [],
  );

  const usesPublicLayout = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/setup/business",
    "/business/select",
    "/invite",
    "/auth/callback",
    "/privacy",
    "/terms",
  ].some((path) => pathname === path || pathname?.startsWith(`${path}/`));

  if (usesPublicLayout) return <>{children}</>;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0C3B37] px-3.5 py-5 text-white">
      <div>
        <div className="border-b border-white/10 px-2 pb-5 text-center">
          <div className="flex items-center justify-center gap-2.5">
            <Image
              src="/icon.svg"
              width={38}
              height={38}
              alt=""
              aria-hidden="true"
            />
            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight text-white">
                BizTrack
              </h1>
              <p className="mt-0.5 text-[11px] text-emerald-200/75">
                व्यापार खाता • Nepal Edition
              </p>
            </div>
          </div>
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
        <BusinessWorkspace />
      </div>
    </div>
  );

  return (
    <BusinessContextProvider>
    <NavbarActionContext.Provider value={registerNavbarAction}>
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
                {navbarAction?.element}
                <div className="hidden items-center gap-1.5 rounded-xl border border-stone-200/80 bg-[#F8F6F2] px-3 py-1.5 text-xs text-stone-600 md:flex">
                  <Calendar className="h-3.5 w-3.5 text-[#0C3B37]" />
                  <span>Today</span>
                </div>
                <AccountControls />
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </NavbarActionContext.Provider>
    </BusinessContextProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-[#F8F6F2]"
          role="status"
          aria-label="Loading BizTrack"
        />
      }
    >
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
