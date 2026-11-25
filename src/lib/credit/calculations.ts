import { isISODate } from "@/lib/credit/date";
import {
  CREDIT_SALE_TYPE,
  CUSTOMER_PAYMENT_TYPE,
  CUSTOMER_TYPES,
  PAYMENT_METHODS,
  type AllocatedSale,
  type CreditTransaction,
  type CustomerAccount,
  type CustomerSummary,
  type CustomerType,
  type LedgerEntry,
  type Party,
  type PaymentMethod,
  type SaleStatus,
} from "@/lib/credit/types";

const TWO_DECIMALS = 100;
const OVERPAYMENT_TOLERANCE = 0.005;
const MAX_AMOUNT = 9_999_999_999.99;
const NO_DUE_DATE_SORT = "9999-12-31";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * TWO_DECIMALS) / TWO_DECIMALS;
}

export function toAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? round2(value) : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? round2(parsed) : 0;
  }

  return 0;
}

export function isCustomerType(value: string): value is CustomerType {
  return (CUSTOMER_TYPES as readonly string[]).includes(value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isCustomerParty(party: Pick<Party, "type">): boolean {
  return party.type === "customer" || party.type === "both";
}

export function parseAmountInput(value: string): number | null {
  const normalized = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (amount > MAX_AMOUNT) return null;

  return round2(amount);
}

export function isOverpayment(amount: number, balance: number): boolean {
  return round2(amount) > round2(balance) + OVERPAYMENT_TOLERANCE;
}

function compareSales(a: CreditTransaction, b: CreditTransaction): number {
  const aDue = a.due_date || NO_DUE_DATE_SORT;
  const bDue = b.due_date || NO_DUE_DATE_SORT;

  if (aDue !== bDue) return aDue < bDue ? -1 : 1;

  if (a.transaction_date !== b.transaction_date) {
    return a.transaction_date < b.transaction_date ? -1 : 1;
  }

  const aCreated = a.created_at ?? "";
  const bCreated = b.created_at ?? "";
  if (aCreated !== bCreated) return aCreated < bCreated ? -1 : 1;

  return a.id.localeCompare(b.id);
}

function saleStatus(
  outstanding: number,
  applied: number,
  dueDate: string | null,
  today: string,
): SaleStatus {
  if (outstanding <= 0) return "paid";
  if (dueDate && dueDate < today) return "overdue";
  if (applied > 0) return "partial";
  return "unpaid";
}

function earliest(dates: Array<string | null>): string | null {
  let earliestDate: string | null = null;

  for (const date of dates) {
    if (!date) continue;
    if (earliestDate === null || date < earliestDate) earliestDate = date;
  }

  return earliestDate;
}

function latest(dates: Array<string | null>): string | null {
  let latestDate: string | null = null;

  for (const date of dates) {
    if (!date) continue;
    if (latestDate === null || date > latestDate) latestDate = date;
  }

  return latestDate;
}

function allocateSales(
  sales: CreditTransaction[],
  payments: CreditTransaction[],
  today: string,
): AllocatedSale[] {
  let remainingPayments = round2(
    payments.reduce((total, payment) => total + toAmount(payment.amount), 0),
  );

  return sales.map((sale) => {
    const amount = toAmount(sale.amount);
    const applied = Math.min(remainingPayments, amount);
    remainingPayments = round2(remainingPayments - applied);

    const outstanding = round2(amount - applied);

    return {
      ...sale,
      type: CREDIT_SALE_TYPE,
      amount,
      outstanding,
      status: saleStatus(outstanding, applied, sale.due_date, today),
    };
  });
}

function buildLedger(
  sales: AllocatedSale[],
  payments: CreditTransaction[],
): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    ...sales.map((sale) => ({
      id: sale.id,
      kind: "credit_sale" as const,
      amount: sale.amount,
      category: sale.category,
      payment_method: sale.payment_method,
      description: sale.description,
      due_date: sale.due_date,
      transaction_date: sale.transaction_date,
      created_at: sale.created_at,
      outstanding: sale.outstanding,
      status: sale.status,
    })),
    ...payments.map((payment) => ({
      id: payment.id,
      kind: "payment" as const,
      amount: toAmount(payment.amount),
      category: payment.category,
      payment_method: payment.payment_method,
      description: payment.description,
      due_date: payment.due_date,
      transaction_date: payment.transaction_date,
      created_at: payment.created_at,
      outstanding: null,
      status: null,
    })),
  ];

  return entries.sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date < b.transaction_date ? 1 : -1;
    }

    const aCreated = a.created_at ?? "";
    const bCreated = b.created_at ?? "";
    if (aCreated !== bCreated) return aCreated < bCreated ? 1 : -1;

    return b.id.localeCompare(a.id);
  });
}

