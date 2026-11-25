"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertsSheet } from "@/components/dashboard/alerts-sheet";
import {
  Bell,
  LayoutGrid,
  ArrowLeftRight,
  Package,
  TrendingUp,
  Plus,
  Search,
  Calendar,
  Menu,
  X,
  ChevronsUpDown,
} from "lucide-react";
import type { LowStockProduct, PartyBalance } from "@/lib/dashboard";

type DashboardShellProps = {
  children: React.ReactNode;
  totalAlerts: number;
  lowStockProducts: LowStockProduct[];
  overdueCustomers: PartyBalance[];
  overdueSuppliers: PartyBalance[];
  customerBalances: PartyBalance[];
  supplierBalances: PartyBalance[];
  todayLabel: string;
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid, active: true },
  { id: "money-flow", label: "Money Flow", icon: ArrowLeftRight, active: false },
  { id: "stockroom", label: "Stockroom", icon: Package, active: false },
  { id: "insights", label: "Insights", icon: TrendingUp, active: false },
];

export function DashboardShell({
  children,
  totalAlerts,
  lowStockProducts,
  overdueCustomers,
  overdueSuppliers,
  customerBalances,
  supplierBalances,
  todayLabel,
}: DashboardShellProps) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0C3B37] text-white px-3.5 py-5">
      <div>
        {/* Brand */}
        <div className="px-2 pb-5 text-center border-b border-white/10">
          <h1 className="text-lg font-bold tracking-tight text-white">
            BizTrack
          </h1>
          <p className="text-[11px] text-emerald-200/75 mt-0.5">
            व्यापार खाता • Nepal Edition
          </p>
        </div>

        {/* Quick Add */}
        <div className="mt-4 px-1">
          <Button
            onClick={() => setAlertsOpen(true)}
            className="w-full bg-[#F4C44E] hover:bg-[#e5b53f] text-[#0C3B37] font-semibold rounded-xl h-10 gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Quick Add
          </Button>
        </div>

        {/* Navigation */}
        <div className="mt-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/50 mb-2">
            Main Ledger
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.active ? "/" : "#"}
                  onClick={(e) => {
                    if (!item.active) e.preventDefault();
                    setMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-white/12 text-white shadow-xs"
                      : "text-emerald-100/70 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Store Switcher */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between gap-2.5 rounded-xl bg-white/8 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#F4C44E]/20 border border-[#F4C44E]/40 flex items-center justify-center text-xs font-bold text-[#F4C44E] shrink-0">
              BT
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                BizTrack General Store
              </p>
              <p className="text-[10px] text-emerald-200/70 truncate">
                Ason, Kathmandu
              </p>
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-emerald-200/60 shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F6F2] text-stone-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-60 h-full z-10">
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-3 text-white/80 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-200/80 px-4 lg:px-7 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden p-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search bills, items, udharo party..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F8F6F2] border border-stone-200/80 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0C3B37]/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-600 bg-[#F8F6F2] border border-stone-200/80 px-3 py-1.5 rounded-xl">
                <Calendar className="h-3.5 w-3.5 text-[#0C3B37]" />
                <span>{todayLabel}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setAlertsOpen(true)}
                aria-label="Open alerts"
                className="relative h-9 w-9 rounded-xl border-stone-200 bg-white hover:bg-stone-50 cursor-pointer"
              >
                <Bell className="h-4 w-4 text-stone-700" />
                {totalAlerts > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] rounded-full"
                  >
                    {totalAlerts}
                  </Badge>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => setAlertsOpen(true)}
                className="bg-[#0C3B37] hover:bg-[#092e2b] text-white rounded-xl h-9 px-3.5 gap-1.5 text-xs font-medium cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>

              <div className="hidden sm:flex h-9 w-9 rounded-full bg-[#0C3B37] text-white items-center justify-center text-xs font-semibold">
                RJ
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-7 py-6">
          {children}
        </main>
      </div>

      {/* Alerts Slide-Over Sheet */}
      <AlertsSheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        lowStockProducts={lowStockProducts}
        overdueCustomers={overdueCustomers}
        overdueSuppliers={overdueSuppliers}
        customerBalances={customerBalances}
        supplierBalances={supplierBalances}
      />
    </div>
  );
}
