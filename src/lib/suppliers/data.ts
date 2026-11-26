import { ACTOR_ID, BUSINESS_ID } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  PartyRow,
  Role,
  SupplierTransactionRow,
} from "./types";
import type {
  SupplierOrderPaymentRecord,
  SupplierOrderRecord,
} from "./orders";

const PARTY_COLUMNS = "id, business_id, name, phone, type, address, created_at";
const TRANSACTION_COLUMNS =
  "id, business_id, supplier_order_id, type, party_id, amount, category, payment_method, " +
  "description, due_date, transaction_date, attachment_url, created_at";
const SUPPLIER_ORDER_COLUMNS =
  "id, business_id, supplier_id, product_id, quantity, items, category, total_amount, order_date, " +
  "due_date, status, attachment_url, received_at, created_at";
const SUPPLIER_ORDER_PAYMENT_COLUMNS =
  "id, business_id, order_id, supplier_id, amount, payment_method, " +
  "payment_date, transaction_id, created_at";

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

export async function getSupplierOrderData(): Promise<{
  orders: SupplierOrderRecord[];
  payments: SupplierOrderPaymentRecord[];
}> {
  const supabase = createServerSupabaseClient();
  const [ordersResult, paymentsResult] = await Promise.all([
    supabase
      .from("supplier_orders")
      .select(SUPPLIER_ORDER_COLUMNS)
      .eq("business_id", BUSINESS_ID)
      .order("order_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("supplier_order_payments")
      .select(SUPPLIER_ORDER_PAYMENT_COLUMNS)
      .eq("business_id", BUSINESS_ID)
      .order("payment_date", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const queryError = ordersResult.error ?? paymentsResult.error;
  if (queryError) {
    logQueryError("getSupplierOrderData", queryError);
    throw new Error("Failed to load supplier orders and payments");
  }

  return {
    orders: (ordersResult.data ?? []) as unknown as SupplierOrderRecord[],
    payments: (paymentsResult.data ?? []) as unknown as SupplierOrderPaymentRecord[],
  };
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