export function buildCustomerAccount(
  party: Party,
  transactions: CreditTransaction[],
  today: string,
): CustomerAccount {
  const sales = transactions
    .filter(
      (transaction) =>
        transaction.party_id === party.id &&
        transaction.type === CREDIT_SALE_TYPE,
    )
    .map((transaction) => ({
      ...transaction,
      amount: toAmount(transaction.amount),
    }))
    .sort(compareSales);

  const payments = transactions
    .filter(
      (transaction) =>
        transaction.party_id === party.id &&
        transaction.type === CUSTOMER_PAYMENT_TYPE,
    )
    .map((transaction) => ({
      ...transaction,
      amount: toAmount(transaction.amount),
    }));

  const totalCredit = round2(
    sales.reduce((total, sale) => total + sale.amount, 0),
  );
  const totalPaid = round2(
    payments.reduce((total, payment) => total + payment.amount, 0),
  );
  const balance = Math.max(0, round2(totalCredit - totalPaid));

  const allocatedSales = allocateSales(sales, payments, today);
  const overdueSales = allocatedSales.filter(
    (sale) => sale.status === "overdue",
  );
  const overdueAmount = round2(
    overdueSales.reduce((total, sale) => total + sale.outstanding, 0),
  );

  const summary: CustomerSummary = {
    party,
    totalCredit,
    totalPaid,
    balance,
    overdue: overdueSales.length > 0,
    overdueAmount,
    overdueDueDate: earliest(overdueSales.map((sale) => sale.due_date)),
    nextDueDate: earliest(
      allocatedSales
        .filter(
          (sale) =>
            sale.outstanding > 0 &&
            sale.due_date !== null &&
            sale.due_date >= today,
        )
        .map((sale) => sale.due_date),
    ),
    lastActivityDate: latest(
      [...sales, ...payments].map((transaction) => transaction.transaction_date),
    ),
    saleCount: sales.length,
    paymentCount: payments.length,
  };

  return {
    party,
    summary,
    sales: allocatedSales,
    payments,
    ledger: buildLedger(allocatedSales, payments),
  };
}

export function sortCustomerSummaries(
  summaries: CustomerSummary[],
): CustomerSummary[] {
  return [...summaries].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;

    if (a.overdue && b.overdue) {
      const aDue = a.overdueDueDate ?? "";
      const bDue = b.overdueDueDate ?? "";
      if (aDue !== bDue) return aDue < bDue ? -1 : 1;
    }

    if (a.balance !== b.balance) return b.balance - a.balance;

    return a.party.name.localeCompare(b.party.name);
  });
}

export function validatePartyInput(input: {
  name: string;
  type: string;
}): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!input.name.trim()) {
    fieldErrors.name = "Customer name is required.";
  }

  if (!isCustomerType(input.type)) {
    fieldErrors.type = "Choose customer or customer & supplier.";
  }

  return fieldErrors;
}

export function validateCreditSaleInput(input: {
  amount: number | null;
  category: string;
  dueDate: string;
  transactionDate: string;
  today: string;
}): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (input.amount === null) {
    fieldErrors.amount = "Enter an amount greater than zero with at most 2 decimals.";
  }

  if (!input.category.trim()) {
    fieldErrors.category = "Category is required.";
  }

  if (!isISODate(input.transactionDate)) {
    fieldErrors.transaction_date = "Enter a valid transaction date.";
  } else if (input.transactionDate > input.today) {
    fieldErrors.transaction_date = "Transaction date cannot be in the future.";
  }

  if (!isISODate(input.dueDate)) {
    fieldErrors.due_date = "Enter a valid due date.";
  } else if (
    isISODate(input.transactionDate) &&
    input.dueDate < input.transactionDate
  ) {
    fieldErrors.due_date = "Due date cannot be before the transaction date.";
  }

  return fieldErrors;
}

export function validatePaymentInput(input: {
  amount: number | null;
  category: string;
  paymentMethod: string;
  transactionDate: string;
  today: string;
}): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (input.amount === null) {
    fieldErrors.amount = "Enter an amount greater than zero with at most 2 decimals.";
  }

  if (!input.category.trim()) {
    fieldErrors.category = "Category is required.";
  }

  if (!isPaymentMethod(input.paymentMethod)) {
    fieldErrors.payment_method = "Choose a valid payment method.";
  }

  if (!isISODate(input.transactionDate)) {
    fieldErrors.transaction_date = "Enter a valid transaction date.";
  } else if (input.transactionDate > input.today) {
    fieldErrors.transaction_date = "Transaction date cannot be in the future.";
  }

  return fieldErrors;
}
