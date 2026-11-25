"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Package, Users, Truck } from "lucide-react";
import { formatNPR, formatDate, relativeDue } from "@/lib/format";
import type { LowStockProduct, PartyBalance } from "@/lib/dashboard";

type AlertsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lowStockProducts: LowStockProduct[];
  overdueCustomers: PartyBalance[];
  overdueSuppliers: PartyBalance[];
  customerBalances?: PartyBalance[];
  supplierBalances?: PartyBalance[];
};

export function AlertsSheet({
  open,
  onOpenChange,
  lowStockProducts,
  overdueCustomers,
  overdueSuppliers,
  customerBalances = [],
  supplierBalances = [],
}: AlertsSheetProps) {
  const totalAlerts =
    lowStockProducts.length + overdueCustomers.length + overdueSuppliers.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-[#F8F6F2]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-stone-900">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alert Centre
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="ml-1">
                {totalAlerts}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Low Stock Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-orange-500" />
              <h3 className="font-semibold text-sm text-stone-900">
                Low Stock
                <span className="ml-2 text-stone-500 font-normal">
                  ({lowStockProducts.length}{" "}
                  {lowStockProducts.length === 1 ? "item" : "items"})
                </span>
              </h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-stone-500 pl-6">
                No low-stock products.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-orange-200 bg-white px-3.5 py-2.5 text-sm shadow-2xs"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">
                        Stock: {p.current_stock} / Min: {p.min_stock}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-orange-600 border-orange-300 bg-orange-50"
                    >
                      {p.current_stock === 0 ? "Out of stock" : "Low"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Overdue Customers Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold text-sm text-stone-900">
                Overdue Receivables
                <span className="ml-2 text-stone-500 font-normal">
                  ({overdueCustomers.length}{" "}
                  {overdueCustomers.length === 1 ? "customer" : "customers"})
                </span>
              </h3>
            </div>
            {overdueCustomers.length === 0 ? (
              <p className="text-sm text-stone-500 pl-6">
                No overdue customer balances.
              </p>
            ) : (
              <div className="space-y-2">
                {overdueCustomers.map((c) => (
                  <div
                    key={c.party_id}
                    className="flex items-center justify-between rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm shadow-2xs"
                  >
                    <div>
                      <p className="font-medium text-stone-900">
                        {c.party_name}
                      </p>
                      <p className="text-xs text-stone-500">
                        Due: {formatDate(c.due_date)} ·{" "}
                        {c.due_date && (
                          <span className="text-red-600 font-medium">
                            {relativeDue(c.due_date)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatNPR(c.overdue_amount ?? c.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Overdue Suppliers Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-sm text-stone-900">
                Overdue Payables
                <span className="ml-2 text-stone-500 font-normal">
                  ({overdueSuppliers.length}{" "}
                  {overdueSuppliers.length === 1 ? "supplier" : "suppliers"})
                </span>
              </h3>
            </div>
            {overdueSuppliers.length === 0 ? (
              <p className="text-sm text-stone-500 pl-6">
                No overdue supplier balances.
              </p>
            ) : (
              <div className="space-y-2">
                {overdueSuppliers.map((s) => (
                  <div
                    key={s.party_id}
                    className="flex items-center justify-between rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 text-sm shadow-2xs"
                  >
                    <div>
                      <p className="font-medium text-stone-900">
                        {s.party_name}
                      </p>
                      <p className="text-xs text-stone-500">
                        Due: {formatDate(s.due_date)} ·{" "}
                        {s.due_date && (
                          <span className="text-purple-600 font-medium">
                            {relativeDue(s.due_date)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-semibold text-purple-700">
                      {formatNPR(s.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* All Per-Party Balances */}
          {(customerBalances.length > 0 || supplierBalances.length > 0) && (
            <>
              <Separator />
              <section className="space-y-4">
                <h3 className="font-semibold text-sm text-stone-900">
                  All Outstanding Balances (Per Party)
                </h3>

                {customerBalances.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                      Customer Receivables ({customerBalances.length})
                    </p>
                    {customerBalances.map((c) => (
                      <div
                        key={c.party_id}
                        className="flex items-center justify-between rounded-lg bg-white border border-stone-200/80 px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-stone-800">
                          {c.party_name}
                        </span>
                        <span className="font-semibold text-amber-700">
                          {formatNPR(c.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {supplierBalances.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                      Supplier Payables ({supplierBalances.length})
                    </p>
                    {supplierBalances.map((s) => (
                      <div
                        key={s.party_id}
                        className="flex items-center justify-between rounded-lg bg-white border border-stone-200/80 px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-stone-800">
                          {s.party_name}
                        </span>
                        <span className="font-semibold text-stone-900">
                          {formatNPR(s.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
