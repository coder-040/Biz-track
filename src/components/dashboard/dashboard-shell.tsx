"use client";

import { useEffect, useState } from "react";
import { AlertsSheet } from "@/components/dashboard/alerts-sheet";
import { RestockProductDialog } from "@/components/inventory/restock-product-dialog";
import { Bell } from "lucide-react";
import type { LowStockProduct, PartyBalance } from "@/lib/dashboard";
import type { SupplierOption } from "@/lib/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRegisterNavbarAction } from "@/components/layout/navbar-action-context";

type DashboardShellProps = {
  children: React.ReactNode;
  totalAlerts: number;
  lowStockProducts: LowStockProduct[];
  overdueCustomers: PartyBalance[];
  overdueSuppliers: PartyBalance[];
  suppliers: SupplierOption[];
  today: string;
  customerBalances: PartyBalance[];
  supplierBalances: PartyBalance[];
};

export function DashboardShell({
  children,
  totalAlerts,
  lowStockProducts,
  overdueCustomers,
  overdueSuppliers,
  suppliers,
  today,
  customerBalances,
  supplierBalances,
}: DashboardShellProps) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const registerNavbarAction = useRegisterNavbarAction();
  const [reorderProduct, setReorderProduct] = useState<LowStockProduct | null>(
    null,
  );
  const [reorderOpen, setReorderOpen] = useState(false);

  useEffect(() => {
    registerNavbarAction(
      "dashboard-alerts",
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
      </Button>,
    );
    return () => registerNavbarAction("dashboard-alerts", null);
  }, [registerNavbarAction, totalAlerts]);

  function openReorder(product: LowStockProduct) {
    setAlertsOpen(false);
    setReorderProduct(product);
    setReorderOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-7">
      {children}
      <AlertsSheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        lowStockProducts={lowStockProducts}
        overdueCustomers={overdueCustomers}
        overdueSuppliers={overdueSuppliers}
        customerBalances={customerBalances}
        supplierBalances={supplierBalances}
        onReorder={openReorder}
      />
      {reorderProduct ? (
        <RestockProductDialog
          key={reorderProduct.id}
          product={reorderProduct}
          suppliers={suppliers}
          today={today}
          open={reorderOpen}
          onOpenChange={setReorderOpen}
        />
      ) : null}
    </main>
  );
}
