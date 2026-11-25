import { describe, expect, it } from "vitest";

import {
  createCreditSale,
  createCustomer,
  createCustomerPayment,
  getCustomerAccount,
  getCustomerAccounts,
} from "@/lib/credit/data";

const TODAY = "2026-11-26";

describe("demo data store", () => {
  it("creates a customer, records a sale and a payment, and updates the balance", async () => {
    const customer = await createCustomer({
      name: "Demo Test Buyer",
      phone: "9800000099",
      address: "Kathmandu",
      type: "customer",
    });

    const accounts = await getCustomerAccounts(TODAY);
    const listed = accounts.find((account) => account.party.id === customer.id);

    expect(listed).toBeDefined();
    expect(listed?.balance).toBe(0);

    await createCreditSale({
      partyId: customer.id,
      amount: 1500,
      category: "Goods",
      dueDate: "2026-12-05",
      transactionDate: TODAY,
      description: "Test credit sale",
    });

    let account = await getCustomerAccount(customer.id, TODAY);
    expect(account).not.toBeNull();
    expect(account?.summary.totalCredit).toBe(1500);
    expect(account?.summary.balance).toBe(1500);
    expect(account?.sales[0].status).toBe("unpaid");

    await createCustomerPayment({
      partyId: customer.id,
      amount: 500,
      category: "Customer payment",
      paymentMethod: "cash",
      transactionDate: TODAY,
    });

    account = await getCustomerAccount(customer.id, TODAY);
    expect(account?.summary.totalPaid).toBe(500);
    expect(account?.summary.balance).toBe(1000);
    expect(account?.sales[0].status).toBe("partial");
  });

  it("returns null for an unknown customer", async () => {
    expect(
      await getCustomerAccount("00000000-0000-4000-8000-000000000000", TODAY),
    ).toBeNull();
  });
});
