import { BUSINESS_ID } from "@/lib/config"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  calculateInventoryValue,
  type Product,
  type ProductOption,
  type StockMovement,
  type SupplierOption,
} from "@/lib/inventory"

export interface InventoryOverview {
  activeProducts: Product[]
  archivedProducts: Product[]
  lowStockProducts: Product[]
  suppliers: SupplierOption[]
  totalInventoryValue: number
}

export async function getInventoryOverview(): Promise<InventoryOverview> {
  const supabase = createServerSupabaseClient()

  const [productsResult, suppliersResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("business_id", BUSINESS_ID)
      .order("created_at", { ascending: false }),
    supabase
      .from("parties")
      .select("id, name")
      .eq("business_id", BUSINESS_ID)
      .in("type", ["supplier", "both"])
      .order("name", { ascending: true }),
  ])

  if (productsResult.error) {
    throw new Error(`Could not load products: ${productsResult.error.message}`)
  }

  if (suppliersResult.error) {
    throw new Error(`Could not load suppliers: ${suppliersResult.error.message}`)
  }

  const products = (productsResult.data ?? []) as Product[]
  const activeProducts = products.filter((product) => product.is_active)
  const archivedProducts = products.filter((product) => !product.is_active)
  const lowStockProducts = activeProducts.filter(
    (product) => product.current_stock <= product.min_stock
  )
  const totalInventoryValue = activeProducts.reduce(
    (total, product) =>
      total + calculateInventoryValue(product.current_stock, product.purchase_price),
    0
  )

  return {
    activeProducts,
    archivedProducts,
    lowStockProducts,
    suppliers: (suppliersResult.data ?? []) as SupplierOption[],
    totalInventoryValue,
  }
}

export async function getActiveProducts(): Promise<ProductOption[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("business_id", BUSINESS_ID)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Could not load products: ${error.message}`)
  }

  return (data ?? []) as ProductOption[]
}

export async function getProduct(productId: string): Promise<Product | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", BUSINESS_ID)
    .eq("id", productId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load product: ${error.message}`)
  }

  return (data as Product | null) ?? null
}

export async function getStockMovements(
  productId: string
): Promise<StockMovement[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("business_id", BUSINESS_ID)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Could not load stock movements: ${error.message}`)
  }

  return (data ?? []) as StockMovement[]
}
