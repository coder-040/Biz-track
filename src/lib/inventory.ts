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
