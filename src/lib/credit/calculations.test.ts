import { describe, expect, it } from "vitest";

import {
  buildCustomerAccount,
  isOverpayment,
  parseAmountInput,
  round2,
  sortCustomerSummaries,
  validateCreditSaleInput,
  validatePartyInput,
  validatePaymentInput,
} from "@/lib/credit/calculations";
import type {
  CreditTransaction,
  Party,
  PartyType,
} from "@/lib/credit/types";

const TODAY = "2026-02-10";

function makeParty(
  id: string,
  name: string,
  type: PartyType = "customer",
): Party {
  return {
    id,
    business_id: "business-1",
    name,
    phone: null,
    type,
    address: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeSale(
  id: string,
  amount: number,
  dueDate: string | null,
  transactionDate: string,
  partyId = "party-1",
): CreditTransaction {
  return {
    id,
    business_id: "business-1",
    type: "customer_credit_sale",
    party_id: partyId,
    amount,
    category: "Credit sale",
    payment_method: "credit",
    description: null,
    due_date: dueDate,
    transaction_date: transactionDate,
    created_at: `${transactionDate}T09:00:00.000Z`,
  };
}

function makePayment(
  id: string,
  amount: number,
  transactionDate: string,
  partyId = "party-1",
): CreditTransaction {
  return {
    id,
    business_id: "business-1",
    type: "customer_payment",
    party_id: partyId,
    amount,
    category: "Customer payment",
    payment_method: "cash",
    description: null,
    due_date: null,
    transaction_date: transactionDate,
    created_at: `${transactionDate}T10:00:00.000Z`,
  };
}

const party = makeParty("party-1", "Sita Sharma");

describe("overdue detection", () => {
  it("does not mark a sale due today as overdue", () => {
    const account = buildCustomerAccount(
      party,
      [makeSale("sale-1", 1000, TODAY, "2026-01-01")],
      TODAY,
    );

    expect(account.sales[0].status).toBe("unpaid");
    expect(account.summary.overdue).toBe(false);
    expect(account.summary.overdueAmount).toBe(0);
    expect(account.summary.overdueDueDate).toBeNull();
    expect(account.summary.nextDueDate).toBe(TODAY);
  });

  it("marks a sale due yesterday as overdue with the past-due amount", () => {
    const account = buildCustomerAccount(
      party,
      [makeSale("sale-1", 1000, "2026-02-09", "2026-01-01")],
      TODAY,
    );

    expect(account.sales[0].status).toBe("overdue");
    expect(account.summary.overdue).toBe(true);
    expect(account.summary.overdueAmount).toBe(1000);
    expect(account.summary.overdueDueDate).toBe("2026-02-09");
  });

  it("never marks a sale without a due date as overdue", () => {
    const account = buildCustomerAccount(
      party,
      [makeSale("sale-1", 1000, null, "2026-01-01")],
      TODAY,
    );

    expect(account.sales[0].status).toBe("unpaid");
    expect(account.summary.overdue).toBe(false);
    expect(account.summary.overdueAmount).toBe(0);
    expect(account.summary.overdueDueDate).toBeNull();
    expect(account.summary.nextDueDate).toBeNull();
  });
});

describe("FIFO payment allocation", () => {
  it("applies payments to the earliest due sale first", () => {
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-late", 1000, "2026-03-01", "2026-01-02"),
        makeSale("sale-early", 1000, "2026-02-01", "2026-01-01"),
        makePayment("payment-1", 500, "2026-02-05"),
      ],
      TODAY,
    );

    expect(account.sales.map((sale) => sale.id)).toEqual([
      "sale-early",
      "sale-late",
    ]);

    expect(account.sales[0].outstanding).toBe(500);
    expect(account.sales[0].status).toBe("overdue");
    expect(account.sales[1].outstanding).toBe(1000);
    expect(account.sales[1].status).toBe("unpaid");

    expect(account.summary.totalCredit).toBe(2000);
    expect(account.summary.totalPaid).toBe(500);
    expect(account.summary.balance).toBe(1500);
    expect(account.summary.overdueAmount).toBe(500);
    expect(account.summary.overdueDueDate).toBe("2026-02-01");
    expect(account.summary.nextDueDate).toBe("2026-03-01");
  });

  it("orders by due date before transaction date", () => {
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-early-due", 1000, "2026-02-01", "2026-01-20"),
        makeSale("sale-late-due", 1000, "2026-02-05", "2026-01-01"),
        makePayment("payment-1", 1000, "2026-02-06"),
      ],
      TODAY,
    );

    expect(account.sales[0].id).toBe("sale-early-due");
    expect(account.sales[0].status).toBe("paid");
    expect(account.sales[1].id).toBe("sale-late-due");
    expect(account.sales[1].outstanding).toBe(1000);
    expect(account.summary.overdueAmount).toBe(1000);
  });

  it("clears the overdue flag when payments exactly settle the balance", () => {
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-1", 1000, "2026-01-01", "2025-12-01"),
        makePayment("payment-1", 1000, "2026-01-15"),
      ],
      TODAY,
    );

    expect(account.summary.balance).toBe(0);
    expect(account.summary.overdue).toBe(false);
    expect(account.summary.overdueAmount).toBe(0);
    expect(account.summary.overdueDueDate).toBeNull();
    expect(account.sales[0].status).toBe("paid");
    expect(account.sales[0].outstanding).toBe(0);
  });

  it("reports a partial payment on a future sale", () => {
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-1", 1000, "2026-03-01", "2026-01-01"),
        makePayment("payment-1", 400, "2026-02-01"),
      ],
      TODAY,
    );

    expect(account.summary.balance).toBe(600);
    expect(account.summary.overdue).toBe(false);
    expect(account.sales[0].outstanding).toBe(600);
    expect(account.sales[0].status).toBe("partial");
    expect(account.summary.nextDueDate).toBe("2026-03-01");
  });

  it("ignores transactions that belong to another party", () => {
    const otherParty = makeParty("party-2", "Ram Thapa");
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-1", 1000, "2026-03-01", "2026-01-01"),
        makeSale("sale-2", 5000, "2026-01-01", "2025-12-01", otherParty.id),
        makePayment("payment-1", 200, "2026-01-02", otherParty.id),
      ],
      TODAY,
    );

    expect(account.summary.totalCredit).toBe(1000);
    expect(account.summary.totalPaid).toBe(0);
    expect(account.summary.balance).toBe(1000);
    expect(account.sales).toHaveLength(1);
    expect(account.payments).toHaveLength(0);
  });
});

