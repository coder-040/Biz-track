import { BUSINESS_ID } from "@/lib/config";
import { addDaysISO, todayISO } from "@/lib/credit/date";
import {
  CREDIT_SALE_TYPE,
  CUSTOMER_PAYMENT_TYPE,
  type CreatePartyInput,
  type CreditTransaction,
  type CreditTransactionInsert,
  type Party,
} from "@/lib/credit/types";

interface DemoState {
  parties: Party[];
  transactions: CreditTransaction[];
}

const STORE_KEY = "__biztrackCreditDemoStoreV1" as const;

type DemoGlobal = typeof globalThis & {
  [STORE_KEY]?: DemoState;
};

function createdAt(dateISO: string, time: string): string {
  return `${dateISO}T${time}.000Z`;
}

function seedStore(): DemoState {
  const today = todayISO();

  const sita: Party = {
    id: crypto.randomUUID(),
    business_id: BUSINESS_ID,
    name: "Sita Sharma",
    phone: "9800000001",
    type: "customer",
    address: "Baneshwor, Kathmandu",
    created_at: createdAt(addDaysISO(today, -120), "09:00:00"),
  };

  const ram: Party = {
    id: crypto.randomUUID(),
    business_id: BUSINESS_ID,
    name: "Ram Thapa",
    phone: "9800000002",
    type: "both",
    address: "Lakeside, Pokhara",
    created_at: createdAt(addDaysISO(today, -90), "09:00:00"),
  };

  const gita: Party = {
    id: crypto.randomUUID(),
    business_id: BUSINESS_ID,
    name: "Gita Gurung",
    phone: "9800000003",
    type: "customer",
    address: "Bhaktapur",
    created_at: createdAt(addDaysISO(today, -60), "09:00:00"),
  };

  const bikash: Party = {
    id: crypto.randomUUID(),
    business_id: BUSINESS_ID,
    name: "Bikash Karki",
    phone: "9800000004",
    type: "customer",
    address: "Lalitpur",
    created_at: createdAt(addDaysISO(today, -45), "09:00:00"),
  };

  const transactions: CreditTransaction[] = [
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CREDIT_SALE_TYPE,
      party_id: sita.id,
      amount: 5000,
      category: "Groceries",
      payment_method: "credit",
      description: "Monthly grocery order",
      due_date: addDaysISO(today, -15),
      transaction_date: addDaysISO(today, -45),
      created_at: createdAt(addDaysISO(today, -45), "09:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CUSTOMER_PAYMENT_TYPE,
      party_id: sita.id,
      amount: 2000,
      category: "Customer payment",
      payment_method: "cash",
      description: "Part payment",
      due_date: null,
      transaction_date: addDaysISO(today, -5),
      created_at: createdAt(addDaysISO(today, -5), "10:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CREDIT_SALE_TYPE,
      party_id: ram.id,
      amount: 4000,
      category: "Dairy supply",
      payment_method: "credit",
      description: "Weekly dairy delivery",
      due_date: addDaysISO(today, 10),
      transaction_date: addDaysISO(today, -10),
      created_at: createdAt(addDaysISO(today, -10), "09:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CUSTOMER_PAYMENT_TYPE,
      party_id: ram.id,
      amount: 1000,
      category: "Customer payment",
      payment_method: "bank",
      description: "Bank transfer",
      due_date: null,
      transaction_date: addDaysISO(today, -3),
      created_at: createdAt(addDaysISO(today, -3), "11:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CREDIT_SALE_TYPE,
      party_id: gita.id,
      amount: 2500,
      category: "Snacks",
      payment_method: "credit",
      description: "Festival order",
      due_date: addDaysISO(today, -20),
      transaction_date: addDaysISO(today, -40),
      created_at: createdAt(addDaysISO(today, -40), "09:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CUSTOMER_PAYMENT_TYPE,
      party_id: gita.id,
      amount: 2500,
      category: "Customer payment",
      payment_method: "qr",
      description: "Settled in full",
      due_date: null,
      transaction_date: addDaysISO(today, -2),
      created_at: createdAt(addDaysISO(today, -2), "12:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CREDIT_SALE_TYPE,
      party_id: bikash.id,
      amount: 2000,
      category: "Vegetables",
      payment_method: "credit",
      description: "First delivery",
      due_date: addDaysISO(today, -30),
      transaction_date: addDaysISO(today, -50),
      created_at: createdAt(addDaysISO(today, -50), "09:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CREDIT_SALE_TYPE,
      party_id: bikash.id,
      amount: 3000,
      category: "Rice",
      payment_method: "credit",
      description: "Second delivery",
      due_date: addDaysISO(today, 5),
      transaction_date: addDaysISO(today, -20),
      created_at: createdAt(addDaysISO(today, -20), "09:00:00"),
    },
    {
      id: crypto.randomUUID(),
      business_id: BUSINESS_ID,
      type: CUSTOMER_PAYMENT_TYPE,
      party_id: bikash.id,
      amount: 2500,
      category: "Customer payment",
      payment_method: "cash",
      description: "Part payment",
      due_date: null,
      transaction_date: addDaysISO(today, -10),
      created_at: createdAt(addDaysISO(today, -10), "10:00:00"),
    },
  ];

  return {
    parties: [sita, ram, gita, bikash],
    transactions,
  };
}

function getStore(): DemoState {
  const globalStore = globalThis as DemoGlobal;

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = seedStore();
  }

  return globalStore[STORE_KEY];
}

export function listDemoParties(): Party[] {
  return [...getStore().parties];
}

export function getDemoParty(id: string): Party | null {
  return getStore().parties.find((party) => party.id === id) ?? null;
}

export function listDemoTransactions(): CreditTransaction[] {
  return [...getStore().transactions];
}

export function listDemoTransactionsForParty(
  partyId: string,
): CreditTransaction[] {
  return getStore().transactions.filter(
    (transaction) => transaction.party_id === partyId,
  );
}

export function insertDemoParty(input: CreatePartyInput): Party {
  const store = getStore();
  const party: Party = {
    id: crypto.randomUUID(),
    business_id: BUSINESS_ID,
    name: input.name,
    phone: input.phone,
    type: input.type,
    address: input.address,
    created_at: new Date().toISOString(),
  };

  store.parties.push(party);
  return party;
}

export function insertDemoTransaction(
  input: CreditTransactionInsert,
): CreditTransaction {
  const store = getStore();
  const transaction: CreditTransaction = {
    id: crypto.randomUUID(),
    business_id: BUSINESS_ID,
    type: input.type,
    party_id: input.party_id,
    amount: input.amount,
    category: input.category,
    payment_method: input.payment_method,
    description: input.description,
    due_date: input.due_date,
    transaction_date: input.transaction_date,
    created_at: new Date().toISOString(),
  };

  store.transactions.push(transaction);
  return transaction;
}
