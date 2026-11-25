const amountFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Format a number with Indian-style comma grouping.
 * e.g. 123456 → "Rs 1,23,456"
 */
export function formatNPR(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const str = String(abs);
  let result = "";
  if (str.length <= 3) {
    result = str;
  } else {
    const last3 = str.slice(-3);
    const rest = str.slice(0, -3);
    const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    result = withCommas + "," + last3;
  }
  return (amount < 0 ? "-" : "") + "Rs " + result;
}

export function formatCurrency(value: number): string {
  return `Rs. ${amountFormatter.format(value)}`;
}

export function formatQuantity(value: number): string {
  return quantityFormatter.format(value);
}

export function formatMovementDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Format a date string (YYYY-MM-DD) as "25 Nov 2026".
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (Number.isNaN(date.getTime())) return value;

  return dateFormatter.format(date);
}

/**
 * Returns "X days overdue" or "Due in X days" or "Due today".
 */
export function relativeDue(dueDateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + "T00:00:00");
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) return "Due today";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `Due in ${diffDays}d`;
}

export function formatPaymentMethod(value: string | null | undefined): string {
  if (!value) return "—";
  if (value === "qr") return "QR";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPartyType(value: string): string {
  if (value === "both") return "Customer & supplier";
  if (value === "supplier") return "Supplier";
  return "Customer";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
