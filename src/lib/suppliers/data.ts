import { ACTOR_ID, BUSINESS_ID } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  PartyRow,
  Role,
  SupplierTransactionRow,
} from "./types";

const PARTY_COLUMNS = "id, business_id, name, phone, type, address, created_at";
const TRANSACTION_COLUMNS =
  "id, business_id, type, party_id, amount, category, payment_method, " +
  "description, due_date, transaction_date, attachment_url, created_at";

function logQueryError(label: string, error: { message?: string }): void {
  if (process.env.NODE_ENV === "production") return;
  console.error(`[suppliers] ${label} Supabase error`, {
    message: error.message?.slice(0, 1000),
  });
}

export async function getSupplierParties(): Promise<PartyRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("parties")
    .select(PARTY_COLUMNS)
    .eq("business_id", BUSINESS_ID)
    .in("type", ["supplier", "both"])
    .order("name", { ascending: true });

  if (error) {
    logQueryError("getSupplierParties", error);
    throw new Error("Failed to load suppliers");
  }

  return (data ?? []) as unknown as PartyRow[];
}

export async function getSupplierTransactions(): Promise<SupplierTransactionRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("business_id", BUSINESS_ID)
    .in("type", ["supplier_purchase", "supplier_payment"])
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    logQueryError("getSupplierTransactions", error);
    throw new Error("Failed to load supplier transactions");
  }

  return (data ?? []) as unknown as SupplierTransactionRow[];
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
