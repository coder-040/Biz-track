import type { ReactNode } from "react";
import { AlertTriangleIcon, UsersIcon, WalletIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CustomerSummary } from "@/lib/credit/types";
import { formatCurrency } from "@/lib/format";

interface SummaryCardsProps {
  accounts: CustomerSummary[];
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ accounts }: SummaryCardsProps) {
  const totalOutstanding = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );
  const overdueAccounts = accounts.filter((account) => account.overdue);
  const totalOverdue = overdueAccounts.reduce(
    (total, account) => total + account.overdueAmount,
    0,
  );

  return (
    <section
      aria-label="Customer credit summary"
      className="grid gap-4 sm:grid-cols-3"
    >
      <StatCard
        label="Customers"
        value={String(accounts.length)}
        detail="Customers and customer/supplier parties."
        icon={<UsersIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Total outstanding"
        value={formatCurrency(totalOutstanding)}
        detail="Credit sales minus recorded payments."
        icon={<WalletIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Overdue"
        value={`${overdueAccounts.length} customer${overdueAccounts.length === 1 ? "" : "s"}`}
        detail={`${formatCurrency(totalOverdue)} past due.`}
        icon={<AlertTriangleIcon className="size-4" aria-hidden="true" />}
      />
    </section>
  );
}
