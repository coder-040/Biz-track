"use server"

import { revalidatePath } from "next/cache"

import type { ActionState } from "@/lib/action-state"
import { ACTOR_ID, ACTOR_NAME, BUSINESS_ID } from "@/lib/config"
import type { StockMovementType } from "@/lib/inventory"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const STOCK_MOVEMENT_TYPES: StockMovementType[] = [
  "purchase",
  "sale",
  "damaged",
  "lost",
  "adjustment",
]

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim()
}

function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key)
  return value === "" ? null : value
}

function numberValue(formData: FormData, key: string): number {
  return Number(text(formData, key))
}

function fail(message: string): ActionState {
  return { status: "error", message }
}

async function writeInventoryAudit(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  entityId: string,
  action: "insert" | "update",
  changes: { before: unknown | null; after: unknown | null },
): Promise<string | null> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      business_id: BUSINESS_ID,
      entity_type: "product",
      entity_id: entityId,
      action,
      actor_id: ACTOR_ID,
      actor_name: ACTOR_NAME,
      changes,
    })

    return error ? `Audit logging failed: ${error.message}` : null
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    return `Audit logging failed: ${message}`
  }
}

function databaseMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "That SKU is already used by another product."
  }

  if (
    error.code === "PGRST202" ||
    error.message.includes("record_stock_movement")
  ) {
    return "The stock movement database function is missing. Run the latest supabase/schema.sql in the Supabase SQL editor, then try again."
  }

  return error.message
}

export async function createProduct(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = text(formData, "name")
  const sku = optionalText(formData, "sku")
  const category = optionalText(formData, "category")
  const supplierValue = optionalText(formData, "supplier_id")
  const supplierId = supplierValue === "none" ? null : supplierValue
  const purchasePrice = numberValue(formData, "purchase_price")
  const sellingPrice = numberValue(formData, "selling_price")
  const currentStock = numberValue(formData, "current_stock")
  const minStock = numberValue(formData, "min_stock")
  const numericInputs = ["purchase_price", "selling_price", "current_stock", "min_stock"]
  const invalidPrecision = numericInputs.some((key) => {
    const value = text(formData, key)
    return value !== "" && !/^\d+(\.\d{1,2})?$/.test(value)
  })

  if (!name) {
    return fail("Product name is required.")
  }

  if (
    !Number.isFinite(purchasePrice) ||
    !Number.isFinite(sellingPrice) ||
    !Number.isFinite(currentStock) ||
    !Number.isFinite(minStock)
  ) {
    return fail("Prices and stock values must be valid numbers.")
  }

  if (invalidPrecision) {
    return fail("Prices and stock values must have at most 2 decimal places.")
  }

  if (
    purchasePrice < 0 ||
    sellingPrice < 0 ||
    currentStock < 0 ||
    minStock < 0
  ) {
    return fail("Prices and stock values cannot be negative.")
  }

  if ([purchasePrice, sellingPrice, currentStock, minStock].some((value) => value > 9999999999.99)) {
    return fail("Prices and stock values exceed the database limit.")
  }

  if (supplierId && !UUID_PATTERN.test(supplierId)) {
    return fail("Select a valid supplier.")
  }

  try {
    const supabase = createServerSupabaseClient()
    if (supplierId) {
      const { data: supplier, error: supplierError } = await supabase
        .from("parties")
        .select("id")
        .eq("business_id", BUSINESS_ID)
        .eq("id", supplierId)
        .in("type", ["supplier", "both"])
        .maybeSingle()

      if (supplierError) return fail("Could not verify the selected supplier.")
      if (!supplier) return fail("Select a supplier in this business.")
    }

    const { data: created, error } = await supabase
      .from("products")
      .insert({
        business_id: BUSINESS_ID,
        name,
        sku,
        category,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        current_stock: currentStock,
        min_stock: minStock,
        supplier_id: supplierId,
        is_active: true,
      })
      .select("*")
      .single()

    if (error) {
      return fail(databaseMessage(error))
    }

    const auditWarning = await writeInventoryAudit(
      supabase,
      created.id,
      "insert",
      { before: null, after: created },
    )
    revalidatePath("/inventory")
    return {
      status: "success",
      message: `${name} was added to inventory.${auditWarning ? ` ${auditWarning}` : ""}`,
    }
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Could not create the product."
    )
  }
}

