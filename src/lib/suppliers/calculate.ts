import { isISODate, todayISO } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import {
  CREDIT_PAYMENT_METHOD,
  SUPPLIER_PAYMENT_METHODS,
  SUPPLIER_TYPES,
  type EntryFormState,
  type PartyRow,
  type SupplierFormState,
  type SupplierSummary,
  type SupplierTransactionRow,
} from "./types";

const PURCHASE = "supplier_purchase";
const PAYMENT = "supplier_payment";

function toAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isSupplierParty(party: { type: string }): boolean {
  return party.type === "supplier" || party.type === "both";
}

/**
 * Payable(party) = SUM(credit supplier purchases) - SUM(supplier payments).
 * `excludeId` lets a payment edit be checked against the balance that will
 * exist once that row has been saved, rather than double-counting it.
 */
export function payableFor(
  partyId: string,
  transactions: SupplierTransactionRow[],
  excludeId?: string,
): number {
  let total = 0;

  for (const tx of transactions) {
    if (tx.id === excludeId || tx.party_id !== partyId) continue;

    if (tx.type === PURCHASE && tx.payment_method === CREDIT_PAYMENT_METHOD) {
      total += toAmount(tx.amount);
    } else if (tx.type === PAYMENT) {
      total -= toAmount(tx.amount);
    }
  }

  return round2(total);
}

/** Earliest past-due date among this party's credit purchases. */
export function earliestPastDueDate(
  partyId: string,
  transactions: SupplierTransactionRow[],
  today: string,
): string | null {
  let earliest: string | null = null;

  for (const tx of transactions) {
    if (
      tx.party_id !== partyId ||
      tx.type !== PURCHASE ||
      tx.payment_method !== CREDIT_PAYMENT_METHOD ||
      !tx.due_date ||
      tx.due_date >= today
    ) {
      continue;
    }

    if (earliest === null || tx.due_date < earliest) {
      earliest = tx.due_date;
    }
  }

  return earliest;
}

export function buildSummaries(
  parties: PartyRow[],
  transactions: SupplierTransactionRow[],
  today: string = todayISO(),
): SupplierSummary[] {
  return parties.filter(isSupplierParty).map((party) => {
    const payable = payableFor(party.id, transactions);
    const earliestDueDate = earliestPastDueDate(party.id, transactions, today);

    return {
      party,
      payable,
      overdue: payable > 0 && earliestDueDate !== null,
      earliestDueDate,
    };
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateAmountInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter an amount.";
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return "Amount must have at most 2 decimal places.";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Amount must be greater than zero.";
  }
  if (amount > 9_999_999_999.99) {
    return "Amount is too large for this ledger.";
  }
  return null;
}

export function validateSupplierForm(form: SupplierFormState): string | null {
  if (!form.name.trim()) return "Supplier name is required.";
  if (!SUPPLIER_TYPES.some((type) => type === form.type)) {
    return "Supplier type must be supplier or both.";
  }
  return null;
}

export function createSupplierOrderPaymentForm(
  partyId: string,
  orderId: string,
  transactionDate: string = todayISO(),
): EntryFormState {
  return {
    kind: "payment",
    partyId,
    orderId,
    amount: "",
    category: "Supplier payment",
    paymentMethod: "cash",
    transactionDate,
    dueDate: "",
    description: "",
    attachmentUrl: "",
  };
}

export function validateEntryForm(
  form: EntryFormState,
  parties: PartyRow[],
  transactions: SupplierTransactionRow[],
  editingId: string | null,
): string | null {
  if (form.kind !== "purchase" && form.kind !== "payment") {
    return "Choose a purchase or a payment.";
  }

  const party = parties.find((candidate) => candidate.id === form.partyId);
  if (!party || !isSupplierParty(party)) {
    return "Choose a supplier (type supplier or both).";
  }

  const amountError = validateAmountInput(form.amount);
  if (amountError) return amountError;

  if (!form.category.trim()) return "Category is required.";

  if (!isISODate(form.transactionDate)) {
    return "Enter a valid transaction date.";
  }
  if (form.transactionDate > todayISO()) {
    return "Future transaction dates are not allowed.";
  }

  if (form.attachmentUrl.trim() && !isHttpUrl(form.attachmentUrl.trim())) {
    return "Attachment must be a valid http(s) URL.";
  }

  if (form.kind === "purchase") {
    if (form.paymentMethod !== CREDIT_PAYMENT_METHOD) {
      return "Purchases must use the credit payment method.";
    }
    if (!isISODate(form.dueDate)) return "Enter a valid due date.";
    return null;
  }

  if (!SUPPLIER_PAYMENT_METHODS.some((method) => method === form.paymentMethod)) {
    return "Choose a valid payment method (cash, bank, qr or online).";
  }

  const payable = payableFor(party.id, transactions, editingId ?? undefined);
  if (Number(form.amount) > payable) {
    return `Payment exceeds the outstanding payable (${formatCurrency(payable)}).`;
  }

  return null;
}
