"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertsSheet } from "@/components/dashboard/alerts-sheet";
import {
  Bell,
  Plus,
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
};

export function DashboardShell({
  children,
  totalAlerts,
  lowStockProducts,
  overdueCustomers,
  overdueSuppliers,
  customerBalances,
  supplierBalances,
}: DashboardShellProps) {
  const [alertsOpen, setAlertsOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-7">
      <div className="mb-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAlertsOpen(true)}
          aria-label={`Open alerts${totalAlerts > 0 ? ` (${totalAlerts})` : ""}`}
        >
          <Bell className="h-4 w-4" />
          Alerts
          {totalAlerts > 0 && (
            <Badge variant="destructive" className="ml-1 rounded-full px-1.5">
              {totalAlerts}
            </Badge>
          )}
        </Button>
        <Button
          size="sm"
          onClick={() => setAlertsOpen(true)}
          className="bg-[#0C3B37] text-white hover:bg-[#092e2b]"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </div>
      {children}
      <AlertsSheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        lowStockProducts={lowStockProducts}
        overdueCustomers={overdueCustomers}
        overdueSuppliers={overdueSuppliers}
        customerBalances={customerBalances}
        supplierBalances={supplierBalances}
      />
    </main>
  );
}
