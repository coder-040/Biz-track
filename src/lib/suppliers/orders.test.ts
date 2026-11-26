import { describe, expect, it } from "vitest";
import {
  allocatePaymentFIFO,
  buildSupplierOrders,
  calculateOutstandingCents,
  deriveSupplierOrderColumn,
  moveSupplierOrder,
} from "@/lib/suppliers/orders";
import type {
  SupplierOrderRecord,
  SupplierOrderSnapshot,
} from "@/lib/suppliers/orders";

describe("buildSupplierOrders", () => {
  it("keeps the selected product and quantity on the order", () => {
    const record: SupplierOrderRecord = {
      id: "order-3",
      business_id: "business-1",
      supplier_id: "supplier-1",
      product_id: "product-1",
      quantity: "4.50",
      items: "A4 paper",
      category: "Inventory",
      total_amount: "900.00",
      order_date: "2026-11-26",
      due_date: "2026-12-10",
      status: "ordered",
      attachment_url: null,
      received_at: null,
      created_at: "2026-11-26T00:00:00Z",
    };

    const [order] = buildSupplierOrders(
      [record],
      [],
      [{ id: "supplier-1", name: "Paper supplier" }],
    );

    expect(order.productId).toBe("product-1");
    expect(order.quantity).toBe(4.5);
  });
});

describe("calculateOutstandingCents", () => {
  it("returns the unpaid balance in integer cents", () => {
    expect(calculateOutstandingCents(12_345, 3_456)).toBe(8_889);
    expect(calculateOutstandingCents(12_345, 12_345)).toBe(0);
  });
});

describe("deriveSupplierOrderColumn", () => {
  const order: SupplierOrderSnapshot = {
    id: "order-1",
    status: "ordered",
    totalCents: 10_000,
    paidCents: 0,
    orderDate: "2026-11-26",
    createdAt: "2026-11-26T00:00:00Z",
  };

  it("keeps unreceived orders ordered and derives received credit/paid columns", () => {
    expect(deriveSupplierOrderColumn(order)).toBe("ordered");
    const partiallyPaid = {
      ...order,
      status: "received" as const,
      paidCents: 2_500,
    };
    expect(deriveSupplierOrderColumn(partiallyPaid)).toBe("credit");
    expect(
      deriveSupplierOrderColumn({
        ...partiallyPaid,
        paidCents: partiallyPaid.totalCents,
      }),
    ).toBe("paid");
  });
});

describe("moveSupplierOrder", () => {
  const order: SupplierOrderSnapshot = {
    id: "order-2",
    status: "ordered",
    totalCents: 10_000,
    paidCents: 0,
    orderDate: "2026-11-26",
    createdAt: "2026-11-26T00:00:00Z",
  };

  it("allows Ordered to Received and derives the destination column", () => {
    const result = moveSupplierOrder(order, "received", false);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.order.status).toBe("received");
      expect(deriveSupplierOrderColumn(result.order)).toBe("credit");
    }
  });

  it.each(["credit", "paid"] as const)(
    "blocks Ordered directly to %s",
    (target) => {
      const result = moveSupplierOrder(order, target, false);

      expect(result.ok).toBe(false);
    },
  );

  it("allows a received order to return to Ordered only before any payment", () => {
    const received = { ...order, status: "received" as const };

    expect(moveSupplierOrder(received, "ordered", false).ok).toBe(true);
    expect(moveSupplierOrder(received, "ordered", true).ok).toBe(false);
  });
});

describe("allocatePaymentFIFO", () => {
  const orders: SupplierOrderSnapshot[] = [
    {
      id: "newer",
      status: "received",
      totalCents: 8_000,
      paidCents: 0,
      orderDate: "2026-11-20",
      createdAt: "2026-11-20T10:00:00Z",
    },
    {
      id: "oldest",
      status: "received",
      totalCents: 5_000,
      paidCents: 0,
      orderDate: "2026-11-10",
      createdAt: "2026-11-10T10:00:00Z",
    },
    {
      id: "ordered",
      status: "ordered",
      totalCents: 3_000,
      paidCents: 0,
      orderDate: "2026-11-01",
      createdAt: "2026-11-01T10:00:00Z",
    },
  ];

  it("allocates payments to the oldest received order first", () => {
    expect(allocatePaymentFIFO(orders, 6_000)).toEqual({
      allocations: [
        { orderId: "oldest", amountCents: 5_000 },
        { orderId: "newer", amountCents: 1_000 },
      ],
      unallocatedCents: 0,
    });
  });

  it("rejects a payment larger than a selected order's outstanding amount", () => {
    expect(() => allocatePaymentFIFO(orders, 5_001, "oldest")).toThrow(
      "Payment exceeds this order's outstanding amount.",
    );
  });
});
