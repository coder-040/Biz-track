import { Suspense } from "react";
import { getDashboardData } from "@/lib/dashboard";
import { formatNPR, formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { WeeklyCashFlow } from "@/components/dashboard/weekly-cash-flow";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { QuickAddTransactionDialog } from "@/components/transactions/quick-add-transaction-dialog";
import { ProductSaleDialog } from "@/components/sales/product-sale-dialog";
import {
  ArrowDown,
  ArrowUp,
  Wallet,
  Building2,
  Users,
  Truck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
  Smartphone,
  CreditCard,
  Banknote,
} from "lucide-react";

function getPaymentBadge(method: string) {
  switch (method) {
    case "credit":
      return {
        label: "Credit",
        icon: CreditCard,
        cls: "bg-amber-50 text-amber-700 border-amber-200/80",
      };
    case "qr":
      return {
        label: "QR / Fonepay",
        icon: Smartphone,
        cls: "bg-red-50 text-red-700 border-red-200/80",
      };
    case "bank":
      return {
        label: "Bank",
        icon: Building2,
        cls: "bg-blue-50 text-blue-700 border-blue-200/80",
      };
    case "online":
      return {
        label: "Online",
        icon: CreditCard,
        cls: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      };
    default:
      return {
        label: "Cash",
        icon: Banknote,
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
  }
}

async function DashboardContent() {
  let data;
  let error: string | null = null;

  try {
    data = await getDashboardData();
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to load dashboard data.";
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (error || !data) {
    return (
      <main className="flex min-h-[calc(100vh-3.75rem)] w-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border-stone-200">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Error Loading Dashboard
            </CardTitle>
            <CardDescription>
              {error ?? "Could not connect to the database."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-500">
              Check your Supabase environment variables in <code>.env</code> and
              ensure the database tables exist.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const totalAlerts =
    data.lowStockCount + data.overdueCustomerCount + data.overdueSupplierCount;

  return (
    <DashboardShell
      totalAlerts={totalAlerts}
      lowStockProducts={data.lowStockProducts}
      overdueCustomers={data.overdueCustomers}
      overdueSuppliers={data.overdueSuppliers}
      suppliers={data.suppliers}
      today={data.today}
      customerBalances={data.customerBalances}
      supplierBalances={data.supplierBalances}
    >
      <div className="space-y-6">
        {/* ── Greeting & Status Bar ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-950">
              नमस्ते Owner ji{" "}
              <span className="text-sm font-medium text-stone-600">
                (Good day)
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-stone-600 mt-0.5">
              Here&apos;s what your shop looks like today · {todayLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200/80 px-3 py-1 text-[11px] font-semibold text-stone-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              SHOP STATUS: OPEN
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200/80 px-3 py-1 text-[11px] text-stone-600 shadow-2xs">
              <RefreshCw className="h-3 w-3 text-stone-400" />
              Live Supabase sync
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200/80 px-3 py-1 text-[11px] font-medium text-stone-700 shadow-2xs">
              <FileText className="h-3 w-3 text-stone-500" />
              Daily Sheet
            </span>
          </div>
        </div>

        {/* ── Main 2-Column Dashboard Grid ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Column (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Hero Balance Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E433E] via-[#0C3B37] to-[#082B28] text-white p-6 shadow-md">
              {/* Decorative watermark icon */}
              <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-10">
                <Wallet className="h-40 w-40" />
              </div>

              <div className="relative z-10 space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/80">
                    Total Money You Hold • नगद र बैंक खाता
                  </p>
                  <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                      {formatNPR(data.totalBalance)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/12 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                      Cash + Bank/Online
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-white/10 border border-white/10 px-3.5 py-2.5">
                      <Wallet className="h-4 w-4 text-emerald-200 shrink-0" />
                      <div>
                        <p className="text-[10px] text-emerald-200/75">
                          Cash in Hand
                        </p>
                        <p className="text-sm font-bold text-white">
                          {formatNPR(data.cashBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl bg-white/10 border border-white/10 px-3.5 py-2.5">
                      <Building2 className="h-4 w-4 text-emerald-200 shrink-0" />
                      <div>
                        <p className="text-[10px] text-emerald-200/75">
                          Bank, QR &amp; Online
                        </p>
                        <p className="text-sm font-bold text-white">
                          {formatNPR(data.bankOnlineBalance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ProductSaleDialog
                      products={data.saleProducts}
                      customers={data.saleCustomers}
                      today={data.today}
                    />
                    <QuickAddTransactionDialog />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Today's Income */}
              <Card className="rounded-2xl border-stone-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-stone-700">
                      Today&apos;s Income
                    </p>
                    <span className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-stone-950 mt-2">
                    {formatNPR(data.todayIncome)}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1.5 font-semibold">
                    {data.todayIncomeCount}{" "}
                    {data.todayIncomeCount === 1 ? "income entry" : "income entries"} recorded
                  </p>
                </CardContent>
              </Card>

              {/* Today's Expenses */}
              <Card className="rounded-2xl border-stone-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-stone-700">
                      Today&apos;s Expenses
                    </p>
                    <span className="h-6 w-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-stone-950 mt-2">
                    {formatNPR(data.todayExpense)}
                  </p>
                  <p className="text-[11px] font-medium text-stone-600 mt-1.5">
                    Daily operational spend
                  </p>
                </CardContent>
              </Card>

              {/* Customer Dues */}
              <Card className="rounded-2xl border-stone-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <p className="text-xs font-semibold text-stone-700">
                        Customer Dues
                      </p>
                      <p className="text-[10px] font-medium text-stone-500">
                        Udharo लिन बाँकी
                      </p>
                    </div>
                    <span className="h-6 w-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-amber-700 mt-1.5">
                    {formatNPR(data.totalReceivables)}
                  </p>
                  <p className="text-[11px] font-medium text-stone-600 mt-1.5">
                    {data.customerBalances.length}{" "}
                    {data.customerBalances.length === 1
                      ? "customer"
                      : "customers"}
                    {data.overdueCustomerCount > 0 && (
                      <span className="text-red-600 font-semibold">
                        {" "}
                        · {data.overdueCustomerCount} overdue
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Supplier Dues */}
              <Card className="rounded-2xl border-stone-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <p className="text-xs font-semibold text-stone-700">
                        Supplier Dues
                      </p>
                      <p className="text-[10px] font-medium text-stone-500">
                        Tirna Baaki तिर्न बाँकी
                      </p>
                    </div>
                    <span className="h-6 w-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Truck className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-stone-950 mt-1.5">
                    {formatNPR(data.totalPayables)}
                  </p>
                  {data.overdueSupplierCount > 0 ? (
                    <p className="text-[11px] text-red-700 font-semibold mt-1.5 bg-red-50 rounded-md px-1.5 py-0.5 inline-block">
                      {data.overdueSupplierCount} overdue
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-stone-600 mt-1.5">
                      {data.supplierBalances.length}{" "}
                      {data.supplierBalances.length === 1
                        ? "supplier"
                        : "suppliers"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Cash Flow Chart */}
            <WeeklyCashFlow weeklyFlow={data.weeklyFlow} />

            {/* Recent Transactions Table */}
            <Card className="rounded-2xl border-stone-200/80 bg-white shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-stone-900">
                      Recent Transactions
                    </CardTitle>
                    <span className="text-xs text-stone-400">
                      (भर्खरका कारोबारहरू)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#0C3B37] inline-flex items-center gap-1">
                    Latest 5
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                {data.recentTransactions.length === 0 ? (
                  <p className="text-sm text-stone-400 py-8 text-center">
                    No transactions recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                          <th className="py-2.5 pr-3">Date</th>
                          <th className="py-2.5 pr-3">Party / Description</th>
                          <th className="py-2.5 pr-3">Type / Mode</th>
                          <th className="py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {data.recentTransactions.map((tx) => {
                          const badge = getPaymentBadge(tx.payment_method);
                          const BadgeIcon = badge.icon;
                          const partyName = Array.isArray(tx.parties)
                            ? tx.parties[0]?.name
                            : tx.parties?.name;
                          const isCustomerCredit =
                            tx.type === "customer_credit_sale";
                          const isUnpaidSupplierPurchase =
                            tx.type === "supplier_purchase" &&
                            tx.payment_method === "credit";
                          const isPositive =
                            tx.type === "income" ||
                            tx.type === "customer_payment";
                          const isUnpaidCredit =
                            isCustomerCredit || isUnpaidSupplierPurchase;

                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-[#F8F6F2]/60 transition-colors"
                            >
                              <td className="py-3 pr-3 text-xs font-medium text-stone-600 whitespace-nowrap">
                                {formatDate(tx.transaction_date)}
                              </td>
                              <td className="py-3 pr-3 min-w-[160px]">
                                <p className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                                  {partyName ?? tx.category}
                                </p>
                                {tx.description && (
                                  <p className="text-[11px] font-medium text-stone-500 truncate max-w-xs">
                                    {tx.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 pr-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}
                                >
                                  <BadgeIcon className="h-3 w-3" />
                                  {badge.label}
                                </span>
                              </td>
                              <td
                                className={`py-3 text-right text-xs sm:text-sm font-bold whitespace-nowrap ${
                                  isPositive
                                    ? "text-emerald-700"
                                    : isUnpaidCredit
                                      ? "text-amber-700"
                                    : "text-red-600"
                                }`}
                              >
                                {isCustomerCredit
                                  ? "Due "
                                  : isUnpaidSupplierPurchase
                                    ? "Payable "
                                    : isPositive
                                      ? "+"
                                      : "-"}
                                {formatNPR(tx.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4">
            <AlertsPanel
              lowStockProducts={data.lowStockProducts}
              overdueCustomers={data.overdueCustomers}
              overdueSuppliers={data.overdueSuppliers}
              customerBalances={data.customerBalances}
              supplierBalances={data.supplierBalances}
              upcomingReminders={data.upcomingReminders}
              totalReceivables={data.totalReceivables}
              inventoryValue={data.inventoryValue}
              suppliers={data.suppliers}
              today={data.today}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
