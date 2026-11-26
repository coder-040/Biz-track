export type StockMovementType =
  | "purchase"
  | "sale"
  | "damaged"
  | "lost"
  | "adjustment"

export interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  purchase_price: number
  selling_price: number
  current_stock: number
  min_stock: number
  supplier_id: string | null
  is_active: boolean
  created_at: string
}

export interface SupplierOption {
  id: string
  name: string
}

export interface StockMovement {
  id: string
  product_id: string
  transaction_id: string | null
  type: StockMovementType
  quantity: number
  unit_cost: number | null
  reason: string | null
  created_at: string
}

/**
 * Calculates updated stock level based on movement type and quantity.
 * - purchase: +quantity
 * - sale, damaged, lost: -quantity
 * - adjustment: +quantity (quantity can be positive or negative for adjustment)
 */
export function calculateNewStock(
  currentStock: number,
  type: StockMovementType,
  quantity: number
): number {
  switch (type) {
    case "purchase":
      return currentStock + Math.abs(quantity)
    case "sale":
    case "damaged":
    case "lost":
      return currentStock - Math.abs(quantity)
    case "adjustment":
      return currentStock + quantity
    default:
      return currentStock
  }
}

/**
 * Returns the signed stock change represented by a movement. Adjustment
 * movements store a positive quantity and encode direction in the reason
 * prefix written by the database function.
 */
export function movementDelta(
  type: StockMovementType,
  quantity: number,
  reason: string | null = null
): number {
  switch (type) {
    case "purchase":
      return Math.abs(quantity)
    case "sale":
    case "damaged":
    case "lost":
      return -Math.abs(quantity)
    case "adjustment":
      return reason?.startsWith("Decrease")
        ? -Math.abs(quantity)
        : Math.abs(quantity)
    default:
      return 0
  }
}

/**
 * Determines if a product has low stock.
 * A product is low stock if it is active and current_stock <= min_stock.
 */
export function isLowStock(
  currentStock: number,
  minStock: number,
  isActive: boolean = true
): boolean {
  if (!isActive) return false
  return currentStock <= minStock
}

/**
 * Calculates total inventory value for a product.
 */
export function calculateInventoryValue(
  currentStock: number,
  purchasePrice: number
): number {
  return Math.max(0, currentStock) * purchasePrice
}

/**
 * Calculates the retail value of the stock on hand for a product.
 */
export function calculateRetailValue(
  currentStock: number,
  sellingPrice: number
): number {
  return Math.max(0, currentStock) * sellingPrice
}

export type StockStatus = "in" | "low" | "out" | "archived"

/**
 * Resolves the display status for a product. Out-of-stock takes priority over
 * the reorder threshold so empty shelves are surfaced separately.
 */
export function getStockStatus(
  currentStock: number,
  minStock: number,
  isActive: boolean = true
): StockStatus {
  if (!isActive) return "archived"
  if (currentStock <= 0) return "out"
  if (currentStock <= minStock) return "low"
  return "in"
}

/**
 * Percentage of a two-times-minimum target currently on hand, clamped to
 * 0–100. Used for the compact stock-level bars.
 */
export function stockLevelPercent(
  currentStock: number,
  minStock: number
): number {
  const target = Math.max(minStock * 2, 1)
  const percent = (Math.max(0, currentStock) / target) * 100
  return Math.min(100, Math.max(0, Math.round(percent)))
}

/**
 * Gross margin on cost, as a percentage. Returns 100 when there is no cost
 * basis but a selling price exists.
 */
export function calculateMarginPercent(
  purchasePrice: number,
  sellingPrice: number
): number {
  if (purchasePrice <= 0) return sellingPrice > 0 ? 100 : 0
  return ((sellingPrice - purchasePrice) / purchasePrice) * 100
}
