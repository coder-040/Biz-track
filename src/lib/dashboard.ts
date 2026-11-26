import { connection } from "next/server";
import { BUSINESS_ID } from "@/lib/config";
import { addDaysISO, todayISOInTimeZone } from "@/lib/date";
import type { SupplierOption } from "@/lib/inventory";
import type { ProductSaleProduct, SaleCustomer } from "@/lib/sales/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cashFlowType } from "@/lib/transactions/accounting";


// ─── Types ───────────────────────────────────────────────────────────────────

export type Transaction = {
  id: string;
  type: string;
  party_id: string | null;
  amount: number;
  category: string;
  payment_method: "cash" | "bank" | "qr" | "online" | "credit";
  description: string | null;
  due_date: string | null;
  transaction_date: string;
  created_at: string;
  // Supabase returns joined one-to-one relations as an array when using select
  parties?: { name: string }[] | { name: string } | null;
};

export type PartyBalance = {
  party_id: string;
  party_name: string;
  balance: number;
  due_date: string | null;
  overdue_amount?: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  purchase_price: number;
  supplier_id: string | null;
};

export type WeeklyDay = {
  label: string;   // e.g. "Sun", "Mon" (Nepali day name)
  labelNp: string; // e.g. "आइत", "सोम"
  date: string;    // YYYY-MM-DD
  income: number;
  expense: number;
  isToday: boolean;
};

export type DashboardData = {
  today: string;
  // Today's income/expense
  todayIncome: number;
  todayExpense: number;
  todayIncomeCount: number;
  // Balance by payment method (all-time net)
  cashBalance: number;
  bankOnlineBalance: number;
  totalBalance: number;
  // Receivables / payables
  totalReceivables: number;
  totalPayables: number;
  // Per-party (for Alerts Sheet)
  customerBalances: PartyBalance[];
  supplierBalances: PartyBalance[];
  // Inventory
  inventoryValue: number;
  // Alert counts
  lowStockCount: number;
  overdueCustomerCount: number;
  overdueSupplierCount: number;
  // Lists
  recentTransactions: Transaction[];
  upcomingReminders: Transaction[];
  lowStockProducts: LowStockProduct[];
  overdueCustomers: PartyBalance[];
  overdueSuppliers: PartyBalance[];
  suppliers: SupplierOption[];
  saleProducts: ProductSaleProduct[];
  saleCustomers: SaleCustomer[];
  // Weekly chart
  weeklyFlow: WeeklyDay[];
};

