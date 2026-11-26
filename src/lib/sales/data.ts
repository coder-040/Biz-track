import { BUSINESS_ID } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ProductSaleProduct {
  id: string;
  name: string;
  sku: string | null;
  current_stock: number;
  purchase_price: number;
  selling_price: number;
}

export interface SaleCustomer {
  id: string;
  name: string;
}

export async function getProductSaleOptions(): Promise<{
  products: ProductSaleProduct[];
  customers: SaleCustomer[];
}> {
  const supabase = createServerSupabaseClient();
  const [productsResult, customersResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, sku, current_stock, purchase_price, selling_price")
      .eq("business_id", BUSINESS_ID)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("parties")
      .select("id, name")
      .eq("business_id", BUSINESS_ID)
      .in("type", ["customer", "both"])
      .order("name", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`Could not load products for sale: ${productsResult.error.message}`);
  }
  if (customersResult.error) {
    throw new Error(`Could not load customers for sale: ${customersResult.error.message}`);
  }

  return {
    products: (productsResult.data ?? []).map((product) => ({
      ...product,
      current_stock: Number(product.current_stock),
      purchase_price: Number(product.purchase_price),
      selling_price: Number(product.selling_price),
    })),
    customers: customersResult.data ?? [],
  };
}
