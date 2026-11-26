export type CashFlowType = "income" | "expense";

const PAID_METHODS = new Set(["cash", "bank", "qr", "online"]);

export function cashFlowType(
  type: string,
  paymentMethod: string | null,
): CashFlowType | null {
  if (!paymentMethod || !PAID_METHODS.has(paymentMethod)) return null;
  if (type === "income" || type === "customer_payment") return "income";
  if (
    type === "expense" ||
    type === "supplier_payment" ||
    type === "supplier_purchase"
  ) {
    return "expense";
  }
  return null;
}
