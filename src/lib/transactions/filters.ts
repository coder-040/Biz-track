import { isISODate } from "@/lib/transactions/date";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type TransactionFilters,
} from "@/lib/transactions/types";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTransactionFilters(
  params: Record<string, SearchParamValue>,
): TransactionFilters {
  const fromValue = firstValue(params.from);
  const toValue = firstValue(params.to);
  const categoryValue = firstValue(params.category)?.trim();
  const methodValue = firstValue(params.method);
  const pageValue = firstValue(params.page);
  const parsedPage = pageValue ? Number.parseInt(pageValue, 10) : 1;

  const method = PAYMENT_METHODS.find((candidate) => candidate === methodValue);

  return {
    from: isISODate(fromValue) ? fromValue : null,
    to: isISODate(toValue) ? toValue : null,
    category: categoryValue ? categoryValue : null,
    method: method ?? null,
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}

export function filtersToQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();

  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.category) params.set("category", filters.category);
  if (filters.method) params.set("method", filters.method);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params.toString();
}

export function isPaymentMethod(value: string | null): value is PaymentMethod {
  return value !== null && (PAYMENT_METHODS as readonly string[]).includes(value);
}
