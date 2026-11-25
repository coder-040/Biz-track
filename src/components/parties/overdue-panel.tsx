import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerSummary } from "@/lib/credit/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface OverduePanelProps {
  accounts: CustomerSummary[];
}

export function OverduePanel({ accounts }: OverduePanelProps) {
  if (accounts.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon
            className="size-4 text-destructive"
            aria-hidden="true"
          />
          Overdue customers
        </CardTitle>
        <CardDescription>
          Credit sales whose due date has passed and that are not fully paid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/70">
          {accounts.map((account) => (
            <li
              key={account.party.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/parties/${account.party.id}`}
                  className="font-medium hover:underline"
                >
                  {account.party.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(account.overdueDueDate)}
                  {account.party.phone ? ` · ${account.party.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-destructive">
                  {formatCurrency(account.overdueAmount)} past due
                </span>
                <Badge variant="destructive">Overdue</Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