export async function recordStockMovement(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = text(formData, "product_id")
  const type = text(formData, "type") as StockMovementType
  const quantity = numberValue(formData, "quantity")
  const unitCost = numberValue(formData, "unit_cost")
  const reason = optionalText(formData, "reason")
  const transactionId = optionalText(formData, "transaction_id")
  const adjustmentDirection = text(formData, "adjustment_direction") || "increase"

  if (!UUID_PATTERN.test(productId)) {
    return fail("Select a valid product.")
  }

  if (!STOCK_MOVEMENT_TYPES.includes(type)) {
    return fail("Select a valid stock movement type.")
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return fail("Quantity must be greater than zero.")
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(text(formData, "quantity")) ||
    !/^\d*(\.\d{1,2})?$/.test(text(formData, "unit_cost") || "0")
  ) {
    return fail("Quantity and unit cost must have at most 2 decimal places.")
  }

  if (!Number.isFinite(unitCost) || unitCost < 0 || unitCost > 9999999999.99) {
    return fail("Unit cost must be zero or greater.")
  }

  if (
    ["damaged", "lost", "adjustment"].includes(type) &&
    !reason
  ) {
    return fail(`A reason is required for ${type} movements.`)
  }

  if (
    type === "adjustment" &&
    !["increase", "decrease"].includes(adjustmentDirection)
  ) {
    return fail("Choose whether the adjustment increases or decreases stock.")
  }

  if (transactionId && !UUID_PATTERN.test(transactionId)) {
    return fail("Related transaction ID must be a valid UUID.")
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.rpc("record_stock_movement", {
      p_business_id: BUSINESS_ID,
      p_product_id: productId,
      p_type: type,
      p_quantity: quantity,
      p_unit_cost: unitCost || 0,
      p_reason: reason,
      p_transaction_id: transactionId,
      p_adjustment_direction: adjustmentDirection,
      p_actor_id: ACTOR_ID,
      p_actor_name: ACTOR_NAME,
    })

    if (error) {
      return fail(databaseMessage(error))
    }

    revalidatePath("/inventory")
    revalidatePath(`/inventory/${productId}`)
    return {
      status: "success",
      message: `${type[0].toUpperCase()}${type.slice(1)} recorded. Stock updated.`,
    }
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Could not record the movement."
    )
  }
}

async function setProductActive(
  productId: string,
  isActive: boolean
): Promise<ActionState> {
  if (!UUID_PATTERN.test(productId)) {
    return fail("Select a valid product.")
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: before, error: readError } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", BUSINESS_ID)
      .eq("id", productId)
      .maybeSingle()

    if (readError) return fail(databaseMessage(readError))
    if (!before) return fail("Product not found.")

    const { data: after, error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("business_id", BUSINESS_ID)
      .eq("id", productId)
      .select("*")
      .single()

    if (error) {
      return fail(databaseMessage(error))
    }

    const auditWarning = await writeInventoryAudit(
      supabase,
      productId,
      "update",
      { before, after },
    )

    revalidatePath("/inventory")
    revalidatePath(`/inventory/${productId}`)
    return {
      status: "success",
      message: `${isActive
        ? "Product restored to active inventory."
        : "Product archived. Its history is still available."}${auditWarning ? ` ${auditWarning}` : ""}`,
    }
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Could not update the product status."
    )
  }
}

export async function archiveProduct(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  return setProductActive(text(formData, "product_id"), false)
}

export async function restoreProduct(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  return setProductActive(text(formData, "product_id"), true)
}
