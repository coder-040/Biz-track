"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { can } from "@/lib/auth/permissions";
import { requireBusinessContext } from "@/lib/auth/server";
import { isISODate, todayISOInTimeZone } from "@/lib/date";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_METHODS = ["cash", "bank", "qr", "online", "credit"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

function databaseMessage(error: { code?: string; message: string }): string {
  if (
    error.code === "PGRST202" ||
    error.message.includes("record_product_sale")
  ) {
    return "The product sale database function is missing. Run the latest supabase/schema.sql in the Supabase SQL editor, then try again.";
  }
  return error.message;
}

export async function recordProductSale(
  formData: FormData,
): Promise<ActionState> {
  const productId = text(formData, "product_id");
  const customerId = text(formData, "customer_id");
  const quantityText = text(formData, "quantity");
  const paymentMethod = text(formData, "payment_method");
  const transactionDate = text(formData, "transaction_date");
  const dueDate = text(formData, "due_date");
  const description = text(formData, "description");
  const quantity = Number(quantityText);
  const today = todayISOInTimeZone("Asia/Kathmandu");

  if (!UUID_PATTERN.test(productId)) return fail("Choose a valid product.");
  if (
    !/^\d+(\.\d{1,2})?$/.test(quantityText) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > 9999999999.99
  ) {
    return fail("Quantity must be greater than zero with at most 2 decimal places.");
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return fail("Choose a valid payment method.");
  }
  if (!isISODate(transactionDate) || transactionDate > today) {
    return fail("Choose a valid sale date that is not in the future.");
  }

  if (customerId && !UUID_PATTERN.test(customerId)) {
    return fail("Choose a valid customer.");
  }
  if (paymentMethod === "credit") {
    if (!customerId) return fail("Choose a customer for a credit sale.");
    if (
      !isISODate(dueDate) ||
      dueDate < transactionDate
    ) {
      return fail("Choose a due date on or after the sale date.");
    }
  }

  const context = await requireBusinessContext();
  if (
    !can(context.role, "manage_finances", context.permissions) ||
    !can(context.role, "manage_inventory", context.permissions)
  ) {
    return fail("You do not have permission to record product sales.");
  }

  try {
    const { error } = await context.supabase.rpc("record_product_sale", {
      p_business_id: context.business.id,
      p_product_id: productId,
      p_quantity: quantity,
      p_customer_id: customerId || null,
      p_payment_method: paymentMethod,
      p_transaction_date: transactionDate,
      p_due_date: paymentMethod === "credit" ? dueDate : null,
      p_description: description || null,
      p_actor_id: context.user.id,
      p_actor_name: context.user.user_metadata.full_name ?? null,
    });

    if (error) return fail(databaseMessage(error));

    revalidatePath("/");
    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${productId}`);
    revalidatePath("/transactions");
    revalidatePath("/reports");
    if (paymentMethod === "credit") revalidatePath("/parties");

    return {
      status: "success",
      message:
        paymentMethod === "credit"
          ? "Credit sale recorded. Customer balance and stock updated."
          : "Sale recorded as income. Stock updated.",
    };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Could not record the sale.",
    );
  }
}
