import type { SupplierPaymentMethod } from "./types";

export type SupplierOrderStatus = "ordered" | "received";
export type SupplierOrderColumn = "ordered" | "received" | "credit" | "paid";

export interface SupplierOrderSnapshot {
  id: string;
  status: SupplierOrderStatus;
  totalCents: number;
  paidCents: number;
  orderDate: string;
  createdAt: string;
}

export type SupplierOrderMoveResult =
  | { ok: true; order: SupplierOrderSnapshot }
  | { ok: false; message: string };

export interface SupplierOrderPaymentAllocation {
  orderId: string;
  amountCents: number;
}

export interface SupplierOrderPayment {
  id: string;
  orderId: string;
  supplierId: string;
  amountCents: number;
  paymentMethod: SupplierPaymentMethod;
  paymentDate: string;
  transactionId: string;
  createdAt: string;
}

export interface SupplierOrder extends SupplierOrderSnapshot {
  businessId: string;
  supplierId: string;
  supplierName: string;
  productId: string | null;
  quantity: number | null;
  items: string;
  category: string;
  dueDate: string;
  attachmentUrl: string | null;
  receivedAt: string | null;
  payments: SupplierOrderPayment[];
}

export interface NewSupplierOrderInput {
  supplierId: string;
  productId: string;
  quantity: string;
  items: string;
  category: string;
  totalAmount: string;
  orderDate: string;
  dueDate: string;
  paymentType: "paid_now" | "credit";
  paymentMethod: SupplierPaymentMethod | null;
  attachmentUrl: string;
}

export interface SupplierOrderRecord {
  id: string;
  business_id: string;
  supplier_id: string;
  product_id?: string | null;
  quantity?: number | string | null;
  items: string;
  category: string;
  total_amount: number | string;
  order_date: string;
  due_date: string;
  status: SupplierOrderStatus;
  attachment_url: string | null;
  received_at: string | null;
  created_at: string;
}

export interface SupplierOrderPaymentRecord {
  id: string;
  business_id: string;
  order_id: string;
  supplier_id: string;
  amount: number | string;
  payment_method: SupplierPaymentMethod;
  payment_date: string;
  transaction_id: string;
  created_at: string;
}

export function calculateOutstandingCents(
  totalCents: number,
  paidCents: number,
): number {
  if (
    !Number.isSafeInteger(totalCents) ||
    !Number.isSafeInteger(paidCents) ||
    totalCents < 0 ||
    paidCents < 0
  ) {
    throw new RangeError("Order amounts must be non-negative integer cents.");
  }

  return Math.max(0, totalCents - paidCents);
}

export function deriveSupplierOrderColumn(
  order: SupplierOrderSnapshot,
): SupplierOrderColumn {
  if (order.status === "ordered") return "ordered";
  return calculateOutstandingCents(order.totalCents, order.paidCents) > 0
    ? "credit"
    : "paid";
}

export function moveSupplierOrder(
  order: SupplierOrderSnapshot,
  target: SupplierOrderColumn,
  hasRecordedPayments: boolean,
): SupplierOrderMoveResult {
  if (order.status === "ordered") {
    if (target === "ordered") return { ok: true, order };
    if (target === "received") {
      return { ok: true, order: { ...order, status: "received" } };
    }
    return {
      ok: false,
      message: "Receive the goods before moving an order to Credit or Paid.",
    };
  }

  if (target === "ordered") {
    if (hasRecordedPayments) {
      return {
        ok: false,
        message: "An order with recorded payments cannot be moved back to Ordered.",
      };
    }
    return { ok: true, order: { ...order, status: "ordered" } };
  }

  if (target === deriveSupplierOrderColumn(order)) {
    return { ok: true, order };
  }

  return {
    ok: false,
    message: "Credit and Paid are determined automatically by the outstanding balance.",
  };
}

export function allocatePaymentFIFO(
  orders: SupplierOrderSnapshot[],
  amountCents: number,
  selectedOrderId?: string,
): {
  allocations: SupplierOrderPaymentAllocation[];
  unallocatedCents: number;
} {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new RangeError("Payment must be a positive amount in integer cents.");
  }

  if (selectedOrderId) {
    const order = orders.find((candidate) => candidate.id === selectedOrderId);
    if (!order || order.status !== "received") {
      throw new Error("Choose a received supplier order.");
    }

    const outstandingCents = calculateOutstandingCents(
      order.totalCents,
      order.paidCents,
    );
    if (amountCents > outstandingCents) {
      throw new Error("Payment exceeds this order's outstanding amount.");
    }

    return {
      allocations: [{ orderId: order.id, amountCents }],
      unallocatedCents: 0,
    };
  }

  let remainingCents = amountCents;
  const allocations: SupplierOrderPaymentAllocation[] = [];
  const oldestFirst = orders
    .filter(
      (order) =>
        order.status === "received" &&
        calculateOutstandingCents(order.totalCents, order.paidCents) > 0,
    )
    .sort(
      (a, b) =>
        a.orderDate.localeCompare(b.orderDate) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );

  for (const order of oldestFirst) {
    if (remainingCents === 0) break;
    const outstandingCents = calculateOutstandingCents(
      order.totalCents,
      order.paidCents,
    );
    const allocatedCents = Math.min(remainingCents, outstandingCents);
    allocations.push({ orderId: order.id, amountCents: allocatedCents });
    remainingCents -= allocatedCents;
  }

  return { allocations, unallocatedCents: remainingCents };
}

function amountToCents(value: number | string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("Supplier order amounts must be valid non-negative values.");
  }
  const cents = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError("Supplier order amount exceeds the supported range.");
  }
  return cents;
}

export function buildSupplierOrders(
  orderRecords: SupplierOrderRecord[],
  paymentRecords: SupplierOrderPaymentRecord[],
  suppliers: Array<{ id: string; name: string }>,
): SupplierOrder[] {
  const supplierNames = new Map(
    suppliers.map((supplier) => [supplier.id, supplier.name]),
  );
  const paymentsByOrder = new Map<string, SupplierOrderPayment[]>();

  for (const payment of paymentRecords) {
    const list = paymentsByOrder.get(payment.order_id) ?? [];
    list.push({
      id: payment.id,
      orderId: payment.order_id,
      supplierId: payment.supplier_id,
      amountCents: amountToCents(payment.amount),
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      transactionId: payment.transaction_id,
      createdAt: payment.created_at,
    });
    paymentsByOrder.set(payment.order_id, list);
  }

  return orderRecords.map((record) => {
    const payments = (paymentsByOrder.get(record.id) ?? []).sort(
      (a, b) =>
        a.paymentDate.localeCompare(b.paymentDate) ||
        a.createdAt.localeCompare(b.createdAt),
    );
    const paidCents = payments.reduce(
      (sum, payment) => sum + payment.amountCents,
      0,
    );

    return {
      id: record.id,
      businessId: record.business_id,
      supplierId: record.supplier_id,
      supplierName: supplierNames.get(record.supplier_id) ?? "Unknown supplier",
      productId: record.product_id ?? null,
      quantity:
        record.quantity == null ? null : Number(record.quantity),
      items: record.items,
      category: record.category,
      totalCents: amountToCents(record.total_amount),
      paidCents,
      orderDate: record.order_date,
      dueDate: record.due_date,
      status: record.status,
      attachmentUrl: record.attachment_url,
      receivedAt: record.received_at,
      createdAt: record.created_at,
      payments,
    };
  });
}
