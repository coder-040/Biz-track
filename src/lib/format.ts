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

/**
 * Format a date string (YYYY-MM-DD) as "25 Nov 2026".
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
