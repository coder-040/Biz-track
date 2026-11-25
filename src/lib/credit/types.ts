export const CUSTOMER_TYPES = ["customer", "both"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export type PartyType = CustomerType | "supplier";

export const CREDIT_SALE_TYPE = "customer_credit_sale" as const;
export const CUSTOMER_PAYMENT_TYPE = "customer_payment" as const;

export type CreditTransactionType =
  | typeof CREDIT_SALE_TYPE
  | typeof CUSTOMER_PAYMENT_TYPE;

export const PAYMENT_METHODS = ["cash", "bank", "qr", "online"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Party {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  type: PartyType;
  address: string | null;
  created_at: string | null;
}

export interface CreditTransaction {
  id: string;
  business_id: string;
  type: string;
  party_id: string | null;
  amount: number;
  category: string;
  payment_method: string | null;
  description: string | null;
  due_date: string | null;
  transaction_date: string;
  created_at: string | null;
}

export type SaleStatus = "paid" | "partial" | "unpaid" | "overdue";

export interface AllocatedSale extends CreditTransaction {
  type: typeof CREDIT_SALE_TYPE;
  outstanding: number;
  status: SaleStatus;
}

export interface LedgerEntry {
  id: string;
  kind: "credit_sale" | "payment";
  amount: number;
  category: string;
  payment_method: string | null;
  description: string | null;
  due_date: string | null;
  transaction_date: string;
  created_at: string | null;
  outstanding: number | null;
  status: SaleStatus | null;
}

export interface CustomerSummary {
  party: Party;
  totalCredit: number;
  totalPaid: number;
  balance: number;
  overdue: boolean;
  overdueAmount: number;
  overdueDueDate: string | null;
  nextDueDate: string | null;
  lastActivityDate: string | null;
  saleCount: number;
  paymentCount: number;
}

export interface CustomerAccount {
  party: Party;
  summary: CustomerSummary;
  sales: AllocatedSale[];
  payments: CreditTransaction[];
  ledger: LedgerEntry[];
}

export interface CreatePartyInput {
  name: string;
  phone: string | null;
  address: string | null;
  type: CustomerType;
}

export interface CreateCreditSaleInput {
  partyId: string;
  amount: number;
  category: string;
  dueDate: string;
  transactionDate: string;
  description: string | null;
}

export interface CreatePaymentInput {
  partyId: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  transactionDate: string;
}

export interface CreditTransactionInsert {
  type: CreditTransactionType;
  party_id: string;
  amount: number;
  category: string;
  payment_method: string;
  description: string | null;
  due_date: string | null;
  transaction_date: string;
}
