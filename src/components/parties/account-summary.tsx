import { AlertTriangle, CircleCheck, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CustomerAccount } from "@/lib/credit/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface AccountSummaryProps {
  account: CustomerAccount;
}

export function AccountSummary({ account }: AccountSummaryProps) {
  const { summary } = account;
  const settled = summary.balance === 0;

  return (
    <section aria-label="Customer balance" className="space-y-4">
      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total credit sales</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">
              {formatCurrency(summary.totalCredit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total paid</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">
              {formatCurrency(summary.totalPaid)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wallet className="size-4" aria-hidden="true" />
              Outstanding balance
            </p>
            <p
              className={
                summary.overdue
                  ? "mt-1 text-2xl font-semibold tracking-tight text-destructive"
                  : "mt-1 text-2xl font-semibold tracking-tight"
              }
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </CardContent>
      </Card>

      {summary.overdue ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-destructive">
              {formatCurrency(summary.overdueAmount)} is past due
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Earliest overdue due date: {formatDate(summary.overdueDueDate)}.
              Payments are applied to the earliest due sales first.
            </p>
          </div>
        </div>
      ) : settled ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <CircleCheck className="size-4" aria-hidden="true" />
          Settled — this customer has no outstanding balance.
        </div>
      ) : summary.nextDueDate ? (
        <p className="text-sm text-muted-foreground">
          Next due date: {formatDate(summary.nextDueDate)}.
        </p>
      ) : null}
    </section>
  );
}
