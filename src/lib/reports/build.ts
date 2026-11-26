import { buildCustomerAccount } from "@/lib/credit/calculations";
import type { CreditTransaction, Party } from "@/lib/credit/types";
import { BUSINESS_ID } from "@/lib/config";
import { movementDelta } from "@/lib/inventory";
import { cashFlowType } from "@/lib/transactions/accounting";
import type {
  ReportMovement,
  ReportParty,
  ReportProduct,
  ReportSources,
  ReportTransaction,
} from "./data";

export const REPORT_TYPES = [
  "daily-income-expense",
  "monthly-income-expense",
  "customer-outstanding",
  "supplier-payables",
  "inventory",
  "low-stock",
  "stock-movements",
  "payment-history",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type CellValue = string | number | boolean | null;
export type ReportFormat = "text" | "currency" | "quantity" | "date";

export interface ReportColumn {
  key: string;
  label: string;
  format: ReportFormat;
}

export interface ReportSummary {
  label: string;
  value: number;
  format: ReportFormat;
}

export interface ReportResult {
  title: string;
  description: string;
  columns: ReportColumn[];
  rows: Array<Record<string, CellValue>>;
  summaries: ReportSummary[];
}

export const REPORT_OPTIONS: Array<{ value: ReportType; label: string }> = [
  { value: "daily-income-expense", label: "Daily income & expense" },
  { value: "monthly-income-expense", label: "Monthly income & expense" },
  { value: "customer-outstanding", label: "Customer outstanding" },
  { value: "supplier-payables", label: "Supplier payable" },
  { value: "inventory", label: "Inventory" },
  { value: "low-stock", label: "Low stock" },
  { value: "stock-movements", label: "Stock movement" },
  { value: "payment-history", label: "Payment history" },
];

function amount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : 0;
}

function quantity(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? "";
}

function inDateRange(value: string | null | undefined, from: string, to: string): boolean {
  const date = dateOnly(value);
  return Boolean(date) && (!from || date >= from) && (!to || date <= to);
}

function nextDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function customerParty(row: ReportParty): Party | null {
  if (row.type !== "customer" && row.type !== "both") return null;
  return {
    id: row.id,
    business_id: BUSINESS_ID,
    name: row.name,
    phone: null,
    type: row.type,
    address: null,
    created_at: null,
  };
}

function creditTransaction(row: ReportTransaction): CreditTransaction {
  return {
    ...row,
    business_id: BUSINESS_ID,
    amount: amount(row.amount),
    created_at: row.created_at ?? null,
  };
}

function inventoryAt(
  product: ReportProduct,
  movements: ReportMovement[],
  asOfDate: string,
): number {
  const currentStock = quantity(product.current_stock);
  const changesAfterDate = movements.reduce((total, movement) => {
    if (
      movement.product_id !== product.id ||
      dateOnly(movement.created_at) <= asOfDate
    ) {
      return total;
    }

    return total + movementDelta(
      movement.type,
      quantity(movement.quantity),
      movement.reason,
    );
  }, 0);

  return Math.round((currentStock - changesAfterDate + Number.EPSILON) * 1000) / 1000;
}

function totals(
  rows: Array<Record<string, CellValue>>,
  keys: Array<{ key: string; label: string; format: ReportFormat }>,
): ReportSummary[] {
  return keys.map(({ key, label, format }) => ({
    label,
    value: rows.reduce((sum, row) => sum + amount(row[key]), 0),
    format,
  }));
}