// ─── Main data fetch ──────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  await connection();
  const db = createServerSupabaseClient();
  const today = todayISOInTimeZone("Asia/Kathmandu");

  // Run all independent queries in parallel
  const [
    todayTxResult,
    cashBankTxResult,
    allTxResult,
    productsResult,
    recentTxResult,
    remindersTxResult,
    partiesResult,
    weeklyTxResult,
  ] = await Promise.all([
    // Today's transactions (income/expense totals)
    db
      .from("transactions")
      .select("type, amount, payment_method")
      .eq("business_id", BUSINESS_ID)
      .eq("transaction_date", today),

    // All income/expense transactions for cash & bank/online balance
    db
      .from("transactions")
      .select("type, amount, payment_method")
      .eq("business_id", BUSINESS_ID)
      .in("type", [
        "income",
        "expense",
        "customer_payment",
        "supplier_purchase",
        "supplier_payment",
      ]),

    // All transactions for receivables/payables computation
    db
      .from("transactions")
      .select(
        "id, type, party_id, amount, due_date, payment_method, transaction_date, created_at"
      )
      .eq("business_id", BUSINESS_ID)
      .in("type", [
        "customer_credit_sale",
        "customer_payment",
        "supplier_purchase",
        "supplier_payment",
      ]),

    // Active products for inventory value and low-stock
    db
      .from("products")
      .select(
        "id, name, sku, current_stock, min_stock, purchase_price, selling_price, supplier_id",
      )
      .eq("business_id", BUSINESS_ID)
      .eq("is_active", true),

    // 5 recent transactions
    db
      .from("transactions")
      .select(
        "id, type, party_id, amount, category, payment_method, description, due_date, transaction_date, created_at, parties(name)"
      )
      .eq("business_id", BUSINESS_ID)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),

    // Upcoming reminders: due_date >= today, positive amount
    db
      .from("transactions")
      .select(
        "id, type, party_id, amount, category, payment_method, description, due_date, transaction_date, created_at, parties(name)"
      )
      .eq("business_id", BUSINESS_ID)
      .gte("due_date", today)
      .gt("amount", 0)
      .order("due_date", { ascending: true })
      .limit(5),

    // All parties (for name lookup)
    db.from("parties").select("id, name, type").eq("business_id", BUSINESS_ID),

    // Weekly income/expense (past 7 days)
    db
      .from("transactions")
      .select("type, amount, payment_method, transaction_date")
      .eq("business_id", BUSINESS_ID)
      .gte("transaction_date", addDaysISO(today, -6))
      .in("type", [
        "income",
        "expense",
        "customer_payment",
        "supplier_purchase",
        "supplier_payment",
      ]),
  ]);

  const queryError = [
    todayTxResult.error,
    cashBankTxResult.error,
    allTxResult.error,
    productsResult.error,
    recentTxResult.error,
    remindersTxResult.error,
    partiesResult.error,
    weeklyTxResult.error,
  ].find(Boolean);
  if (queryError) throw new Error("Failed to load dashboard data.");

  // ── Today's income/expense ──────────────────────────────────────────────────
  let todayIncome = 0;
  let todayExpense = 0;
  let todayIncomeCount = 0;
  let cashBalance = 0;
  let bankOnlineBalance = 0;

  if (todayTxResult.data) {
    for (const tx of todayTxResult.data) {
      const flowType = cashFlowType(tx.type, tx.payment_method);
      if (!flowType) continue;

      const amt = Number(tx.amount) || 0;
      if (flowType === "income") {
        todayIncome += amt;
        todayIncomeCount++;
      } else {
        todayExpense += amt;
      }
    }
  }

  if (cashBankTxResult.data) {
    for (const tx of cashBankTxResult.data) {
      const flowType = cashFlowType(tx.type, tx.payment_method);
      if (!flowType) continue;

      const amt = Number(tx.amount) || 0;
      const sign = flowType === "income" ? 1 : -1;
      if (tx.payment_method === "cash") {
        cashBalance += sign * amt;
      } else if (["bank", "qr", "online"].includes(tx.payment_method ?? "")) {
        bankOnlineBalance += sign * amt;
      }
    }
  }

  const totalBalance = cashBalance + bankOnlineBalance;

  // ── Receivables / payables ─────────────────────────────────────────────────
  const partyMap = new Map<string, { name: string; type: string }>();
  if (partiesResult.data) {
    for (const p of partiesResult.data) {
      partyMap.set(p.id, { name: p.name, type: p.type });
    }
  }

  type Sale = {
    id: string;
    amount: number;
    due_date: string | null;
    transaction_date: string;
    created_at: string | null;
  };
  const customerNet = new Map<string, { sales: Sale[]; payments: number }>();
  const supplierNet = new Map<
    string,
    { payable: number; pastDueDates: string[] }
  >();

  for (const tx of allTxResult.data ?? []) {
    if (!tx.party_id) continue;
    const amt = Number(tx.amount) || 0;
    const party = partyMap.get(tx.party_id);
    if (!party) continue;

    if (party.type === "customer" || party.type === "both") {
      const current = customerNet.get(tx.party_id) ?? { sales: [], payments: 0 };
      if (tx.type === "customer_credit_sale") {
        current.sales.push({
          id: tx.id,
          amount: amt,
          due_date: tx.due_date,
          transaction_date: tx.transaction_date,
          created_at: tx.created_at,
        });
      } else if (tx.type === "customer_payment") {
        current.payments += amt;
      }
      customerNet.set(tx.party_id, current);
    }

    if (party.type === "supplier" || party.type === "both") {
      const current = supplierNet.get(tx.party_id) ?? {
        payable: 0,
        pastDueDates: [],
      };
      if (tx.type === "supplier_purchase" && tx.payment_method === "credit") {
        current.payable += amt;
        if (tx.due_date && tx.due_date < today) {
          current.pastDueDates.push(tx.due_date);
        }
      } else if (tx.type === "supplier_payment") {
        current.payable -= amt;
      }
      supplierNet.set(tx.party_id, current);
    }
  }

  const customerBalances: PartyBalance[] = [];
  let totalReceivables = 0;
  for (const [party_id, account] of customerNet.entries()) {
    const sortedSales = [...account.sales].sort((a, b) => {
      const dueA = a.due_date ?? "9999-12-31";
      const dueB = b.due_date ?? "9999-12-31";
      return dueA.localeCompare(dueB) ||
        a.transaction_date.localeCompare(b.transaction_date) ||
        (a.created_at ?? "").localeCompare(b.created_at ?? "") ||
        a.id.localeCompare(b.id);
    });
    let remainingPayments = account.payments;
    let overdueAmount = 0;
    let overdueDate: string | null = null;
    let nextDueDate: string | null = null;
    const totalCredit = sortedSales.reduce((sum, sale) => sum + sale.amount, 0);
    const balance = Math.max(0, Math.round((totalCredit - account.payments + Number.EPSILON) * 100) / 100);

    for (const sale of sortedSales) {
      const applied = Math.min(remainingPayments, sale.amount);
      remainingPayments = Math.max(0, remainingPayments - applied);
      const outstanding = Math.max(0, sale.amount - applied);
      if (outstanding <= 0 || !sale.due_date) continue;
      if (sale.due_date < today) {
        overdueAmount += outstanding;
        if (!overdueDate || sale.due_date < overdueDate) overdueDate = sale.due_date;
      } else if (!nextDueDate || sale.due_date < nextDueDate) {
        nextDueDate = sale.due_date;
      }
    }

    if (balance > 0) {
      totalReceivables += balance;
      customerBalances.push({
        party_id,
        party_name: partyMap.get(party_id)?.name ?? "Unknown",
        balance,
        due_date: overdueDate ?? nextDueDate,
        overdue_amount: overdueAmount,
      });
    }
  }

  const supplierBalances: PartyBalance[] = [];
  let totalPayables = 0;
  for (const [party_id, account] of supplierNet.entries()) {
    const balance = Math.max(0, Math.round((account.payable + Number.EPSILON) * 100) / 100);
    if (balance <= 0) continue;

    const pastDueDates = account.pastDueDates.sort();
    totalPayables += balance;
    supplierBalances.push({
      party_id,
      party_name: partyMap.get(party_id)?.name ?? "Unknown",
      balance,
      due_date: pastDueDates[0] ?? null,
      overdue_amount: pastDueDates.length > 0 ? balance : 0,
    });
  }

  customerBalances.sort((a, b) => b.balance - a.balance);
  supplierBalances.sort((a, b) => b.balance - a.balance);

  const overdueCustomers = customerBalances.filter(
    (party) => party.overdue_amount && party.overdue_amount > 0,
  );
  const overdueSuppliers = supplierBalances.filter(
    (party) => party.due_date && party.due_date < today,
  );

  // ── Inventory ─────────────────────────────────────────────────────────────
  let inventoryValue = 0;
  const lowStockProducts: LowStockProduct[] = [];

  if (productsResult.data) {
    for (const p of productsResult.data) {
      const stock = Number(p.current_stock) || 0;
      const price = Number(p.purchase_price) || 0;
      inventoryValue += stock * price;
      if (stock <= (Number(p.min_stock) || 0)) {
        lowStockProducts.push({
          id: p.id,
          name: p.name,
          current_stock: stock,
          min_stock: Number(p.min_stock) || 0,
          purchase_price: price,
          supplier_id: p.supplier_id,
        });
      }
    }
  }

  // ── Weekly chart ──────────────────────────────────────────────────────────
  const NP_DAYS = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];
  const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeklyMap = new Map<string, { income: number; expense: number }>();
  // Build 7 days ending today
  const weekDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const iso = addDaysISO(today, -i);
    weekDates.push(iso);
    weeklyMap.set(iso, { income: 0, expense: 0 });
  }

  if (weeklyTxResult.data) {
    for (const tx of weeklyTxResult.data) {
      const entry = weeklyMap.get(tx.transaction_date);
      if (!entry) continue;
      const flowType = cashFlowType(tx.type, tx.payment_method);
      if (!flowType) continue;

      const amt = Number(tx.amount) || 0;
      if (flowType === "income") {
        entry.income += amt;
      } else {
        entry.expense += amt;
      }
    }
  }

  const weeklyFlow: WeeklyDay[] = weekDates.map((date) => {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const entry = weeklyMap.get(date)!;
    return {
      label: EN_DAYS[dow],
      labelNp: NP_DAYS[dow],
      date,
      income: entry.income,
      expense: entry.expense,
      isToday: date === today,
    };
  });

  return {
    today,
    todayIncome,
    todayExpense,
    todayIncomeCount,
    cashBalance,
    bankOnlineBalance,
    totalBalance,
    totalReceivables,
    totalPayables,
    customerBalances,
    supplierBalances,
    inventoryValue,
    lowStockCount: lowStockProducts.length,
    overdueCustomerCount: overdueCustomers.length,
    overdueSupplierCount: overdueSuppliers.length,
    recentTransactions: (recentTxResult.data as unknown as Transaction[]) ?? [],
    upcomingReminders: (remindersTxResult.data as unknown as Transaction[]) ?? [],
    lowStockProducts,
    overdueCustomers,
    overdueSuppliers,
    suppliers: (partiesResult.data ?? [])
      .filter((party) => party.type === "supplier" || party.type === "both")
      .map((party) => ({ id: party.id, name: party.name })),
    saleProducts: (productsResult.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      current_stock: Number(product.current_stock),
      purchase_price: Number(product.purchase_price),
      selling_price: Number(product.selling_price),
    })),
    saleCustomers: (partiesResult.data ?? [])
      .filter((party) => party.type === "customer" || party.type === "both")
      .map((party) => ({ id: party.id, name: party.name })),
    weeklyFlow,
  };
}
