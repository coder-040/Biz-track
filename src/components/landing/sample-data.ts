/** Fictional figures for marketing previews. Not live business data. */
export const DEMO_BUSINESS = "Himalayan Corner Shop";
export const DEMO_LABEL = "Fictional demonstration data";

export const demoTotals = {
  moneyIn: "Rs. 4,28,500.00",
  moneyOut: "Rs. 1,86,240.00",
  inventoryValue: "Rs. 3,12,450.00",
  net: "Rs. 2,42,260.00",
};

export const demoActivity = [
  { day: "Mon", moneyIn: 62, moneyOut: 34 },
  { day: "Tue", moneyIn: 48, moneyOut: 52 },
  { day: "Wed", moneyIn: 74, moneyOut: 28 },
  { day: "Thu", moneyIn: 55, moneyOut: 41 },
  { day: "Fri", moneyIn: 88, moneyOut: 46 },
  { day: "Sat", moneyIn: 96, moneyOut: 38 },
  { day: "Sun", moneyIn: 42, moneyOut: 22 },
];

export const demoTransactions = [
  {
    name: "Counter sale",
    detail: "Basmati rice · 10 kg",
    amount: "+ Rs. 2,450.00",
    direction: "in" as const,
    when: "Today",
  },
  {
    name: "Supplier payment",
    detail: "Himal Tea Traders",
    amount: "− Rs. 8,600.00",
    direction: "out" as const,
    when: "Yesterday",
  },
  {
    name: "Counter sale",
    detail: "Mustard oil · 4 L",
    amount: "+ Rs. 1,180.00",
    direction: "in" as const,
    when: "Yesterday",
  },
  {
    name: "Stock purchase",
    detail: "Sugar · 20 kg",
    amount: "− Rs. 3,200.00",
    direction: "out" as const,
    when: "12 Nov",
  },
  {
    name: "Counter sale",
    detail: "Black tea · 6 packs",
    amount: "+ Rs. 960.00",
    direction: "in" as const,
    when: "11 Nov",
  },
];

export const demoStock = [
  { name: "Basmati rice", qty: "42 kg", value: "Rs. 8,820.00", tone: "ok" as const },
  { name: "Mustard oil", qty: "18 L", value: "Rs. 5,310.00", tone: "ok" as const },
  { name: "Sugar", qty: "64 kg", value: "Rs. 6,400.00", tone: "ok" as const },
  { name: "Black tea", qty: "9 packs", value: "Rs. 1,440.00", tone: "low" as const },
];