function periodRows(
  transactions: ReportTransaction[],
  from: string,
  to: string,
  monthly: boolean,
): ReportResult {
  const buckets = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    if (!inDateRange(tx.transaction_date, from, to)) continue;

    const flowType = cashFlowType(tx.type, tx.payment_method);
    if (!flowType) continue;

    const date = dateOnly(tx.transaction_date);
    const key = monthly ? date.slice(0, 7) : date;
    const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
    if (flowType === "income") {
      bucket.income += amount(tx.amount);
    } else {
      bucket.expense += amount(tx.amount);
    }
    buckets.set(key, bucket);
  }

  const rows = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, bucket]) => ({
      period,
      income: Math.round(bucket.income * 100) / 100,
      expense: Math.round(bucket.expense * 100) / 100,
      net: Math.round((bucket.income - bucket.expense) * 100) / 100,
    }));

  const sums = totals(rows, [
    { key: "income", label: "Income", format: "currency" },
    { key: "expense", label: "Expenses", format: "currency" },
    { key: "net", label: "Net", format: "currency" },
  ]);

  return {
    title: monthly ? "Monthly income & expense" : "Daily income & expense",
    description:
      "Cash income and expenses are grouped by transaction date. Credit sales count when paid; unpaid supplier purchases are excluded.",
    columns: [
      { key: "period", label: monthly ? "Month" : "Date", format: "date" },
      { key: "income", label: "Income", format: "currency" },
      { key: "expense", label: "Expense", format: "currency" },
      { key: "net", label: "Net", format: "currency" },
    ],
    rows,
    summaries: sums,
  };
}

