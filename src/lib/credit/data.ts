import { requireBusinessPermission } from "@/lib/auth/server";
import {
  buildCustomerAccount,
  isCustomerParty,
  round2,
  sortCustomerSummaries,
  toAmount,
} from "@/lib/credit/calculations";
import {
  CREDIT_SALE_TYPE,
  CUSTOMER_PAYMENT_TYPE,
  type CreateCreditSaleInput,
  type CreatePartyInput,
  type CreatePaymentInput,
  type CreditTransaction,
  type CreditTransactionInsert,
  type CustomerAccount,
  type CustomerSummary,
  type Party,
  type PartyType,
} from "@/lib/credit/types";

const PARTY_COLUMNS = "id, business_id, name, phone, type, address, created_at";
const TRANSACTION_COLUMNS =
  "id, business_id, type, party_id, amount, category, payment_method, description, due_date, transaction_date, created_at";

interface PartyRow {
  id: string;
  business_id: string | null;
  name: string;
  phone: string | null;
  type: string;
  address: string | null;
  created_at: string | null;
}

interface TransactionRow {
  id: string;
  business_id: string | null;
  type: string;
  party_id: string | null;
  amount: number | string;
  category: string;
  payment_method: string | null;
  description: string | null;
  due_date: string | null;
  transaction_date: string;
  created_at: string | null;
}

interface QueryError {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

function logQueryError(label: string, error: QueryError): void {
  if (process.env.NODE_ENV === "production") return;

  console.error(`[credit] ${label} Supabase error`, {
    message: error.message?.slice(0, 1000),
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function normalizeParty(
  row: PartyRow,
  fallbackBusinessId: string,
): Party | null {
  if (row.type !== "customer" && row.type !== "supplier" && row.type !== "both") {
    return null;
  }

  return {
    id: row.id,
    business_id: row.business_id || fallbackBusinessId,
    name: row.name,
    phone: row.phone ?? null,
    type: row.type as PartyType,
    address: row.address ?? null,
    created_at: row.created_at ?? null,
  };
}

function normalizeTransaction(
  row: TransactionRow,
  fallbackBusinessId: string,
): CreditTransaction {
  return {
    id: row.id,
    business_id: row.business_id || fallbackBusinessId,
    type: row.type,
    party_id: row.party_id ?? null,
    amount: toAmount(row.amount),
    category: row.category ?? "",
    payment_method: row.payment_method ?? null,
    description: row.description ?? null,
    due_date: row.due_date || null,
    transaction_date: row.transaction_date,
    created_at: row.created_at ?? null,
  };
}

export async function getCustomerAccounts(
  today: string,
): Promise<CustomerSummary[]> {
  const { supabase, business } = await requireBusinessPermission("view_finances");
  const [partiesResult, transactionsResult] = await Promise.all([
    supabase
      .from("parties")
      .select(PARTY_COLUMNS)
      .eq("business_id", business.id)
      .in("type", ["customer", "both"])
      .order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .eq("business_id", business.id)
      .in("type", [CREDIT_SALE_TYPE, CUSTOMER_PAYMENT_TYPE])
      .order("transaction_date", { ascending: true }),
  ]);

  if (partiesResult.error) {
    logQueryError("getCustomerAccounts.parties", partiesResult.error);
    throw new Error("Could not load customers.");
  }

  if (transactionsResult.error) {
    logQueryError(
      "getCustomerAccounts.transactions",
      transactionsResult.error,
    );
    throw new Error("Could not load customer credit transactions.");
  }

  const parties = ((partiesResult.data ?? []) as unknown as PartyRow[])
    .map((row) => normalizeParty(row, business.id))
    .filter((party): party is Party => party !== null);

  const transactions = (
    (transactionsResult.data ?? []) as unknown as TransactionRow[]
  ).map((row) => normalizeTransaction(row, business.id));

  return sortCustomerSummaries(
    parties.map(
      (party) => buildCustomerAccount(party, transactions, today).summary,
    ),
  );
}

export async function getCustomerAccount(
  id: string,
  today: string,
): Promise<CustomerAccount | null> {
  const { supabase, business } = await requireBusinessPermission("view_finances");
  const [partyResult, transactionsResult] = await Promise.all([
    supabase
      .from("parties")
      .select(PARTY_COLUMNS)
      .eq("business_id", business.id)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .eq("business_id", business.id)
      .eq("party_id", id)
      .in("type", [CREDIT_SALE_TYPE, CUSTOMER_PAYMENT_TYPE])
      .order("transaction_date", { ascending: true }),
  ]);

  if (partyResult.error) {
    logQueryError("getCustomerAccount.party", partyResult.error);
    throw new Error("Could not load the customer.");
  }

  if (transactionsResult.error) {
    logQueryError(
      "getCustomerAccount.transactions",
      transactionsResult.error,
    );
    throw new Error("Could not load the customer ledger.");
  }

  if (!partyResult.data) return null;

  const party = normalizeParty(
    partyResult.data as unknown as PartyRow,
    business.id,
  );

  if (!party || !isCustomerParty(party)) return null;

  const transactions = (
    (transactionsResult.data ?? []) as unknown as TransactionRow[]
  ).map((row) => normalizeTransaction(row, business.id));

  return buildCustomerAccount(party, transactions, today);
}

export async function createCustomer(
  input: CreatePartyInput,
): Promise<Party> {
  const { supabase, business } = await requireBusinessPermission("manage_finances");
  const { data, error } = await supabase
    .from("parties")
    .insert({
      business_id: business.id,
      name: input.name,
      phone: input.phone,
      type: input.type,
      address: input.address,
    })
    .select(PARTY_COLUMNS)
    .single();

  if (error) {
    logQueryError("createCustomer", error);
    if (
      error.code === "23505" &&
      error.message.includes("parties_business_name_phone_unique")
    ) {
      throw new Error(
        "A customer or supplier with this name and phone number already exists.",
      );
    }
    throw new Error("Could not save the customer.");
  }

  const party = normalizeParty(data as unknown as PartyRow, business.id);

  if (!party) {
    throw new Error("The customer was saved but could not be read back.");
  }

  return party;
}

async function insertTransaction(
  input: CreditTransactionInsert,
): Promise<CreditTransaction> {
  const { supabase, business } = await requireBusinessPermission("manage_finances");
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      business_id: business.id,
      ...input,
    })
    .select(TRANSACTION_COLUMNS)
    .single();

  if (error) {
    logQueryError("insertTransaction", error);
    throw new Error("Could not save the transaction.");
  }

  return normalizeTransaction(data as unknown as TransactionRow, business.id);
}

export async function createCreditSale(
  input: CreateCreditSaleInput,
): Promise<CreditTransaction> {
  return insertTransaction({
    type: CREDIT_SALE_TYPE,
    party_id: input.partyId,
    amount: round2(input.amount),
    category: input.category,
    payment_method: "credit",
    description: input.description,
    due_date: input.dueDate,
    transaction_date: input.transactionDate,
  });
}

export async function createCustomerPayment(
  input: CreatePaymentInput,
): Promise<CreditTransaction> {
  return insertTransaction({
    type: CUSTOMER_PAYMENT_TYPE,
    party_id: input.partyId,
    amount: round2(input.amount),
    category: input.category,
    payment_method: input.paymentMethod,
    description: null,
    due_date: null,
    transaction_date: input.transactionDate,
  });
}
