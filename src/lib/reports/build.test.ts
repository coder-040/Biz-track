import { describe, expect, it } from "vitest";
import { buildReport } from "@/lib/reports/build";
import type { ReportSources } from "@/lib/reports/data";

const sources: ReportSources = {
  businessId: "test-business",
  transactions: [
    {
      id: "income-1",
      type: "income",
      party_id: null,
      amount: "100.50",
      category: "Sales",
      payment_method: "cash",
      description: null,
      due_date: null,
      transaction_date: "2026-11-02",
      created_at: "2026-11-02T10:00:00Z",
    },
    {
      id: "sale-old",
      type: "customer_credit_sale",
      party_id: "both-party",
      amount: "80.00",
      category: "Credit sale",
      payment_method: "credit",
      description: null,
      due_date: "2026-11-01",
      transaction_date: "2026-10-20",
      created_at: "2026-10-20T10:00:00Z",
    },
    {
      id: "sale-new",
      type: "customer_credit_sale",
      party_id: "both-party",
      amount: "40.00",
      category: "Credit sale",
      payment_method: "credit",
      description: null,
      due_date: "2026-11-20",
      transaction_date: "2026-10-25",
      created_at: "2026-10-25T10:00:00Z",
    },
    {
      id: "customer-payment",
      type: "customer_payment",
      party_id: "both-party",
      amount: "90.00",
      category: "Payment",
      payment_method: "cash",
      description: null,
      due_date: null,
      transaction_date: "2026-10-30",
      created_at: "2026-10-30T10:00:00Z",
    },
    {
      id: "supplier-purchase",
      type: "supplier_purchase",
      party_id: "both-party",
      amount: "60.00",
      category: "Inventory",
      payment_method: "credit",
      description: null,
      due_date: "2026-11-05",
      transaction_date: "2026-10-20",
      created_at: "2026-10-20T11:00:00Z",
    },
    {
      id: "supplier-payment",
      type: "supplier_payment",
      party_id: "both-party",
      amount: "10.00",
      category: "Payment",
      payment_method: "bank",
      description: null,
      due_date: null,
      transaction_date: "2026-10-29",
      created_at: "2026-10-29T10:00:00Z",
    },
    {
      id: "paid-supplier-purchase",
      type: "supplier_purchase",
      party_id: "both-party",
      amount: "20.00",
      category: "Inventory",
      payment_method: "bank",
      description: null,
      due_date: null,
      transaction_date: "2026-11-01",
      created_at: "2026-11-01T10:00:00Z",
    },
  ],
  parties: [{ id: "both-party", name: "Mixed Party", type: "both" }],
  products: [
    {
      id: "product-1",
      name: "Paper",
      sku: "P-1",
      category: "Office",
      purchase_price: "2.50",
      current_stock: "14",
      min_stock: "5",
      is_active: true,
      created_at: "2026-10-01T00:00:00Z",
    },
  ],
  movements: [
    {
      id: "movement-1",
      product_id: "product-1",
      transaction_id: null,
      type: "purchase",
      quantity: "4",
      unit_cost: "2.50",
      reason: null,
      created_at: "2026-11-04T10:00:00Z",
    },
    {
      id: "movement-2",
      product_id: "product-1",
      transaction_id: null,
      type: "sale",
      quantity: "2",
      unit_cost: "2.50",
      reason: null,
      created_at: "2026-11-05T10:00:00Z",
    },
  ],
};

describe("buildReport", () => {
  it("groups financial activity by date and applies inclusive date filters", () => {
    const report = buildReport(sources, "daily-income-expense", "2026-11-02", "2026-11-02");

    expect(report.rows).toEqual([
      { period: "2026-11-02", income: 100.5, expense: 0, net: 100.5 },
    ]);
    expect(report.summaries[0]?.value).toBe(100.5);
  });

  it("reports received customer payments and paid supplier costs, not unpaid credit", () => {
    const report = buildReport(
      sources,
      "daily-income-expense",
      "2026-10-29",
      "2026-11-02",
    );

    expect(report.rows).toEqual([
      { period: "2026-10-29", income: 0, expense: 10, net: -10 },
      { period: "2026-10-30", income: 90, expense: 0, net: 90 },
      { period: "2026-11-01", income: 0, expense: 20, net: -20 },
      { period: "2026-11-02", income: 100.5, expense: 0, net: 100.5 },
    ]);
  });

  it("uses FIFO allocation for customer overdue amounts and includes both-type parties", () => {
    const report = buildReport(sources, "customer-outstanding", "2026-01-01", "2026-11-10");

    expect(report.rows).toEqual([
      {
        party: "Mixed Party",
        credit: 120,
        paid: 90,
        outstanding: 30,
        overdue: 0,
        due_date: "2026-11-20",
      },
    ]);
  });

  it("computes supplier payables for both-type parties and overdue amount", () => {
    const report = buildReport(sources, "supplier-payables", "2026-01-01", "2026-11-10");

    expect(report.rows).toEqual([
      {
        party: "Mixed Party",
        payable: 50,
        overdue: 50,
        due_date: "2026-11-05",
      },
    ]);
  });

  it("reconstructs inventory at the selected end date from later movements", () => {
    const report = buildReport(sources, "inventory", "2026-11-01", "2026-11-03");

    expect(report.rows[0]).toMatchObject({ stock: 12, value: 30 });
  });
});