export function buildReport(
  sources: ReportSources,
  type: ReportType,
  from: string,
  to: string,
): ReportResult {
  const asOfDate = to || new Date().toISOString().slice(0, 10);
  const cutoffExclusive = nextDate(asOfDate);

  if (type === "daily-income-expense" || type === "monthly-income-expense") {
    return periodRows(
      sources.transactions,
      from,
      to,
      type === "monthly-income-expense",
    );
  }

  if (type === "customer-outstanding") {
    const eligibleTransactions = sources.transactions
      .filter((tx) => dateOnly(tx.transaction_date) <= asOfDate)
      .map(creditTransaction);
    const rows = sources.parties
      .map(customerParty)
      .filter((party): party is Party => party !== null)
      .map((party) => buildCustomerAccount(party, eligibleTransactions, cutoffExclusive).summary)
      .filter((summary) => summary.balance > 0)
      .map((summary) => ({
        party: summary.party.name,
        credit: summary.totalCredit,
        paid: summary.totalPaid,
        outstanding: summary.balance,
        overdue: summary.overdueAmount,
        due_date: summary.overdueDueDate ?? summary.nextDueDate,
      }));

    return {
      title: "Customer outstanding",
      description: `Outstanding balances as of ${asOfDate}. The start date does not apply to balance snapshots.`,
      columns: [
        { key: "party", label: "Customer", format: "text" },
        { key: "credit", label: "Credit sales", format: "currency" },
        { key: "paid", label: "Paid", format: "currency" },
        { key: "outstanding", label: "Outstanding", format: "currency" },
        { key: "overdue", label: "Past due", format: "currency" },
        { key: "due_date", label: "Due date", format: "date" },
      ],
      rows,
      summaries: totals(rows, [
        { key: "outstanding", label: "Total outstanding", format: "currency" },
        { key: "overdue", label: "Past due", format: "currency" },
      ]),
    };
  }

  if (type === "supplier-payables") {
    const transactions = sources.transactions.filter(
      (tx) => dateOnly(tx.transaction_date) <= asOfDate && tx.party_id,
    );
    const suppliers = sources.parties.filter(
      (party) => party.type === "supplier" || party.type === "both",
    );
    const rows = suppliers
      .map((party) => {
        const partyTransactions = transactions.filter((tx) => tx.party_id === party.id);
        const purchases = partyTransactions.filter(
          (tx) => tx.type === "supplier_purchase" && tx.payment_method === "credit",
        );
        const payable = Math.max(
          0,
          Math.round((
            purchases.reduce((sum, tx) => sum + amount(tx.amount), 0) -
            partyTransactions
              .filter((tx) => tx.type === "supplier_payment")
              .reduce((sum, tx) => sum + amount(tx.amount), 0) +
            Number.EPSILON
          ) * 100) / 100,
        );
        const overduePurchases = purchases.filter(
          (tx) => tx.due_date && tx.due_date < cutoffExclusive,
        );
        if (payable <= 0) return null;

        return {
          party: party.name,
          payable,
          overdue: overduePurchases.length > 0 ? payable : 0,
          due_date: overduePurchases
            .map((tx) => tx.due_date as string)
            .sort()[0] ?? null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => a.party.localeCompare(b.party));

    return {
      title: "Supplier payable",
      description: `Payables as of ${asOfDate}. The start date does not apply to balance snapshots.`,
      columns: [
        { key: "party", label: "Supplier", format: "text" },
        { key: "payable", label: "Payable", format: "currency" },
        { key: "overdue", label: "Overdue", format: "currency" },
        { key: "due_date", label: "Earliest past-due date", format: "date" },
      ],
      rows,
      summaries: totals(rows, [
        { key: "payable", label: "Total payable", format: "currency" },
        { key: "overdue", label: "Overdue payable", format: "currency" },
      ]),
    };
  }

  if (type === "inventory" || type === "low-stock") {
    const rows = sources.products
      .filter((product) => product.is_active && product.created_at.slice(0, 10) <= asOfDate)
      .map((product) => {
        const stock = inventoryAt(product, sources.movements, asOfDate);
        return {
          product: product.name,
          sku: product.sku,
          category: product.category,
          stock,
          minimum: quantity(product.min_stock),
          purchase_price: amount(product.purchase_price),
          value: Math.round((stock * amount(product.purchase_price) + Number.EPSILON) * 100) / 100,
        };
      })
      .filter((row) => type === "inventory" || row.stock <= row.minimum)
      .sort((a, b) => a.product.localeCompare(b.product));

    return {
      title: type === "inventory" ? "Inventory" : "Low stock",
      description: `Stock reconstructed from recorded movements as of ${asOfDate}. Product prices use the current catalogue price.`,
      columns: [
        { key: "product", label: "Product", format: "text" },
        { key: "sku", label: "SKU", format: "text" },
        { key: "category", label: "Category", format: "text" },
        { key: "stock", label: "Stock", format: "quantity" },
        { key: "minimum", label: "Minimum", format: "quantity" },
        { key: "purchase_price", label: "Purchase price", format: "currency" },
        { key: "value", label: "Inventory value", format: "currency" },
      ],
      rows,
      summaries: totals(rows, [
        { key: "stock", label: "Units in report", format: "quantity" },
        { key: "value", label: "Inventory value", format: "currency" },
      ]),
    };
  }

  if (type === "stock-movements") {
    const productNames = new Map(sources.products.map((product) => [product.id, product.name]));
    const rows = sources.movements
      .filter((movement) => inDateRange(movement.created_at, from, to))
      .map((movement) => ({
        date: dateOnly(movement.created_at),
        product: productNames.get(movement.product_id) ?? "Unknown product",
        type: movement.type,
        quantity: quantity(movement.quantity),
        unit_cost: amount(movement.unit_cost),
        reason: movement.reason,
        transaction_id: movement.transaction_id,
      }));

    return {
      title: "Stock movement",
      description: "Movement history filtered by movement creation date.",
      columns: [
        { key: "date", label: "Date", format: "date" },
        { key: "product", label: "Product", format: "text" },
        { key: "type", label: "Movement", format: "text" },
        { key: "quantity", label: "Quantity", format: "quantity" },
        { key: "unit_cost", label: "Unit cost", format: "currency" },
        { key: "reason", label: "Reason", format: "text" },
        { key: "transaction_id", label: "Transaction ID", format: "text" },
      ],
      rows,
      summaries: totals(rows, [
        { key: "quantity", label: "Total moved", format: "quantity" },
      ]),
    };
  }

  const partyNames = new Map(sources.parties.map((party) => [party.id, party.name]));
  const rows = sources.transactions
    .filter((tx) => inDateRange(tx.transaction_date, from, to))
    .filter((tx) => tx.payment_method !== "credit")
    .map((tx) => ({
      date: tx.transaction_date,
      party: tx.party_id ? partyNames.get(tx.party_id) ?? "Unknown party" : "—",
      type: tx.type,
      category: tx.category,
      method: tx.payment_method,
      amount: amount(tx.amount),
      description: tx.description,
    }));

  return {
    title: "Payment history",
    description: "Payments with a cash, bank, QR or online method, filtered by transaction date.",
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "party", label: "Party", format: "text" },
      { key: "type", label: "Type", format: "text" },
      { key: "category", label: "Category", format: "text" },
      { key: "method", label: "Method", format: "text" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "description", label: "Description", format: "text" },
    ],
    rows,
    summaries: totals(rows, [
      { key: "amount", label: "Total payments", format: "currency" },
    ]),
  };
}
