"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNPR } from "@/lib/format";
import type { WeeklyDay } from "@/lib/dashboard";

type WeeklyCashFlowProps = {
  weeklyFlow: WeeklyDay[];
};

export function WeeklyCashFlow({ weeklyFlow }: WeeklyCashFlowProps) {
  const [mode, setMode] = useState<"week" | "net">("week");

  const maxVal = Math.max(
    ...weeklyFlow.map((d) => Math.max(d.income, d.expense)),
    1
  );

  const totalIncome = weeklyFlow.reduce((s, d) => s + d.income, 0);
  const totalExpense = weeklyFlow.reduce((s, d) => s + d.expense, 0);
  const marginPct =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10
      : 0;

  return (
    <Card className="border-stone-200/80 shadow-xs rounded-2xl bg-white">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-stone-950">
                Weekly Cash Flow
              </CardTitle>
              <span className="text-xs font-medium text-stone-500">
                (आम्दानी र खर्च)
              </span>
            </div>
            <p className="text-xs font-medium text-stone-600 mt-0.5">
              7-day net margin:{" "}
              <span className="font-bold text-stone-900">
                {marginPct}%
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0C3B37] inline-block" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#E07A5F] inline-block" />
                Expenses
              </span>
            </div>

            <div className="inline-flex rounded-lg bg-[#F3EFE8] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("week")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  mode === "week"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setMode("net")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  mode === "net"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Totals
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {mode === "net" ? (
          <div className="grid grid-cols-3 gap-3 py-6">
            <div className="rounded-xl bg-[#F8F6F2] p-4 border border-stone-200/60">
              <p className="text-xs text-stone-500">7-Day Income</p>
              <p className="text-lg font-bold text-[#0C3B37] mt-1">
                {formatNPR(totalIncome)}
              </p>
            </div>
            <div className="rounded-xl bg-[#F8F6F2] p-4 border border-stone-200/60">
              <p className="text-xs text-stone-500">7-Day Expenses</p>
              <p className="text-lg font-bold text-[#E07A5F] mt-1">
                {formatNPR(totalExpense)}
              </p>
            </div>
            <div className="rounded-xl bg-[#F8F6F2] p-4 border border-stone-200/60">
              <p className="text-xs text-stone-500">7-Day Net</p>
              <p className="text-lg font-bold text-stone-900 mt-1">
                {formatNPR(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6">
            {weeklyFlow.map((day) => {
              const incHeight = Math.max(
                Math.round((day.income / maxVal) * 100),
                day.income > 0 ? 10 : 4
              );
              const expHeight = Math.max(
                Math.round((day.expense / maxVal) * 100),
                day.expense > 0 ? 10 : 4
              );

              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center h-full justify-end group"
                  title={`${day.label} (${day.date}): Income ${formatNPR(
                    day.income
                  )}, Expense ${formatNPR(day.expense)}`}
                >
                  {day.isToday && day.income > 0 && (
                    <span className="text-[10px] font-semibold text-stone-700 mb-1 whitespace-nowrap">
                      {day.income >= 1000
                        ? `Rs ${(day.income / 1000).toFixed(1)}k`
                        : formatNPR(day.income)}
                    </span>
                  )}
                  <div className="flex items-end gap-1 h-28 w-full justify-center">
                    <div
                      style={{ height: `${incHeight}%` }}
                      className={`w-3.5 sm:w-4 rounded-t-md transition-all ${
                        day.isToday
                          ? "bg-[#0C3B37]"
                          : "bg-[#9AAEB0] group-hover:bg-[#0C3B37]/80"
                      }`}
                    />
                    <div
                      style={{ height: `${expHeight}%` }}
                      className={`w-3.5 sm:w-4 rounded-t-md transition-all ${
                        day.isToday
                          ? "bg-[#E07A5F]"
                          : "bg-[#E9B5A7] group-hover:bg-[#E07A5F]/80"
                      }`}
                    />
                  </div>

                  <div className="mt-2.5 text-center">
                    <p
                      className={`text-xs font-medium ${
                        day.isToday ? "text-[#0C3B37] font-bold" : "text-stone-600"
                      }`}
                    >
                      {day.labelNp}
                    </p>
                    <p
                      className={`text-[10px] ${
                        day.isToday
                          ? "text-[#0C3B37] font-semibold"
                          : "text-stone-400"
                      }`}
                    >
                      {day.isToday ? "Today" : day.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
