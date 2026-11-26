import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Package } from "lucide-react";
import {
  DEMO_BUSINESS,
  DEMO_LABEL,
  demoActivity,
  demoStock,
  demoTotals,
  demoTransactions,
} from "@/components/landing/sample-data";
import { cn } from "@/lib/utils";

function ActivityChart({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-900">Money activity</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-sm bg-[#0C3B37]" />
            In
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-sm bg-[#E07A5F]" />
            Out
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-end gap-1.5">
        {demoActivity.map((day) => (
          <div key={day.day} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            <div className="flex h-full items-end justify-center gap-0.5">
              <div
                className="w-1.5 rounded-sm bg-[#0C3B37] sm:w-2"
                style={{ height: `${day.moneyIn}%` }}
              />
              <div
                className="w-1.5 rounded-sm bg-[#E07A5F] sm:w-2"
                style={{ height: `${day.moneyOut}%` }}
              />
            </div>
            <span className="text-center text-[10px] text-slate-400">{day.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}

function TransactionRow({
  item,
}: {
  item: (typeof demoTransactions)[number];
}) {
  const incoming = item.direction === "in";
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg",
          incoming ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-[#C45C45]",
        )}
      >
        {incoming ? (
          <ArrowDownRight className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-900">{item.name}</p>
        <p className="truncate text-[10px] text-slate-500">{item.detail}</p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "text-xs font-semibold tabular-nums",
            incoming ? "text-emerald-700" : "text-slate-800",
          )}
        >
          {item.amount}
        </p>
        <p className="text-[10px] text-slate-400">{item.when}</p>
      </div>
    </div>
  );
}

function AppFrame({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-36px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <figcaption className="sr-only">
        {label}. {DEMO_LABEL} for {DEMO_BUSINESS}.
      </figcaption>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0C3B37] px-3 py-2.5 text-white sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2 rounded-full bg-[#F4C44E]" aria-hidden="true" />
          <p className="truncate text-xs font-semibold">{DEMO_BUSINESS}</p>
        </div>
        <p className="shrink-0 text-[10px] font-medium text-emerald-100/80">
          Sample overview
        </p>
      </div>
      {children}
    </figure>
  );
}

const NAV = ["Overview", "Money", "Stock", "History"];

export function HeroPreview() {
  return (
    <AppFrame label="BizTrack dashboard preview" className="landing-fade-up [animation-delay:160ms]">
      <div className="grid bg-[#F4F7F6] sm:grid-cols-[7.5rem_1fr]">
        <div className="hidden border-r border-slate-200/80 bg-[#0C3B37] px-2.5 py-3 sm:block">
          <p className="px-2 text-[9px] font-semibold uppercase tracking-wider text-emerald-200/50">
            Ledger
          </p>
          <ul className="mt-2 space-y-1">
            {NAV.map((item, index) => (
              <li
                key={item}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-[11px] font-medium",
                  index === 0
                    ? "bg-white/12 text-white"
                    : "text-emerald-100/65",
                )}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Money in" value={demoTotals.moneyIn} hint="This month" />
            <Stat label="Money out" value={demoTotals.moneyOut} hint="This month" />
            <Stat label="Stock value" value={demoTotals.inventoryValue} hint="On hand" />
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-40 rounded-xl border border-slate-200/80 bg-white p-3">
              <ActivityChart />
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-1">
              <p className="pt-2 text-xs font-semibold text-slate-900">
                Recent transactions
              </p>
              <div className="divide-y divide-slate-100">
                {demoTransactions.slice(0, 3).map((item) => (
                  <TransactionRow key={`${item.name}-${item.when}-${item.amount}`} item={item} />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="text-xs font-semibold text-slate-900">Inventory summary</p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {demoStock.slice(0, 4).map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-slate-800">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.qty}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold",
                      item.tone === "low" ? "text-amber-700" : "text-emerald-700",
                    )}
                  >
                    {item.tone === "low" ? "Low" : "In stock"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

export function ShowcasePreview() {
  return (
    <AppFrame label="BizTrack product showcase">
      <div className="bg-[#F4F7F6] p-3 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Money in" value={demoTotals.moneyIn} hint="Recorded receipts" />
          <Stat label="Money out" value={demoTotals.moneyOut} hint="Recorded payments" />
          <Stat label="Net position" value={demoTotals.net} hint="In minus out" />
          <Stat label="Inventory value" value={demoTotals.inventoryValue} hint="Current stock" />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-52 rounded-xl border border-slate-200/80 bg-white p-4">
            <ActivityChart />
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-[#0C3B37]" aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-900">Inventory summary</p>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {demoStock.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.qty} on hand</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold tabular-nums text-slate-800">
                      {item.value}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-medium",
                        item.tone === "low" ? "text-amber-700" : "text-emerald-700",
                      )}
                    >
                      {item.tone === "low" ? "Running low" : "Available"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-slate-900">Recent transactions</p>
            <p className="text-[10px] text-slate-400">NPR · sample ledger</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 font-medium">Activity</th>
                  <th className="px-4 py-2 font-medium">Detail</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {demoTransactions.map((item) => (
                  <tr key={`${item.detail}-${item.amount}`} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{item.detail}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{item.when}</td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right text-xs font-semibold tabular-nums",
                        item.direction === "in" ? "text-emerald-700" : "text-slate-800",
                      )}
                    >
                      {item.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

export function BenefitsPreview() {
  return (
    <AppFrame label="BizTrack cash and stock preview">
      <div className="space-y-3 bg-[#F4F7F6] p-3 sm:p-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Cash position
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {demoTotals.net}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Money in {demoTotals.moneyIn} · Money out {demoTotals.moneyOut}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[70%] rounded-full bg-[#0C3B37]" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3">
          {demoTransactions.slice(0, 4).map((item) => (
            <TransactionRow key={`${item.detail}-${item.amount}`} item={item} />
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-medium text-amber-900">Black tea is running low</p>
          <p className="text-xs font-semibold text-amber-800">9 packs</p>
        </div>
      </div>
    </AppFrame>
  );
}
