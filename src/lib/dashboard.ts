import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";

// Server-side client using env vars (safe for server components)
function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Transaction = {
  id: string;
  type: "income" | "expense";
  party_id: string | null;
  amount: number;
  category: string;
  payment_method: "cash" | "bank" | "qr" | "online";
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
};

export type LowStockProduct = {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  purchase_price: number;
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
  // Weekly chart
  weeklyFlow: WeeklyDay[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  // Use Nepal timezone offset (+05:45)
  const now = new Date();
  const nepalOffset = 5 * 60 + 45; // minutes
  const utcMinutes = now.getTime() / 60000 + now.getTimezoneOffset();
  const nepalDate = new Date((utcMinutes + nepalOffset) * 60000);
  return nepalDate.toISOString().slice(0, 10);
}

// ─── Main data fetch ──────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  await connection();
  const db = getServerClient();
  const today = todayISO();

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
      .select("type, amount")
      .eq("transaction_date", today),

    // All income/expense transactions for cash & bank/online balance
    db
      .from("transactions")
      .select("type, amount, payment_method")
      .in("type", ["income", "expense"]),

    // All transactions for receivables/payables computation
    db
      .from("transactions")
      .select(
        "type, party_id, amount, due_date, payment_method"
      )
      .in("type", [
        "customer_credit_sale",
        "customer_payment",
        "supplier_purchase",
        "supplier_payment",
      ]),

    // Active products for inventory value and low-stock
    db
      .from("products")
      .select("id, name, current_stock, min_stock, purchase_price")
      .eq("is_active", true),

    // 5 recent transactions
    db
      .from("transactions")
      .select(
        "id, type, party_id, amount, category, payment_method, description, due_date, transaction_date, created_at, parties(name)"
      )
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),

    // Upcoming reminders: due_date >= today, positive amount
    db
      .from("transactions")
      .select(
        "id, type, party_id, amount, category, payment_method, description, due_date, transaction_date, created_at, parties(name)"
      )
      .gte("due_date", today)
      .gt("amount", 0)
      .order("due_date", { ascending: true })
      .limit(5),

    // All parties (for name lookup)
    db.from("parties").select("id, name, type"),

    // Weekly income/expense (past 7 days)
    db
      .from("transactions")
      .select("type, amount, transaction_date")
      .gte("transaction_date", (() => {
        const d = new Date(today + "T00:00:00");
        d.setDate(d.getDate() - 6);
        return d.toISOString().slice(0, 10);
      })())
      .in("type", ["income", "expense"]),
  ]);

  // ── Today's income/expense ──────────────────────────────────────────────────
  let todayIncome = 0;
  let todayExpense = 0;
  let todayIncomeCount = 0;
  let cashBalance = 0;
  let bankOnlineBalance = 0;

  if (todayTxResult.data) {
    for (const tx of todayTxResult.data) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        todayIncome += amt;
        todayIncomeCount++;
      } else if (tx.type === "expense") {
        todayExpense += amt;
      }
    }
  }

  if (cashBankTxResult.data) {
    for (const tx of cashBankTxResult.data) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        if (tx.payment_method === "cash") cashBalance += amt;
        else bankOnlineBalance += amt;
      } else if (tx.type === "expense") {
        if (tx.payment_method === "cash") cashBalance -= amt;
        else bankOnlineBalance -= amt;
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

  const customerNet = new Map<string, { balance: number; due_date: string | null }>();
  const supplierNet = new Map<string, { balance: number; due_date: string | null }>();

  if (allTxResult.data) {
    for (const tx of allTxResult.data) {
      if (!tx.party_id) continue;
      const amt = Number(tx.amount) || 0;
      const party = partyMap.get(tx.party_id);
      if (!party) continue;

      if (party.type === "customer") {
        const cur = customerNet.get(tx.party_id) ?? { balance: 0, due_date: null };
        if (tx.type === "customer_credit_sale") {
          cur.balance += amt;
          if (tx.due_date && (!cur.due_date || tx.due_date < cur.due_date)) {
            cur.due_date = tx.due_date;
          }
        } else if (tx.type === "customer_payment") {
          cur.balance -= amt;
        }
        customerNet.set(tx.party_id, cur);
      } else if (party.type === "supplier") {
        const cur = supplierNet.get(tx.party_id) ?? { balance: 0, due_date: null };
        if (tx.type === "supplier_purchase") {
          cur.balance += amt;
          if (tx.due_date && (!cur.due_date || tx.due_date < cur.due_date)) {
            cur.due_date = tx.due_date;
          }
        } else if (tx.type === "supplier_payment") {
          cur.balance -= amt;
        }
        supplierNet.set(tx.party_id, cur);
      }
    }
  }

  const customerBalances: PartyBalance[] = [];
  let totalReceivables = 0;
  for (const [party_id, { balance, due_date }] of customerNet.entries()) {
    if (balance > 0) {
      totalReceivables += balance;
      customerBalances.push({
        party_id,
        party_name: partyMap.get(party_id)?.name ?? "Unknown",
        balance,
        due_date,
      });
    }
  }

  const supplierBalances: PartyBalance[] = [];
  let totalPayables = 0;
  for (const [party_id, { balance, due_date }] of supplierNet.entries()) {
    if (balance > 0) {
      totalPayables += balance;
      supplierBalances.push({
        party_id,
        party_name: partyMap.get(party_id)?.name ?? "Unknown",
        balance,
        due_date,
      });
    }
  }

  // Sort by balance desc
  customerBalances.sort((a, b) => b.balance - a.balance);
  supplierBalances.sort((a, b) => b.balance - a.balance);

  // ── Overdue (past due_date) ────────────────────────────────────────────────
  const overdueCustomers = customerBalances.filter(
    (p) => p.due_date && p.due_date < today && p.balance > 0
  );
  const overdueSuppliers = supplierBalances.filter(
    (p) => p.due_date && p.due_date < today && p.balance > 0
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
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    weekDates.push(iso);
    weeklyMap.set(iso, { income: 0, expense: 0 });
  }

  if (weeklyTxResult.data) {
    for (const tx of weeklyTxResult.data) {
      const entry = weeklyMap.get(tx.transaction_date);
      if (!entry) continue;
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") entry.income += amt;
      else if (tx.type === "expense") entry.expense += amt;
    }
  }

  const weeklyFlow: WeeklyDay[] = weekDates.map((date) => {
    const dow = new Date(date + "T00:00:00").getDay();
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
    weeklyFlow,
  };
}
