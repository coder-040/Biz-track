"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { useBusinessContext } from "@/components/auth/business-context";
import { can } from "@/lib/auth/permissions";
import { supabase } from "@/lib/supabase/client";
import { writeAudit } from "@/lib/transactions/audit";
import {
  addDaysISO,
  isISODate,
  monthStartISO,
  todayISO,
} from "@/lib/transactions/date";
import {
  filtersToQuery,
  isPaymentMethod,
} from "@/lib/transactions/filters";
import { formatCurrency } from "@/lib/transactions/format";
import {
  PAYMENT_METHODS,
  type AuditEntry,
  type PaymentMethod,
  type Role,
  type TransactionFilters,
  type TransactionRow,
  type TransactionType,
  type Totals,
} from "@/lib/transactions/types";

const PAGE_SIZE = 20;

const TRANSACTION_COLUMNS = [
  "id",
  "business_id",
  "type",
  "amount",
  "category",
  "payment_method",
  "description",
  "transaction_date",
  "attachment_url",
  "created_at",
  "party_id",
  "due_date",
].join(", ");

const controlClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass =
  "min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const labelClass = "block text-sm font-medium";

interface FormState {
  type: TransactionType;
  amount: string;
  transaction_date: string;
  category: string;
  payment_method: PaymentMethod;
  description: string;
  attachment_url: string;
}

interface TransactionsClientProps {
  initialRows: TransactionRow[];
  totals: Totals;
  role: Role;
  initialFilters: TransactionFilters;
}

