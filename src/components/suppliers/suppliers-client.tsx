"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { writeAudit, type AuditEntry } from "@/lib/audit";
import { BUSINESS_ID } from "@/lib/config";
import { formatCurrency } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { todayISO } from "@/lib/date";
import {
  buildSummaries,
  payableFor,
  validateEntryForm,
  validateSupplierForm,
} from "@/lib/suppliers/calculate";
import {
  SUPPLIER_PAYMENT_METHODS,
  type EntryFormState,
  type PartyRow,
  type Role,
  type SupplierFormState,
  type SupplierPaymentMethod,
  type SupplierTransactionRow,
} from "@/lib/suppliers/types";

const PARTY_COLUMNS = "id, business_id, name, phone, type, address, created_at";
const TRANSACTION_COLUMNS =
  "id, business_id, type, party_id, amount, category, payment_method, " +
  "description, due_date, transaction_date, attachment_url, created_at";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const labelClass = "block text-sm font-medium";
const gridClass = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";

interface SuppliersClientProps {
  initialParties: PartyRow[];
  initialTransactions: SupplierTransactionRow[];
  role: Role;
}

function emptySupplierForm(): SupplierFormState {
  return { name: "", phone: "", address: "", type: "supplier" };
}

function emptyEntryForm(): EntryFormState {
  return {
    kind: "purchase",
    partyId: "",
    amount: "",
    category: "",
    paymentMethod: "credit",
    transactionDate: todayISO(),
    dueDate: "",
    description: "",
    attachmentUrl: "",
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

function isSupplierPaymentMethod(value: unknown): value is SupplierPaymentMethod {
  return (
    typeof value === "string" &&
    SUPPLIER_PAYMENT_METHODS.some((method) => method === value)
  );
}

export function SuppliersClient({
  initialParties,
  initialTransactions,
  role,
}: SuppliersClientProps) {
  const router = useRouter();
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [entryForm, setEntryForm] = useState<EntryFormState>(emptyEntryForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auditWarning, setAuditWarning] = useState<string | null>(null);
  const [pendingAudit, setPendingAudit] = useState<AuditEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage = role === "owner";
  const summaries = buildSummaries(initialParties, initialTransactions, todayISO());
  const overdueSummaries = summaries.filter((summary) => summary.overdue);
  const totalPayable = summaries.reduce((total, summary) => total + summary.payable, 0);

  const selectedPayable = entryForm.partyId
    ? payableFor(entryForm.partyId, initialTransactions, editingId ?? undefined)
    : 0;

  function clearStatus() {
    setMessage(null);
    setError(null);
    setAuditWarning(null);
  }

  function partyName(partyId: string | null): string {
    return initialParties.find((party) => party.id === partyId)?.name ?? "Unknown supplier";
  }

  function updateSupplierField<K extends keyof SupplierFormState>(
    field: K,
    value: SupplierFormState[K],
  ) {
    setSupplierForm((previous) => ({ ...previous, [field]: value }));
  }

  function updateEntryField<K extends keyof EntryFormState>(
    field: K,
    value: EntryFormState[K],
  ) {
    setEntryForm((previous) => ({ ...previous, [field]: value }));
  }

  async function recordAudit(entry: AuditEntry) {
    try {
      await writeAudit(entry);
      setPendingAudit(null);
      setAuditWarning(null);
    } catch (auditError) {
      setPendingAudit(entry);
      setAuditWarning(
        `Saved, but audit logging failed: ${errorMessage(auditError)}. You can retry below.`,
      );
    }
  }

  async function handleAddSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearStatus();

    const validationError = validateSupplierForm(supplierForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        business_id: BUSINESS_ID,
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim() || null,
        address: supplierForm.address.trim() || null,
        type: supplierForm.type,
      };

      const { data, error: dbError } = await supabase
        .from("parties")
        .insert(payload)
        .select(PARTY_COLUMNS)
        .single();

      if (dbError) throw dbError;

      const created = data as unknown as PartyRow;
      await recordAudit({
        entityType: "party",
        entityId: created.id,
        action: "insert",
        changes: { before: null, after: created },
      });

      setSupplierForm(emptySupplierForm());
      setMessage("Supplier added.");
      router.refresh();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSupplier(party: PartyRow) {
    if (!canManage) return;
    clearStatus();

    if (initialTransactions.some((tx) => tx.party_id === party.id)) {
      setError("Cannot delete a supplier with purchases or payments recorded.");
      return;
    }
    if (!window.confirm(`Delete ${party.name}? This cannot be undone.`)) return;

    setBusy(true);
    try {
      const { error: dbError } = await supabase
        .from("parties")
        .delete()
        .eq("id", party.id)
        .eq("business_id", BUSINESS_ID);

      if (dbError) throw dbError;

      await recordAudit({
        entityType: "party",
        entityId: party.id,
        action: "delete",
        changes: { before: party, after: null },
      });

      setMessage("Supplier deleted.");
      router.refresh();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  }

  async function handleEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearStatus();

    const validationError = validateEntryForm(
      entryForm,
      initialParties,
      initialTransactions,
      editingId,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      const isPurchase = entryForm.kind === "purchase";
      const payload = {
        business_id: BUSINESS_ID,
        type: isPurchase ? "supplier_purchase" : "supplier_payment",
        party_id: entryForm.partyId,
        amount: Number(entryForm.amount),
        category: entryForm.category.trim(),
        payment_method: isPurchase ? "credit" : entryForm.paymentMethod,
        transaction_date: entryForm.transactionDate,
        due_date: isPurchase ? entryForm.dueDate : null,
        description: entryForm.description.trim() || null,
        attachment_url: entryForm.attachmentUrl.trim() || null,
      };

      if (editingId) {
        const before =
          initialTransactions.find((tx) => tx.id === editingId) ?? null;
        const { data, error: dbError } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingId)
          .eq("business_id", BUSINESS_ID)
          .select(TRANSACTION_COLUMNS)
          .single();

        if (dbError) throw dbError;

        await recordAudit({
          entityType: "transaction",
          entityId: editingId,
          action: "update",
          changes: { before, after: data as unknown as SupplierTransactionRow },
        });
        setMessage("Supplier transaction updated.");
      } else {
        const { data, error: dbError } = await supabase
          .from("transactions")
          .insert(payload)
          .select(TRANSACTION_COLUMNS)
          .single();

        if (dbError) throw dbError;

        const created = data as unknown as SupplierTransactionRow;
        await recordAudit({
          entityType: "transaction",
          entityId: created.id,
          action: "insert",
          changes: { before: null, after: created },
        });
        setMessage(isPurchase ? "Purchase recorded." : "Payment recorded.");
      }

      setEditingId(null);
      setEntryForm(emptyEntryForm());
      router.refresh();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(tx: SupplierTransactionRow) {
    if (!canManage) return;
    clearStatus();
    setEditingId(tx.id);
    setEntryForm({
      kind: tx.type === "supplier_purchase" ? "purchase" : "payment",
      partyId: tx.party_id ?? "",
      amount: String(tx.amount),
      category: tx.category,
      paymentMethod:
        tx.type === "supplier_purchase"
          ? "credit"
          : isSupplierPaymentMethod(tx.payment_method)
            ? tx.payment_method
            : "cash",
      transactionDate: tx.transaction_date,
      dueDate: tx.due_date ?? "",
      description: tx.description ?? "",
      attachmentUrl: tx.attachment_url ?? "",
    });
  }

  async function handleDeleteEntry(tx: SupplierTransactionRow) {
    if (!canManage) return;
    clearStatus();
    if (!window.confirm("Delete this supplier transaction? This cannot be undone.")) {
      return;
    }

    setBusy(true);
    try {
      const { error: dbError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", tx.id)
        .eq("business_id", BUSINESS_ID);

      if (dbError) throw dbError;

      await recordAudit({
        entityType: "transaction",
        entityId: tx.id,
        action: "delete",
        changes: { before: tx, after: null },
      });

      if (editingId === tx.id) {
        setEditingId(null);
        setEntryForm(emptyEntryForm());
      }
      setMessage("Supplier transaction deleted.");
      router.refresh();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
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
      setAuditWarning(null);
      setMessage("Audit entry recorded.");
    } catch (auditError) {
      setAuditWarning(`Audit retry failed: ${errorMessage(auditError)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {auditWarning && (
        <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          <p>{auditWarning}</p>
          <Button type="button" size="sm" variant="link" onClick={retryAudit} disabled={busy}>
            Retry audit entry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suppliers and payables</CardTitle>
          <CardDescription>
            Total payable {formatCurrency(totalPayable)} · {overdueSummaries.length} overdue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddSupplier} className="space-y-3">
            <div className={gridClass}>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="supplier-name">Name</label>
                <Input
                  id="supplier-name"
                  value={supplierForm.name}
                  onChange={(event) => updateSupplierField("name", event.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="supplier-phone">Phone (optional)</label>
                <Input
                  id="supplier-phone"
                  value={supplierForm.phone}
                  onChange={(event) => updateSupplierField("phone", event.target.value)}
                  placeholder="Phone"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="supplier-address">Address (optional)</label>
                <Input
                  id="supplier-address"
                  value={supplierForm.address}
                  onChange={(event) => updateSupplierField("address", event.target.value)}
                  placeholder="Address"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="supplier-type">Type</label>
                <select
                  id="supplier-type"
                  className={selectClass}
                  value={supplierForm.type}
                  onChange={(event) =>
                    updateSupplierField("type", event.target.value === "both" ? "both" : "supplier")
                  }
                >
                  <option value="supplier">Supplier</option>
                  <option value="both">Both (customer and supplier)</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={busy}>Add supplier</Button>
          </form>

          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suppliers yet. Add one above to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Supplier</th>
                    <th className="px-2 py-2 font-medium">Phone</th>
                    <th className="px-2 py-2 font-medium">Payable</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Due date</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => (
                    <tr key={summary.party.id} className="border-t">
                      <td className="px-2 py-2">{summary.party.name}</td>
                      <td className="px-2 py-2 text-muted-foreground">{summary.party.phone ?? "—"}</td>
                      <td className="px-2 py-2 font-medium">{formatCurrency(summary.payable)}</td>
                      <td className="px-2 py-2">
                        {summary.overdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {summary.overdue ? (summary.earliestDueDate ?? "—") : "—"}
                      </td>
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSupplier(summary.party)}
                          disabled={busy || !canManage}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit supplier transaction" : "Record purchase or payment"}</CardTitle>
          <CardDescription>
            Purchases must be on credit with a due date. Payments use cash, bank, QR or online and cannot exceed the outstanding payable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEntrySubmit} className="space-y-3">
            <div className={gridClass}>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-kind">Record</label>
                <select
                  id="entry-kind"
                  className={selectClass}
                  value={entryForm.kind}
                  disabled={editingId !== null}
                  onChange={(event) => {
                    const kind = event.target.value === "payment" ? "payment" : "purchase";
                    setEntryForm((previous) => ({
                      ...previous,
                      kind,
                      paymentMethod: kind === "purchase" ? "credit" : "cash",
                      dueDate: kind === "purchase" ? previous.dueDate : "",
                    }));
                  }}
                >
                  <option value="purchase">Purchase (credit)</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-party">Supplier</label>
                <select
                  id="entry-party"
                  className={selectClass}
                  value={entryForm.partyId}
                  disabled={editingId !== null}
                  onChange={(event) => updateEntryField("partyId", event.target.value)}
                >
                  <option value="">Choose a supplier</option>
                  {summaries.map((summary) => (
                    <option key={summary.party.id} value={summary.party.id}>
                      {summary.party.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-amount">Amount</label>
                <Input
                  id="entry-amount"
                  inputMode="decimal"
                  value={entryForm.amount}
                  onChange={(event) => updateEntryField("amount", event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-category">Category</label>
                <Input
                  id="entry-category"
                  value={entryForm.category}
                  onChange={(event) => updateEntryField("category", event.target.value)}
                  placeholder="e.g. Inventory"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-method">Payment method</label>
                {entryForm.kind === "purchase" ? (
                  <Input id="entry-method" value="credit" readOnly disabled />
                ) : (
                  <select
                    id="entry-method"
                    className={selectClass}
                    value={entryForm.paymentMethod}
                    onChange={(event) =>
                      updateEntryField("paymentMethod", event.target.value as SupplierPaymentMethod)
                    }
                  >
                    {SUPPLIER_PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-date">Transaction date</label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryForm.transactionDate}
                  onChange={(event) => updateEntryField("transactionDate", event.target.value)}
                />
              </div>
              {entryForm.kind === "purchase" && (
                <div className="space-y-1">
                  <label className={labelClass} htmlFor="entry-due">Due date (required)</label>
                  <Input
                    id="entry-due"
                    type="date"
                    value={entryForm.dueDate}
                    onChange={(event) => updateEntryField("dueDate", event.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-attachment">Attachment URL (optional)</label>
                <Input
                  id="entry-attachment"
                  value={entryForm.attachmentUrl}
                  onChange={(event) => updateEntryField("attachmentUrl", event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="entry-description">Description (optional)</label>
              <textarea
                id="entry-description"
                className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={entryForm.description}
                onChange={(event) => updateEntryField("description", event.target.value)}
              />
            </div>
            {entryForm.partyId && (
              <p className="text-sm text-muted-foreground">
                Outstanding payable for {partyName(entryForm.partyId)}:{" "}
                <span className="font-medium">{formatCurrency(selectedPayable)}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {editingId ? "Save changes" : entryForm.kind === "purchase" ? "Record purchase" : "Record payment"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditingId(null);
                    setEntryForm(emptyEntryForm());
                    clearStatus();
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier transaction history</CardTitle>
          <CardDescription>
            Purchases and payments are shown with their due dates and payment methods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No supplier transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Supplier</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Method</th>
                    <th className="px-2 py-2 font-medium">Due date</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t">
                      <td className="px-2 py-2">{tx.transaction_date}</td>
                      <td className="px-2 py-2">{partyName(tx.party_id)}</td>
                      <td className="px-2 py-2">
                        {tx.type === "supplier_purchase" ? (
                          <Badge variant="secondary">Purchase</Badge>
                        ) : (
                          <Badge variant="outline">Payment</Badge>
                        )}
                      </td>
                      <td className="px-2 py-2 font-medium">{formatCurrency(Number(tx.amount))}</td>
                      <td className="px-2 py-2">{tx.category}</td>
                      <td className="px-2 py-2 text-muted-foreground">{tx.payment_method ?? "—"}</td>
                      <td className="px-2 py-2">{tx.due_date ?? "—"}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(tx)}
                            disabled={busy || !canManage}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEntry(tx)}
                            disabled={busy || !canManage}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
