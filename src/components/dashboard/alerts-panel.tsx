"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertsSheet } from "@/components/dashboard/alerts-sheet";
import {
  Bell,
  Package,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { formatNPR, formatDate, relativeDue } from "@/lib/format";
import type {
  LowStockProduct,
  PartyBalance,
  Transaction,
} from "@/lib/dashboard";

type AlertsPanelProps = {
  lowStockProducts: LowStockProduct[];
  overdueCustomers: PartyBalance[];
  overdueSuppliers: PartyBalance[];
  customerBalances: PartyBalance[];
  supplierBalances: PartyBalance[];
  upcomingReminders: Transaction[];
  totalReceivables: number;
  inventoryValue: number;
};

export function AlertsPanel({
  lowStockProducts,
  overdueCustomers,
  overdueSuppliers,
  customerBalances,
  supplierBalances,
  upcomingReminders,
  totalReceivables,
  inventoryValue,
}: AlertsPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const totalAlerts =
    lowStockProducts.length + overdueCustomers.length + overdueSuppliers.length;

  const customerFollowUps =
    overdueCustomers.length > 0 ? overdueCustomers : customerBalances;
  const supplierFollowUps =
    overdueSuppliers.length > 0 ? overdueSuppliers : supplierBalances;

  return (
    <div className="space-y-4">
      <Card className="border-stone-200/80 shadow-xs rounded-2xl bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-stone-950 flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#0C3B37]" />
                Alerts &amp; Reminders
              </CardTitle>
              <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                ध्यान दिनुपर्ने कुराहरू
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`rounded-full text-[11px] font-semibold px-2.5 py-0.5 ${
                totalAlerts > 0
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {totalAlerts} {totalAlerts === 1 ? "action" : "actions"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* LOW STOCK ALERT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Low Stock Alert (Stockroom)
              </span>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="text-xs font-semibold text-[#0C3B37] hover:underline cursor-pointer"
              >
                Restock list
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs font-medium text-stone-600 rounded-xl bg-[#F8F6F2] px-3 py-2.5">
                All active products are above minimum stock.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 2).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 border ${
                      idx === 0
                        ? "bg-red-50/70 border-red-200/80"
                        : "bg-[#F8F6F2] border-stone-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-white border border-stone-200/70 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-stone-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {p.name}
                        </p>
                        <p
                          className={`text-[11px] truncate ${
                            idx === 0 ? "text-red-600" : "text-stone-500"
                          }`}
                        >
                          Only {p.current_stock} left (Min: {p.min_stock})
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={idx === 0 ? "default" : "outline"}
                      onClick={() => setSheetOpen(true)}
                      className={`h-7 px-2.5 text-[11px] rounded-lg shrink-0 cursor-pointer ${
                        idx === 0
                          ? "bg-[#0C3B37] hover:bg-[#092e2b] text-white"
                          : "border-stone-200 bg-white text-stone-700"
                      }`}
                    >
                      Reorder
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UDHARO KHATA FOLLOW-UP */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Udharo Khata Follow-up
              </span>
              <span className="text-[11px] text-stone-700 font-semibold">
                Pending {formatNPR(totalReceivables)}
              </span>
            </div>

            {customerFollowUps.length === 0 ? (
              <p className="text-xs font-medium text-stone-600 rounded-xl bg-[#F8F6F2] px-3 py-2.5">
                No pending customer receivables.
              </p>
            ) : (
              <div className="space-y-2">
                {customerFollowUps.slice(0, 2).map((c) => {
                  const isOverdue = overdueCustomers.some(
                    (o) => o.party_id === c.party_id
                  );
                  return (
                    <div
                      key={c.party_id}
                      onClick={() => setSheetOpen(true)}
                      className="flex items-center justify-between gap-2 rounded-xl bg-[#FBF8F3] border border-amber-200/70 px-3 py-2.5 cursor-pointer hover:bg-amber-50/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {c.party_name}
                          </p>
                          {c.due_date && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                isOverdue
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {relativeDue(c.due_date)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-red-600 mt-1">
                          {formatNPR(c.balance)}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-stone-600 border border-stone-200 bg-white px-2.5 py-1 rounded-lg shrink-0">
                        Details
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DISTRIBUTOR PAYMENT DUE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Distributor Payment Due (तिर्न बाँकी)
              </span>
            </div>

            {supplierFollowUps.length === 0 && upcomingReminders.length === 0 ? (
              <p className="text-xs font-medium text-stone-600 rounded-xl bg-[#F8F6F2] px-3 py-2.5">
                No upcoming supplier dues.
              </p>
            ) : supplierFollowUps.length > 0 ? (
              <div className="space-y-2">
                {supplierFollowUps.slice(0, 1).map((s) => (
                  <div
                    key={s.party_id}
                    className="rounded-xl bg-[#F8F6F2] border border-stone-200/80 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-stone-900">
                          {s.party_name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {s.due_date
                            ? `Due ${formatDate(s.due_date)}`
                            : "Outstanding supplier balance"}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-stone-900">
                        {formatNPR(s.balance)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                        <CalendarClock className="h-3 w-3" />
                        {s.due_date ? relativeDue(s.due_date) : "Pending"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setSheetOpen(true)}
                        className="h-7 px-3 text-[11px] bg-[#F4C44E] hover:bg-[#e5b53f] text-[#0C3B37] font-semibold rounded-lg cursor-pointer"
                      >
                        View All Dues
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.slice(0, 1).map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-xl bg-[#F8F6F2] border border-stone-200/80 p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-stone-900">
                        {Array.isArray(tx.parties)
                          ? tx.parties[0]?.name
                          : tx.parties?.name ?? tx.description ?? tx.category}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {tx.due_date ? relativeDue(tx.due_date) : "Upcoming"} ·{" "}
                        {formatDate(tx.due_date)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-stone-900">
                      {formatNPR(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Inventory & NRB Reminder Card */}
      <div className="rounded-2xl bg-[#EFECE5] border border-stone-200/70 p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-[#0C3B37] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-900">
            Inventory Value: {formatNPR(inventoryValue)}
          </p>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            Ensure all QR transactions above Rs 25,000 are verified with
            customer PAN in the transaction notes.
          </p>
        </div>
      </div>

      <AlertsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lowStockProducts={lowStockProducts}
        overdueCustomers={overdueCustomers}
        overdueSuppliers={overdueSuppliers}
        customerBalances={customerBalances}
        supplierBalances={supplierBalances}
      />
    </div>
  );
}