function emptyForm(): FormState {
  return {
    type: "income",
    amount: "",
    transaction_date: todayISO(),
    category: "",
    payment_method: "cash",
    description: "",
    attachment_url: "",
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Something went wrong.";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateForm(form: FormState): string | null {
  const amountText = form.amount.trim();
  const amount = Number(amountText);
  if (
    !/^\d+(\.\d{1,2})?$/.test(amountText) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return "Amount must be greater than zero with at most 2 decimal places.";
  }
  if (amount > 9_999_999_999.99) {
    return "Amount is too large for this ledger.";
  }
  if (!isISODate(form.transaction_date)) {
    return "Enter a valid transaction date.";
  }
  if (form.transaction_date > todayISO()) {
    return "Future transaction dates are not allowed.";
  }
  if (!form.category.trim()) {
    return "Category is required.";
  }
  if (!isPaymentMethod(form.payment_method)) {
    return "Choose a valid payment method.";
  }
  if (form.attachment_url.trim() && !isHttpUrl(form.attachment_url.trim())) {
    return "Attachment must be a valid http(s) URL.";
  }
  return null;
}

function buildPayload(form: FormState) {
  return {
    type: form.type,
    amount: Number(form.amount),
    transaction_date: form.transaction_date,
    category: form.category.trim(),
    payment_method: form.payment_method,
    description: form.description.trim() || null,
    attachment_url: form.attachment_url.trim() || null,
  };
}

export function TransactionsClient({
  initialRows,
  totals,
  role,
  initialFilters,
}: TransactionsClientProps) {
  const router = useRouter();
  const { context } = useBusinessContext();
  const businessId = context?.activeBusinessId;
  const actorId = context?.user.id;
  const actorName = context?.user.fullName || context?.user.email || null;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState(initialRows);
  const [filters, setFilters] = useState(initialFilters);
  const [filtering, setFiltering] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const filterRequest = useRef(0);
  const [serverSnapshot, setServerSnapshot] = useState({
    rows: initialRows,
    filters: initialFilters,
  });
  const [pendingAudit, setPendingAudit] = useState<AuditEntry | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    filterRequest.current += 1;
  }, [initialFilters, initialRows]);

  if (
    serverSnapshot.rows !== initialRows ||
    serverSnapshot.filters !== initialFilters
  ) {
    setServerSnapshot({ rows: initialRows, filters: initialFilters });
    setRows(initialRows);
    setFilters(initialFilters);
    setFiltering(false);
    setFilterError(null);
  }

  const canManage = Boolean(
    context?.activeRole &&
      context.activeRole === role &&
      can(context.activeRole, "manage_finances", context.activePermissions),
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const visibleRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function recordAudit(
    entry: Omit<AuditEntry, "businessId" | "actorId" | "actorName">,
  ) {
    if (!businessId || !actorId) {
      throw new Error("Business account context is not ready.");
    }
    const fullEntry: AuditEntry = {
      ...entry,
      businessId,
      actorId,
      actorName,
    };

    try {
      await writeAudit(fullEntry);
      setPendingAudit(null);
    } catch (auditError) {
      setPendingAudit(fullEntry);
      toast.error(
        `Saved, but audit logging failed: ${errorMessage(auditError)}.`,
        {
          action: {
            label: "Retry audit",
            onClick: () => void retryAudit(),
          },
        },
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!canManage || !businessId) {
      toast.error("You do not have permission to manage financial records.");
      return;
    }

    setBusy(true);
    try {
      const payload = { ...buildPayload(form), business_id: businessId };

      if (editingId) {
        const before = initialRows.find((row) => row.id === editingId) ?? null;
        const { data, error: dbError } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingId)
          .eq("business_id", businessId)
          .select(TRANSACTION_COLUMNS)
          .single();

        if (dbError) throw dbError;

        await recordAudit({
          entityType: "transaction",
          entityId: editingId,
          action: "update",
          changes: { before, after: data as unknown as TransactionRow },
        });
        toast.success("Transaction updated.");
      } else {
        const { data, error: dbError } = await supabase
          .from("transactions")
          .insert(payload)
          .select(TRANSACTION_COLUMNS)
          .single();

        if (dbError) throw dbError;

        await recordAudit({
          entityType: "transaction",
          entityId: (data as unknown as TransactionRow).id,
          action: "insert",
          changes: { before: null, after: data as unknown as TransactionRow },
        });
        toast.success("Transaction saved.");
      }

      setEditingId(null);
      setForm(emptyForm());
      router.refresh();
    } catch (submitError) {
      toast.error(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: TransactionRow) {
    if (!canManage) return;
    if (!window.confirm("Delete this transaction? This cannot be undone.")) {
      return;
    }

    setBusy(true);

    try {
      const { error: dbError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", row.id)
        .eq("business_id", businessId);

      if (dbError) throw dbError;

      await recordAudit({
        entityType: "transaction",
        entityId: row.id,
        action: "delete",
        changes: { before: row, after: null },
      });
      toast.success("Transaction deleted.");
      router.refresh();
    } catch (deleteError) {
      toast.error(errorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  }

  async function retryAudit() {
    if (!pendingAudit) return;
    setBusy(true);
    try {
      await writeAudit(pendingAudit);
      setPendingAudit(null);
      toast.success("Audit entry recorded.");
    } catch (auditError) {
      toast.error(`Audit retry failed: ${errorMessage(auditError)}`, {
        action: {
          label: "Retry audit",
          onClick: () => void retryAudit(),
        },
      });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(row: TransactionRow) {
    setEditingId(row.id);
    setForm({
      type: row.type === "expense" ? "expense" : "income",
      amount: String(row.amount),
      transaction_date: row.transaction_date,
      category: row.category,
      payment_method: isPaymentMethod(row.payment_method)
        ? row.payment_method
        : "cash",
      description: row.description ?? "",
      attachment_url: row.attachment_url ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function loadFilteredRows(next: TransactionFilters) {
    if (!businessId) {
      setFilterError("Business account context is not ready.");
      setFiltering(false);
      return;
    }
    const requestId = ++filterRequest.current;
    setFiltering(true);
    setFilterError(null);

    try {
      let query = supabase
        .from("transactions")
        .select(TRANSACTION_COLUMNS)
        .eq("business_id", businessId)
        .in("type", ["income", "expense"]);

      if (next.from) query = query.gte("transaction_date", next.from);
      if (next.to) query = query.lte("transaction_date", next.to);
      if (next.category) query = query.eq("category", next.category);
      if (next.method) query = query.eq("payment_method", next.method);

      const { data, error: queryError } = await query
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      if (requestId !== filterRequest.current) return;
      setRows((data ?? []) as unknown as TransactionRow[]);
    } catch (error) {
      if (requestId !== filterRequest.current) return;
      const message = errorMessage(error);
      setFilterError(`Could not update transactions: ${message}`);
      toast.error(`Could not update transactions: ${message}`);
    } finally {
      if (requestId === filterRequest.current) setFiltering(false);
    }
  }

  function updateFilters(patch: Partial<TransactionFilters>) {
    const next: TransactionFilters = {
      ...filters,
      ...patch,
      page: patch.page ?? 1,
    };
    const query = filtersToQuery(next);
    window.history.replaceState(
      null,
      "",
      query ? `/transactions?${query}` : "/transactions",
    );
    setFilters(next);

    const filtersChanged = [
      "from",
      "to",
      "category",
      "method",
    ].some((key) => key in patch);
    if (filtersChanged) void loadFilteredRows(next);
  }

  function applyPreset(preset: "today" | "week" | "month") {
    const today = todayISO();
    if (preset === "today") {
      updateFilters({ from: today, to: today });
    } else if (preset === "week") {
      updateFilters({ from: addDaysISO(today, -6), to: today });
    } else {
      updateFilters({ from: monthStartISO(today), to: today });
    }
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    updateFilters({ page: nextPage });
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="totals-heading">
        <Card>
          <CardHeader>
            <CardTitle id="totals-heading">Today &amp; balances</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">Income today</dt>
                <dd className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(totals.todayIncome)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Expenses today</dt>
                <dd className="text-lg font-semibold text-destructive">
                  {formatCurrency(totals.todayExpense)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Cash balance</dt>
                <dd className="text-lg font-semibold">
                  {formatCurrency(totals.cash)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Bank / online balance
                </dt>
                <dd className="text-lg font-semibold">
                  {formatCurrency(totals.bankOnline)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Balances are cumulative across all dates and ignore list filters.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit transaction" : "New transaction"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="transaction-type">
                Type <RequiredMark />
              </label>
              <select
                id="transaction-type"
                className={controlClass}
                value={form.type}
                onChange={(event) =>
                  updateField("type", event.target.value as TransactionType)
                }
                disabled={busy}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-amount">
                Amount <RequiredMark />
              </label>
              <Input
                id="transaction-amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                placeholder="0.00"
                disabled={busy}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-date">
                Date <RequiredMark />
              </label>
              <Input
                id="transaction-date"
                type="date"
                max={todayISO()}
                value={form.transaction_date}
                onChange={(event) =>
                  updateField("transaction_date", event.target.value)
                }
                disabled={busy}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-category">
                Category <RequiredMark />
              </label>
              <Input
                id="transaction-category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="e.g. Stationery, Rent, Sales"
                disabled={busy}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-method">
                Payment method <RequiredMark />
              </label>
              <select
                id="transaction-method"
                className={controlClass}
                value={form.payment_method}
                onChange={(event) =>
                  updateField(
                    "payment_method",
                    event.target.value as PaymentMethod,
                  )
                }
                disabled={busy}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-attachment">
                Bill URL (optional)
              </label>
              <Input
                id="transaction-attachment"
                type="url"
                value={form.attachment_url}
                onChange={(event) =>
                  updateField("attachment_url", event.target.value)
                }
                placeholder="https://..."
                disabled={busy}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="transaction-description">
                Description (optional)
              </label>
              <textarea
                id="transaction-description"
                className={textareaClass}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Optional note"
                disabled={busy}
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy || !canManage}>
                {busy
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add transaction"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={busy}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          {filterError ? (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {filterError}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelClass} htmlFor="filter-from">
                From
              </label>
              <Input
                id="filter-from"
                type="date"
                value={filters.from ?? ""}
                onChange={(event) =>
                  updateFilters({ from: event.target.value || null })
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="filter-to">
                To
              </label>
              <Input
                id="filter-to"
                type="date"
                value={filters.to ?? ""}
                onChange={(event) =>
                  updateFilters({ to: event.target.value || null })
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="filter-category">
                Category
              </label>
              <Input
                id="filter-category"
                value={filters.category ?? ""}
                onChange={(event) =>
                  updateFilters({ category: event.target.value.trim() || null })
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="filter-method">
                Method
              </label>
              <select
                id="filter-method"
                className={controlClass}
                value={filters.method ?? ""}
                onChange={(event) =>
                  updateFilters({
                    method: isPaymentMethod(event.target.value)
                      ? event.target.value
                      : null,
                  })
                }
              >
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  updateFilters({
                    from: null,
                    to: null,
                    category: null,
                    method: null,
                  })
                }
              >
                Clear filters
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => applyPreset("today")}>
              Today
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => applyPreset("week")}>
              Last 7 days
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => applyPreset("month")}>
              This month
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Transactions
            {filtering ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground" aria-live="polite">
                Updating…
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <Card size="sm" className="border border-dashed ring-0">
              <CardContent className="text-sm text-muted-foreground">
                No transactions match the current filters. Add one above or clear
                the filters.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="py-2 pr-4">Date</th>
                      <th scope="col" className="py-2 pr-4">Type</th>
                      <th scope="col" className="py-2 pr-4">Category</th>
                      <th scope="col" className="py-2 pr-4">Details</th>
                      <th scope="col" className="py-2 pr-4">Method</th>
                      <th scope="col" className="py-2 pr-4 text-right">Amount</th>
                      <th scope="col" className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {row.transaction_date}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant={
                              row.type === "income" ? "secondary" : "outline"
                            }
                          >
                            {row.type}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">{row.category}</td>
                        <td className="py-2 pr-4">
                          <span className="block max-w-48 truncate text-muted-foreground">
                            {row.description || "—"}
                          </span>
                          {row.attachment_url && isHttpUrl(row.attachment_url) ? (
                            <a
                              href={row.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline"
                            >
                              Bill
                            </a>
                          ) : null}
                        </td>
                        <td className="py-2 pr-4 uppercase">
                          {row.payment_method ?? "—"}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right font-medium whitespace-nowrap ${
                            row.type === "income"
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        >
                          {row.type === "income" ? "+" : "-"}
                          {formatCurrency(Number(row.amount))}
                        </td>
                        <td className="py-2 pr-4">
                          {canManage ? (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() => startEdit(row)}
                                disabled={busy}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="destructive"
                                onClick={() => handleDelete(row)}
                                disabled={busy}
                              >
                                Delete
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} · {rows.length}{" "}
                  transactions
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
