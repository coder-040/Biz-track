import { describe, expect, it } from "vitest";

import {
  createSupplierOrderPaymentForm,
  validateEntryForm,
} from "@/lib/suppliers/calculate";
import type { PartyRow, SupplierTransactionRow } from "@/lib/suppliers/types";

describe("createSupplierOrderPaymentForm", () => {
  it("defaults order payments to a method accepted by the payment validator", () => {
    const party: PartyRow = {
      id: "supplier-1",
      business_id: "business-1",
      name: "Paper supplier",
      phone: null,
      type: "supplier",
      address: null,
      created_at: "2026-11-26T00:00:00Z",
    };
    const purchase: SupplierTransactionRow = {
      id: "purchase-1",
      business_id: "business-1",
      supplier_order_id: "order-1",
      type: "supplier_purchase",
      party_id: party.id,
      amount: 100,
      category: "Inventory",
      payment_method: "credit",
      description: null,
      due_date: "2026-12-10",
      transaction_date: "2026-11-26",
      attachment_url: null,
      created_at: "2026-11-26T00:00:00Z",
    };
    const form = {
      ...createSupplierOrderPaymentForm(party.id, "order-1"),
      amount: "20",
    };

    expect(form.paymentMethod).toBe("cash");
    expect(validateEntryForm(form, [party], [purchase], null)).toBeNull();
  });
});
