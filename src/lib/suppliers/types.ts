export const PARTY_TYPES = ["customer", "supplier", "both"] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export const SUPPLIER_TYPES = ["supplier", "both"] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const SUPPLIER_PAYMENT_METHODS = ["cash", "bank", "qr", "online"] as const;
export type SupplierPaymentMethod = (typeof SUPPLIER_PAYMENT_METHODS)[number];

export const CREDIT_PAYMENT_METHOD = "credit" as const;

export type SupplierTransactionType = "supplier_purchase" | "supplier_payment";
export type Role = "owner" | "staff";

export interface PartyRow {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  type: string;
  address: string | null;
  created_at: string;
}

export interface SupplierTransactionRow {
  id: string;
  business_id: string;
  supplier_order_id: string | null;
  type: string;
  party_id: string | null;
  amount: number;
  category: string;
  payment_method: string | null;
  description: string | null;
  due_date: string | null;
  transaction_date: string;
  attachment_url: string | null;
  created_at: string;
}

export interface SupplierSummary {
  party: PartyRow;
  payable: number;
  overdue: boolean;
  earliestDueDate: string | null;
}

export interface SupplierFormState {
  name: string;
  phone: string;
  address: string;
  type: SupplierType;
}

export type EntryKind = "purchase" | "payment";

export interface EntryFormState {
  kind: EntryKind;
  partyId: string;
  orderId: string;
  amount: string;
  category: string;
  paymentMethod: SupplierPaymentMethod | "credit";
  transactionDate: string;
  dueDate: string;
  description: string;
  attachmentUrl: string;
}
