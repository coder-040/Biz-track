import { ACTOR_ID, BUSINESS_ID } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/transactions/date";
import type {
  Role,
  Totals,
  TransactionFilters,
  TransactionRow,
} from "@/lib/transactions/types";

const TRANSACTION_COLUMNS = [
  "id",
  "business_id",
  "type",
  "amount",
  "category",
  "payment_method",
  "description",
  "transaction_date",
  "attachment_url",
  "created_at",
  "party_id",
  "due_date",
].join(", ");

const ALLOWED_TYPES = ["income", "expense"] as const;

interface TotalsRow {
  type: string;
  amount: number;
  payment_method: string | null;
  transaction_date: string;
}

interface QueryError {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

function logQueryError(label: string, error: QueryError): void {
  if (process.env.NODE_ENV === "production") return;

  console.error(`[transactions] ${label} Supabase error`, {
    message: error.message?.slice(0, 1000),
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export async function getTransactions(
  filters: TransactionFilters,
): Promise<TransactionRow[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("business_id", BUSINESS_ID)
    .in("type", [...ALLOWED_TYPES]);

  if (filters.from) query = query.gte("transaction_date", filters.from);
  if (filters.to) query = query.lte("transaction_date", filters.to);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.method) query = query.eq("payment_method", filters.method);

  const { data, error } = await query.order("transaction_date", {
    ascending: false,
  }).order("created_at", { ascending: false });

  if (error) {
    logQueryError("getTransactions", error);
    throw new Error("Failed to load transactions");
  }
  return (data ?? []) as unknown as TransactionRow[];
}

export async function getTotals(): Promise<Totals> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, payment_method, transaction_date")
    .eq("business_id", BUSINESS_ID)
    .in("type", [...ALLOWED_TYPES]);

  if (error) {
    logQueryError("getTotals", error);
    throw new Error("Failed to load totals");
  }

  const rows = (data ?? []) as TotalsRow[];
  const today = todayISO();

  const totals: Totals = {
    today,
    todayIncome: 0,
    todayExpense: 0,
    cash: 0,
    bankOnline: 0,
  };

  for (const row of rows) {
    const amount = Number(row.amount) || 0;
    const isIncome = row.type === "income";

    if (row.transaction_date === today) {
      if (isIncome) totals.todayIncome += amount;
      else totals.todayExpense += amount;
    }

    const signedAmount = isIncome ? amount : -amount;

    if (row.payment_method === "cash") {
      totals.cash += signedAmount;
    } else if (
      row.payment_method === "bank" ||
      row.payment_method === "qr" ||
      row.payment_method === "online"
    ) {
      totals.bankOnline += signedAmount;
    }
  }

  return totals;
}

export async function getRole(): Promise<Role> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", BUSINESS_ID)
    .eq("actor_id", ACTOR_ID)
    .maybeSingle();

  if (error) {
    logQueryError("getRole", error);
    throw new Error("Failed to load role");
  }
  return data?.role === "owner" ? "owner" : "staff";
}
