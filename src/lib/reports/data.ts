import { requireBusinessPermission } from "@/lib/auth/server";

export interface ReportTransaction {
  id: string;
  type: string;
  party_id: string | null;
  amount: number | string;
  category: string;
  payment_method: string | null;
  description: string | null;
  due_date: string | null;
  transaction_date: string;
  created_at: string;
}

export interface ReportParty {
  id: string;
  name: string;
  type: string;
}

export interface ReportProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  purchase_price: number | string;
  current_stock: number | string;
  min_stock: number | string;
  is_active: boolean;
  created_at: string;
}

export interface ReportMovement {
  id: string;
  product_id: string;
  transaction_id: string | null;
  type: "purchase" | "sale" | "damaged" | "lost" | "adjustment";
  quantity: number | string;
  unit_cost: number | string | null;
  reason: string | null;
  created_at: string;
}

export interface ReportSources {
  businessId: string;
  transactions: ReportTransaction[];
  parties: ReportParty[];
  products: ReportProduct[];
  movements: ReportMovement[];
}

const PAGE_SIZE = 1000;

async function readAllPages<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await fetchPage(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error("Could not load report data.");

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    offset += PAGE_SIZE;
  }
}

export async function getReportSources(): Promise<ReportSources> {
  const { supabase, business } = await requireBusinessPermission("view_reports");
  const [transactions, parties, products, movements] = await Promise.all([
    readAllPages<ReportTransaction>(async (from, to) => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, type, party_id, amount, category, payment_method, description, due_date, transaction_date, created_at",
        )
        .eq("business_id", business.id)
        .order("transaction_date", { ascending: true })
        .range(from, to);
      return { data: data as ReportTransaction[] | null, error };
    }),
    readAllPages<ReportParty>(async (from, to) => {
      const { data, error } = await supabase
        .from("parties")
        .select("id, name, type")
        .eq("business_id", business.id)
        .order("name", { ascending: true })
        .range(from, to);
      return { data: data as ReportParty[] | null, error };
    }),
    readAllPages<ReportProduct>(async (from, to) => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, sku, category, purchase_price, current_stock, min_stock, is_active, created_at",
        )
        .eq("business_id", business.id)
        .order("name", { ascending: true })
        .range(from, to);
      return { data: data as ReportProduct[] | null, error };
    }),
    readAllPages<ReportMovement>(async (from, to) => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          "id, product_id, transaction_id, type, quantity, unit_cost, reason, created_at",
        )
        .eq("business_id", business.id)
        .order("created_at", { ascending: true })
        .range(from, to);
      return { data: data as ReportMovement[] | null, error };
    }),
  ]);

  return { businessId: business.id, transactions, parties, products, movements };
}
