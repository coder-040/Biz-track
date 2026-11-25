const amountFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCurrency(value: number): string {
  return `Rs. ${amountFormatter.format(value)}`;
}

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
