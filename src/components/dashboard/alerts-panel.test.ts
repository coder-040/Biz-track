import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlertsPanel } from "./alerts-panel";

describe("AlertsPanel supplier dues", () => {
  it("does not show a settled supplier purchase as an upcoming due", () => {
    const markup = renderToStaticMarkup(
      createElement(AlertsPanel, {
        lowStockProducts: [],
        overdueCustomers: [],
        overdueSuppliers: [],
        customerBalances: [],
        supplierBalances: [],
        upcomingReminders: [
          {
            id: "settled-supplier-purchase",
            type: "supplier_purchase",
            party_id: "supplier-1",
            amount: 123,
            category: "Purchase",
            payment_method: "credit",
            description: null,
            due_date: "2026-03-01",
            transaction_date: "2026-02-01",
            created_at: "2026-02-01T00:00:00.000Z",
            parties: { name: "Supplier A" },
          },
        ],
        totalReceivables: 0,
        inventoryValue: 0,
        suppliers: [],
        today: "2026-02-15",
      }),
    );

    expect(markup).not.toContain("Supplier A");
    expect(markup).not.toContain("Rs. 123");
  });
});
