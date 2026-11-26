import Link from "next/link";
import { UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerSummary } from "@/lib/credit/types";
import { CustomerListActions } from "@/components/parties/customer-list-actions";
import { formatCurrency, formatDate } from "@/lib/format";

interface CustomersTableProps {
  accounts: CustomerSummary[];
  today: string;
}

function typeLabel(type: CustomerSummary["party"]["type"]): string {
  return type === "both" ? "Customer & supplier" : "Customer";
}

export function CustomersTable({ accounts, today }: CustomersTableProps) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-12 text-center">
        <UsersIcon className="size-7 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">No customers yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first customer to start tracking credit sales (Udharo).
          </p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const { party } = account;

          return (
            <TableRow key={party.id}>
              <TableCell>
                <div className="flex flex-col gap-1 whitespace-normal">
                  <Link
                    href={`/parties/${party.id}`}
                    className="font-medium hover:underline"
                  >
                    {party.name}
                  </Link>
                  <Badge variant="outline" className="w-fit">
                    {typeLabel(party.type)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col whitespace-normal text-sm">
                  <span>{party.phone ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {party.address ?? "No address"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell>
                {account.overdue ? (
                  <div className="flex flex-col items-start gap-1 whitespace-normal">
                    <Badge variant="destructive">Overdue</Badge>
                    <span className="text-xs text-destructive">
                      {formatCurrency(account.overdueAmount)} past due
                    </span>
                  </div>
                ) : account.balance > 0 ? (
                  <Badge variant="outline">Outstanding</Badge>
                ) : (
                  <Badge variant="secondary">Settled</Badge>
                )}
              </TableCell>
              <TableCell>
                {account.overdue
                  ? formatDate(account.overdueDueDate)
                  : formatDate(account.nextDueDate)}
              </TableCell>
              <TableCell className="text-right">
                <CustomerListActions account={account} today={today} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
