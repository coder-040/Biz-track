import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerAccount, SaleStatus } from "@/lib/credit/types";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
} from "@/lib/format";

interface LedgerProps {
  account: CustomerAccount;
}

const STATUS_LABELS: Record<SaleStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
  overdue: "Overdue",
};

function StatusBadge({ status }: { status: SaleStatus }) {
  if (status === "overdue") {
    return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>;
  }

  if (status === "paid") {
    return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>;
  }

  return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>;
}

export function Ledger({ account }: LedgerProps) {
  if (account.ledger.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
        <p className="text-sm font-medium">No transactions yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Record a credit sale or a payment to start this customer&apos;s
          ledger.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Entry</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead className="text-right">Outstanding</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {account.ledger.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatDate(entry.transaction_date)}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 whitespace-normal">
                <Badge
                  variant={entry.kind === "credit_sale" ? "outline" : "secondary"}
                  className="w-fit"
                >
                  {entry.kind === "credit_sale" ? "Credit sale" : "Payment"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {entry.description ?? "—"}
                </span>
              </div>
            </TableCell>
            <TableCell className="whitespace-normal">{entry.category}</TableCell>
            <TableCell>{formatPaymentMethod(entry.payment_method)}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(entry.amount)}
            </TableCell>
            <TableCell>
              {entry.kind === "credit_sale"
                ? formatDate(entry.due_date)
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              {entry.kind === "credit_sale" && entry.outstanding !== null
                ? formatCurrency(entry.outstanding)
                : "—"}
            </TableCell>
            <TableCell>
              {entry.kind === "credit_sale" && entry.status ? (
                <StatusBadge status={entry.status} />
              ) : (
                "—"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
