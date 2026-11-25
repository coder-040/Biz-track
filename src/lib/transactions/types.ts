export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ["cash", "bank", "qr", "online"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Role = "owner" | "staff";
export type AuditAction = "insert" | "update" | "delete";

export interface TransactionRow {
  id: string;
  business_id: string;
  type: string;
  amount: number;
  category: string;
  payment_method: string | null;
  description: string | null;
  transaction_date: string;
  attachment_url: string | null;
  created_at: string;
  party_id: string | null;
  due_date: string | null;
}

export interface TransactionFilters {
  from: string | null;
  to: string | null;
  category: string | null;
  method: PaymentMethod | null;
  page: number;
}

export interface Totals {
  today: string;
  todayIncome: number;
  todayExpense: number;
  cash: number;
  bankOnline: number;
}

export interface AuditEntry {
  businessId: string;
  entityType: "transaction";
  entityId: string;
  action: AuditAction;
  actorId: string;
  actorName: string | null;
  changes: {
    before: unknown | null;
    after: unknown | null;
  };
}
