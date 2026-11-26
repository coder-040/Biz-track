"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import {
  isCustomerType,
  isOverpayment,
  isPaymentMethod,
  parseAmountInput,
  validateCreditSaleInput,
  validatePartyInput,
  validatePaymentInput,
} from "@/lib/credit/calculations";
import {
  createCreditSale,
  createCustomer,
  createCustomerPayment,
  getCustomerAccount,
} from "@/lib/credit/data";
import { todayISO } from "@/lib/credit/date";
import type {
  CreatePartyInput,
  CustomerAccount,
  Party,
  PaymentMethod,
} from "@/lib/credit/types";
import { formatCurrency } from "@/lib/format";
import { requireBusinessPermission } from "@/lib/auth/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value === "" ? null : value;
}

function failure(error: unknown, fallback: string): ActionState {
  const message =
    error instanceof Error && error.message ? error.message : fallback;
  return { status: "error", message };
}

function validationFailure(
  fieldErrors: Record<string, string>,
): ActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors,
  };
}

export async function createCustomerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireBusinessPermission("manage_finances");
  const name = text(formData, "name");
  const phone = optionalText(formData, "phone");
  const address = optionalText(formData, "address");
  const typeValue = text(formData, "type");

  const fieldErrors = validatePartyInput({ name, type: typeValue });
  if (Object.keys(fieldErrors).length > 0) {
    return validationFailure(fieldErrors);
  }

  if (!isCustomerType(typeValue)) {
    return validationFailure({
      type: "Choose customer or customer & supplier.",
    });
  }

  const input: CreatePartyInput = {
    name,
    phone,
    address,
    type: typeValue,
  };

  let party: Party;
  try {
    party = await createCustomer(input);
  } catch (error) {
    return failure(error, "Could not add the customer.");
  }

  revalidatePath("/parties");
  return {
    status: "success",
    message: `${party.name} was added. You can now record credit sales and payments.`,
  };
}

export async function recordCreditSaleAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireBusinessPermission("manage_finances");
  const today = todayISO();
  const partyId = text(formData, "party_id");
  const amount = parseAmountInput(text(formData, "amount"));
  const category = text(formData, "category");
  const dueDate = text(formData, "due_date");
  const transactionDate = text(formData, "transaction_date");
  const description = optionalText(formData, "description");

  const fieldErrors = validateCreditSaleInput({
    amount,
    category,
    dueDate,
    transactionDate,
    today,
  });

  if (!partyId || !UUID_PATTERN.test(partyId)) {
    fieldErrors.party_id = "Choose a valid customer.";
  }

  if (Object.keys(fieldErrors).length > 0 || amount === null) {
    return validationFailure(fieldErrors);
  }

  let account: CustomerAccount | null;
  try {
    account = await getCustomerAccount(partyId, today);
  } catch (error) {
    return failure(error, "Could not load the customer.");
  }

  if (!account) {
    return { status: "error", message: "Customer not found." };
  }

  try {
    await createCreditSale({
      partyId,
      amount,
      category,
      dueDate,
      transactionDate,
      description,
    });
  } catch (error) {
    return failure(error, "Could not record the credit sale.");
  }

  revalidatePath("/parties");
  revalidatePath(`/parties/${partyId}`);

  return {
    status: "success",
    message: `Credit sale of ${formatCurrency(amount)} recorded.`,
  };
}

export async function recordPaymentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireBusinessPermission("manage_finances");
  const today = todayISO();
  const partyId = text(formData, "party_id");
  const amount = parseAmountInput(text(formData, "amount"));
  const category = text(formData, "category");
  const paymentMethodValue = text(formData, "payment_method");
  const transactionDate = text(formData, "transaction_date");

  const fieldErrors = validatePaymentInput({
    amount,
    category,
    paymentMethod: paymentMethodValue,
    transactionDate,
    today,
  });

  if (!partyId || !UUID_PATTERN.test(partyId)) {
    fieldErrors.party_id = "Choose a valid customer.";
  }

  if (Object.keys(fieldErrors).length > 0 || amount === null) {
    return validationFailure(fieldErrors);
  }

  if (!isPaymentMethod(paymentMethodValue)) {
    return validationFailure({
      payment_method: "Choose a valid payment method.",
    });
  }

  let account: CustomerAccount | null;
  try {
    account = await getCustomerAccount(partyId, today);
  } catch (error) {
    return failure(error, "Could not load the customer.");
  }

  if (!account) {
    return { status: "error", message: "Customer not found." };
  }

  const balance = account.summary.balance;
  // App-level guard only: two concurrent payments can both pass this check
  // because no database constraint or function enforces the balance.
  if (isOverpayment(amount, balance)) {
    return {
      status: "error",
      message: `Payment of ${formatCurrency(amount)} exceeds the outstanding balance of ${formatCurrency(balance)}.`,
      fieldErrors: {
        amount: `Enter an amount up to ${formatCurrency(balance)}.`,
      },
    };
  }

  const paymentMethod: PaymentMethod = paymentMethodValue;

  try {
    await createCustomerPayment({
      partyId,
      amount,
      category,
      paymentMethod,
      transactionDate,
    });
  } catch (error) {
    return failure(error, "Could not record the payment.");
  }

  revalidatePath("/parties");
  revalidatePath(`/parties/${partyId}`);

  return {
    status: "success",
    message: `Payment of ${formatCurrency(amount)} recorded.`,
  };
}