describe("overpayment rules", () => {
  it("rejects a payment greater than the balance", () => {
    expect(isOverpayment(1001, 1000)).toBe(true);
    expect(isOverpayment(0.01, 0)).toBe(true);
  });

  it("accepts a payment equal to the balance", () => {
    expect(isOverpayment(1000, 1000)).toBe(false);
  });

  it("allows a sub-cent difference within the tolerance", () => {
    expect(isOverpayment(1000.004, 1000)).toBe(false);
  });
});

describe("rounding", () => {
  it("rounds to two decimals", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });

  it("settles floating-point sums without a residual balance", () => {
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-1", 0.1, "2026-01-01", "2025-12-01"),
        makeSale("sale-2", 0.2, "2026-01-02", "2025-12-02"),
        makePayment("payment-1", 0.3, "2026-01-03"),
      ],
      TODAY,
    );

    expect(account.summary.balance).toBe(0);
    expect(account.summary.overdue).toBe(false);
    expect(account.sales.every((sale) => sale.status === "paid")).toBe(true);
  });

  it("keeps balances stable across multiple sales and payments", () => {
    const account = buildCustomerAccount(
      party,
      [
        makeSale("sale-1", 100.01, "2026-01-01", "2025-12-01"),
        makeSale("sale-2", 200.02, "2026-01-02", "2025-12-02"),
        makePayment("payment-1", 150.01, "2026-01-03"),
      ],
      TODAY,
    );

    expect(account.summary.totalCredit).toBe(300.03);
    expect(account.summary.totalPaid).toBe(150.01);
    expect(account.summary.balance).toBe(150.02);
    expect(account.sales[1].outstanding).toBe(150.02);
  });
});

