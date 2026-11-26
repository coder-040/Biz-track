import { describe, expect, it } from "vitest";
import { cashFlowType } from "@/lib/transactions/accounting";

describe("cashFlowType", () => {
  it.each([
    ["income", "cash", "income"],
    ["customer_payment", "bank", "income"],
    ["expense", "cash", "expense"],
    ["supplier_payment", "bank", "expense"],
    ["supplier_purchase", "qr", "expense"],
    ["supplier_purchase", "credit", null],
    ["supplier_purchase", null, null],
    ["income", "credit", null],
    ["expense", null, null],
    ["customer_payment", null, null],
    ["customer_credit_sale", "credit", null],
    ["other", "cash", null],
  ] as const)(
    "classifies %s paid with %s as %s",
    (type, paymentMethod, expected) => {
      expect(cashFlowType(type, paymentMethod)).toBe(expected);
    },
  );
});