describe("customer list ordering", () => {
  it("puts overdue customers first by earliest overdue date, then balance", () => {
    const january = buildCustomerAccount(
      makeParty("party-a", "Anita"),
      [makeSale("sale-a", 500, "2026-01-01", "2025-12-01")],
      TODAY,
    ).summary;

    const february = buildCustomerAccount(
      makeParty("party-b", "Bikash"),
      [makeSale("sale-b", 900, "2026-02-01", "2025-12-01")],
      TODAY,
    ).summary;

    const februarySmaller = buildCustomerAccount(
      makeParty("party-c", "Chetan"),
      [makeSale("sale-c", 700, "2026-02-01", "2025-12-01")],
      TODAY,
    ).summary;

    const settled = buildCustomerAccount(
      makeParty("party-d", "Dipa"),
      [
        makeSale("sale-d", 400, "2026-01-01", "2025-12-01"),
        makePayment("payment-d", 400, "2025-12-02"),
      ],
      TODAY,
    ).summary;

    const sorted = sortCustomerSummaries([
      settled,
      february,
      februarySmaller,
      january,
    ]);

    expect(sorted.map((summary) => summary.party.id)).toEqual([
      "party-a",
      "party-b",
      "party-c",
      "party-d",
    ]);
  });
});

describe("input parsing and validation", () => {
  it("parses positive amounts with at most two decimals", () => {
    expect(parseAmountInput("1000")).toBe(1000);
    expect(parseAmountInput("1000.5")).toBe(1000.5);
    expect(parseAmountInput("1000.50")).toBe(1000.5);
    expect(parseAmountInput(" 0.01 ")).toBe(0.01);
  });

  it("rejects zero, negative, malformed and over-precise amounts", () => {
    expect(parseAmountInput("0")).toBeNull();
    expect(parseAmountInput("0.00")).toBeNull();
    expect(parseAmountInput("-5")).toBeNull();
    expect(parseAmountInput("1.234")).toBeNull();
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("")).toBeNull();
  });

  it("requires a valid due date on or after the transaction date", () => {
    const base = {
      amount: 100,
      category: "Credit sale",
      transactionDate: "2026-02-05",
      today: TODAY,
    };

    expect(
      validateCreditSaleInput({ ...base, dueDate: "2026-02-01" }),
    ).toHaveProperty("due_date");

    expect(
      validateCreditSaleInput({ ...base, dueDate: "2026-02-30" }),
    ).toHaveProperty("due_date");

    expect(
      validateCreditSaleInput({ ...base, dueDate: "2026-02-05" }),
    ).toEqual({});
  });

  it("rejects a future transaction date", () => {
    const errors = validateCreditSaleInput({
      amount: 100,
      category: "Credit sale",
      dueDate: "2026-02-20",
      transactionDate: "2026-02-11",
      today: TODAY,
    });

    expect(errors.transaction_date).toBe(
      "Transaction date cannot be in the future.",
    );
  });

  it("validates customer type and name", () => {
    expect(validatePartyInput({ name: "  ", type: "customer" })).toHaveProperty(
      "name",
    );
    expect(validatePartyInput({ name: "Sita", type: "supplier" })).toHaveProperty(
      "type",
    );
    expect(validatePartyInput({ name: "Sita", type: "both" })).toEqual({});
  });

  it("rejects unsupported payment methods and future payment dates", () => {
    expect(
      validatePaymentInput({
        amount: 100,
        category: "Customer payment",
        paymentMethod: "credit",
        transactionDate: "2026-02-01",
        today: TODAY,
      }),
    ).toHaveProperty("payment_method");

    expect(
      validatePaymentInput({
        amount: 100,
        category: "Customer payment",
        paymentMethod: "cash",
        transactionDate: "2026-02-11",
        today: TODAY,
      }),
    ).toHaveProperty("transaction_date");
  });
});
