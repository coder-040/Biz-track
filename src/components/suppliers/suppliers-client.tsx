"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SupplierOrdersBoard } from "@/components/suppliers/supplier-orders-board";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { useBusinessContext } from "@/components/auth/business-context";
import { can } from "@/lib/auth/permissions";
import { writeAudit, type AuditEntry } from "@/lib/audit";
import { formatCurrency } from "@/lib/format";
import type { ProductOption } from "@/lib/inventory";
import { supabase } from "@/lib/supabase/client";
import { todayISO } from "@/lib/date";
import {
  buildSummaries,
  createSupplierOrderPaymentForm,
  payableFor,
  validateEntryForm,
  validateSupplierForm,
} from "@/lib/suppliers/calculate";
import {
  buildSupplierOrders,
  calculateOutstandingCents,
  moveSupplierOrder,
  type NewSupplierOrderInput,
  type SupplierOrder,
  type SupplierOrderColumn,
  type SupplierOrderPaymentRecord,
  type SupplierOrderRecord,
} from "@/lib/suppliers/orders";
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
  "id, business_id, supplier_order_id, type, party_id, amount, category, payment_method, " +
  "description, due_date, transaction_date, attachment_url, created_at";
const ORDER_COLUMNS =
  "id, business_id, supplier_id, product_id, quantity, items, category, total_amount, order_date, " +
  "due_date, status, attachment_url, received_at, created_at";
const ORDER_PAYMENT_COLUMNS =
  "id, business_id, order_id, supplier_id, amount, payment_method, " +
  "payment_date, transaction_id, created_at";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const labelClass = "block text-sm font-medium";
const gridClass = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";

interface SuppliersClientProps {
  initialParties: PartyRow[];
  initialTransactions: SupplierTransactionRow[];
  initialOrders: SupplierOrder[];
  initialProducts: ProductOption[];
  role: Role;
}

function emptySupplierForm(): SupplierFormState {
  return { name: "", phone: "", address: "", type: "supplier" };
}

function emptyEntryForm(): EntryFormState {
  return {
    kind: "purchase",
    partyId: "",
    orderId: "",
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
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    message.includes("parties_business_name_phone_unique")
  ) {
    return "A customer or supplier with this name and phone number already exists.";
  }
  return message || "Something went wrong.";
}

function isSupplierPaymentMethod(value: unknown): value is SupplierPaymentMethod {
  return (
    typeof value === "string" &&
    SUPPLIER_PAYMENT_METHODS.some((method) => method === value)
  );
}

interface SupplierPaymentRpcResult {
  allocations: Array<{ order_id: string; amount: number }>;
  legacy_amount: number;
}

function parseSupplierPaymentResult(value: unknown): SupplierPaymentRpcResult | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    !Array.isArray(record.allocations) ||
    typeof record.legacy_amount !== "number" ||
    !Number.isFinite(record.legacy_amount) ||
    record.legacy_amount < 0
  ) {
    return null;
  }

  const allocations: SupplierPaymentRpcResult["allocations"] = [];
  for (const candidate of record.allocations) {
    if (typeof candidate !== "object" || candidate === null) return null;
    const allocation = candidate as Record<string, unknown>;
    if (
      typeof allocation.order_id !== "string" ||
      typeof allocation.amount !== "number" ||
      !Number.isFinite(allocation.amount) ||
      allocation.amount <= 0
    ) {
      return null;
    }
    allocations.push({
      order_id: allocation.order_id,
      amount: allocation.amount,
    });
  }

  return { allocations, legacy_amount: record.legacy_amount };
}

export function SuppliersClient({
  initialParties,
  initialTransactions,
  initialOrders,
  initialProducts,
  role,
}: SuppliersClientProps) {
  const router = useRouter();
  const { context } = useBusinessContext();
  const businessId = context?.activeBusinessId;
  const actorId = context?.user.id;
  const actorName = context?.user.fullName || context?.user.email || null;
  const [transactions, setTransactions] = useState(initialTransactions);
  const [orders, setOrders] = useState(initialOrders);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryFormState>(emptyEntryForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAudit, setPendingAudit] = useState<AuditEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage = Boolean(
    context?.activeRole &&
      context.activeRole === role &&
      can(context.activeRole, "manage_finances", context.activePermissions),
  );
  const summaries = buildSummaries(initialParties, transactions, todayISO());
  const overdueSummaries = summaries.filter((summary) => summary.overdue);
  const totalPayable = summaries.reduce((total, summary) => total + summary.payable, 0);

  const selectedPayable = entryForm.partyId
    ? payableFor(entryForm.partyId, transactions, editingId ?? undefined)
    : 0;

  function handleSupplierDialogOpenChange(nextOpen: boolean) {
    setSupplierDialogOpen(nextOpen);
    if (nextOpen) {
      setSupplierForm(emptySupplierForm());
    }
  }

  function partyName(partyId: string | null): string {
    return initialParties.find((party) => party.id === partyId)?.name ?? "Unknown supplier";
  }

  async function refreshLocalSupplierData() {
    if (!businessId) {
      throw new Error("Business account context is not ready.");
    }
    const [transactionResult, orderResult, paymentResult] = await Promise.all([
      supabase
        .from("transactions")
        .select(TRANSACTION_COLUMNS)
        .eq("business_id", businessId)
        .in("type", ["supplier_purchase", "supplier_payment"])
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("supplier_orders")
        .select(ORDER_COLUMNS)
        .eq("business_id", businessId)
        .order("order_date", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("supplier_order_payments")
        .select(ORDER_PAYMENT_COLUMNS)
        .eq("business_id", businessId)
        .order("payment_date", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    const refreshError =
      transactionResult.error ?? orderResult.error ?? paymentResult.error;
    if (refreshError) throw refreshError;

    const refreshedTransactions =
      (transactionResult.data ?? []) as unknown as SupplierTransactionRow[];
    const refreshedOrders = (orderResult.data ?? []) as unknown as SupplierOrderRecord[];
    const refreshedPayments =
      (paymentResult.data ?? []) as unknown as SupplierOrderPaymentRecord[];
    setTransactions(refreshedTransactions);
    setOrders(
      buildSupplierOrders(
        refreshedOrders,
        refreshedPayments,
        initialParties.map(({ id, name }) => ({ id, name })),
      ),
    );
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

  async function handleAddSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSupplierForm(supplierForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!canManage || !businessId) {
      toast.error("You do not have permission to manage supplier records.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        business_id: businessId,
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
      toast.success("Supplier added.");
      setSupplierDialogOpen(false);
      router.refresh();
    } catch (submitError) {
      toast.error(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSupplier(party: PartyRow) {
    if (!canManage) return;

    const payable = payableFor(party.id, transactions);
    if (payable > 0) {
      toast.error(
        `Cannot delete ${party.name} while ${formatCurrency(payable)} of supplier credit remains unpaid.`,
      );
      return;
    }

    if (
      transactions.some((tx) => tx.party_id === party.id) ||
      orders.some((order) => order.supplierId === party.id)
    ) {
      toast.error("Cannot delete a supplier with purchases or payments recorded.");
      return;
    }
    if (!window.confirm(`Delete ${party.name}? This cannot be undone.`)) return;

    setBusy(true);
    try {
      const { error: dbError } = await supabase
        .from("parties")
        .delete()
        .eq("id", party.id)
        .eq("business_id", businessId);

      if (dbError) throw dbError;

      await recordAudit({
        entityType: "party",
        entityId: party.id,
        action: "delete",
        changes: { before: party, after: null },
      });

      toast.success("Supplier deleted.");
      router.refresh();
    } catch (deleteError) {
      toast.error(errorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateOrder(input: NewSupplierOrderInput) {
    if (!canManage || !businessId || !actorId) {
      throw new Error("You do not have permission to create supplier orders.");
    }
    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc("create_supplier_order", {
        p_business_id: businessId,
        p_supplier_id: input.supplierId,
        p_product_id: input.productId,
        p_quantity: Number(input.quantity),
        p_items: input.items,
        p_category: input.category,
        p_total_amount: Number(input.totalAmount),
        p_order_date: input.orderDate,
        p_due_date: input.dueDate,
        p_payment_type: input.paymentType,
        p_payment_method:
          input.paymentType === "paid_now" ? input.paymentMethod : null,
        p_attachment_url: input.attachmentUrl.trim() || null,
        p_actor_id: actorId,
        p_actor_name: actorName,
      });

      if (rpcError) throw rpcError;

      toast.success("Supplier order created.");
      try {
        await refreshLocalSupplierData();
      } catch (refreshError) {
        toast.error(
          `Order saved, but the board could not be refreshed: ${errorMessage(refreshError)}`,
        );
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleOrderMove(
    order: SupplierOrder,
    target: SupplierOrderColumn,
  ) {
    if (!canManage) return;

    const moveResult = moveSupplierOrder(
      order,
      target,
      order.payments.length > 0,
    );
    if (!moveResult.ok) {
      toast.error(moveResult.message);
      return;
    }
    if (moveResult.order.status === order.status) return;

    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc("set_supplier_order_status", {
        p_business_id: businessId,
        p_order_id: order.id,
        p_target_status: moveResult.order.status,
        p_actor_id: actorId,
        p_actor_name: actorName,
      });
      if (rpcError) throw rpcError;

      toast.success(
        moveResult.order.status === "received"
          ? "Order received."
          : "Order moved back to Ordered.",
      );
      try {
        await refreshLocalSupplierData();
      } catch (refreshError) {
        toast.error(
          `Order updated, but the board could not be refreshed: ${errorMessage(refreshError)}`,
        );
      }
      router.refresh();
    } catch (moveError) {
      toast.error(errorMessage(moveError));
    } finally {
      setBusy(false);
    }
  }

  function startOrderPayment(order: SupplierOrder) {
    setEditingId(null);
    setEntryForm(
      createSupplierOrderPaymentForm(order.supplierId, order.id),
    );
    window.requestAnimationFrame(() => {
      document
        .getElementById("supplier-entry-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateEntryForm(
      entryForm,
      initialParties,
      transactions,
      editingId,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!canManage || !businessId || !actorId) {
      toast.error("You do not have permission to manage supplier records.");
      return;
    }

    if (entryForm.kind === "payment" && entryForm.orderId) {
      const order = orders.find((candidate) => candidate.id === entryForm.orderId);
      if (!order || order.supplierId !== entryForm.partyId) {
        toast.error("Choose an outstanding order for this supplier.");
        return;
      }
      const orderOutstanding = calculateOutstandingCents(
        order.totalCents,
        order.paidCents,
      );
      if (Math.round(Number(entryForm.amount) * 100) > orderOutstanding) {
        toast.error(
          `Payment exceeds this order's outstanding amount (${formatCurrency(orderOutstanding / 100)}).`,
        );
        return;
      }
    }

    setBusy(true);
    try {
      const isPurchase = entryForm.kind === "purchase";
      if (!isPurchase) {
        const { data, error: rpcError } = await supabase.rpc(
          "record_supplier_order_payment",
          {
            p_business_id: businessId,
            p_supplier_id: entryForm.partyId,
            p_amount: Number(entryForm.amount),
            p_payment_method: entryForm.paymentMethod,
            p_payment_date: entryForm.transactionDate,
            p_order_id: entryForm.orderId || null,
            p_actor_id: actorId,
            p_actor_name: actorName,
          },
        );

        if (rpcError) throw rpcError;

        const result = parseSupplierPaymentResult(data);
        const affected: string[] = [];
        for (const allocation of result?.allocations ?? []) {
          const order = orders.find(
            (candidate) => candidate.id === allocation.order_id,
          );
          affected.push(
            `${order?.supplierName ?? "Order"} ${allocation.order_id.slice(0, 8)} (${formatCurrency(allocation.amount)})`,
          );
        }
        const paymentMessage = result
          ? affected.length > 0 || result.legacy_amount > 0
            ? `Payment recorded. Applied to ${[
                ...affected,
                ...(result.legacy_amount > 0
                  ? [`existing payable (${formatCurrency(result.legacy_amount)})`]
                  : []),
              ].join(", ")}.`
            : "Payment recorded."
          : null;
        if (paymentMessage) {
          toast.success(paymentMessage);
        } else {
          toast.error(
            "Payment was saved, but allocation details could not be verified. Check the supplier ledger.",
          );
        }
        setEditingId(null);
        setEntryForm(emptyEntryForm());
        try {
          await refreshLocalSupplierData();
        } catch (refreshError) {
          toast.error(
            `Payment saved, but supplier totals could not be refreshed: ${errorMessage(refreshError)}`,
          );
        }
        router.refresh();
        return;
      }

      const payload = {
        business_id: businessId,
        type: "supplier_purchase",
        party_id: entryForm.partyId,
        amount: Number(entryForm.amount),
        category: entryForm.category.trim(),
        payment_method: "credit",
        transaction_date: entryForm.transactionDate,
        due_date: entryForm.dueDate,
        description: entryForm.description.trim() || null,
        attachment_url: entryForm.attachmentUrl.trim() || null,
      };

      if (editingId) {
        const before =
          transactions.find((tx) => tx.id === editingId) ?? null;
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
          changes: { before, after: data as unknown as SupplierTransactionRow },
        });
        toast.success("Supplier transaction updated.");
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
        toast.success("Purchase recorded.");
      }

      setEditingId(null);
      setEntryForm(emptyEntryForm());
      try {
        await refreshLocalSupplierData();
      } catch (refreshError) {
        toast.error(
          `Transaction saved, but supplier totals could not be refreshed: ${errorMessage(refreshError)}`,
        );
      }
      router.refresh();
    } catch (submitError) {
      toast.error(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(tx: SupplierTransactionRow) {
    if (!canManage) return;
    if (tx.supplier_order_id) {
      toast.error("Order-linked transactions are managed from the Orders Board.");
      return;
    }
    setEditingId(tx.id);
    setEntryForm({
      kind: tx.type === "supplier_purchase" ? "purchase" : "payment",
      partyId: tx.party_id ?? "",
      orderId: "",
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
    if (tx.supplier_order_id) {
      toast.error("Order-linked transactions are managed from the Orders Board.");
      return;
    }
    if (!window.confirm("Delete this supplier transaction? This cannot be undone.")) {
      return;
    }

    setBusy(true);
    try {
      const { error: dbError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", tx.id)
        .eq("business_id", businessId);

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
      toast.success("Supplier transaction deleted.");
      try {
        await refreshLocalSupplierData();
      } catch (refreshError) {
        toast.error(
          `Transaction deleted, but supplier totals could not be refreshed: ${errorMessage(refreshError)}`,
        );
      }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Suppliers and payables</CardTitle>
            <CardDescription>
              Total payable {formatCurrency(totalPayable)} · {overdueSummaries.length} overdue
            </CardDescription>
          </div>
          {canManage ? (
            <Dialog
              open={supplierDialogOpen}
              onOpenChange={handleSupplierDialogOpenChange}
            >
              <DialogTrigger render={<Button type="button" disabled={busy} />}>
                <UserPlus aria-hidden="true" />
                Add supplier
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add supplier</DialogTitle>
                  <DialogDescription>
                    Add a supplier to track purchases and outstanding payables.
                    Use Both if this is also a customer.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSupplier} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className={labelClass} htmlFor="supplier-name">
                        Name <RequiredMark />
                      </label>
                      <Input
                        id="supplier-name"
                        value={supplierForm.name}
                        onChange={(event) =>
                          updateSupplierField("name", event.target.value)
                        }
                        placeholder="Supplier name"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass} htmlFor="supplier-phone">
                        Phone (optional)
                      </label>
                      <Input
                        id="supplier-phone"
                        value={supplierForm.phone}
                        onChange={(event) =>
                          updateSupplierField("phone", event.target.value)
                        }
                        placeholder="Phone"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass} htmlFor="supplier-address">
                        Address (optional)
                      </label>
                      <Input
                        id="supplier-address"
                        value={supplierForm.address}
                        onChange={(event) =>
                          updateSupplierField("address", event.target.value)
                        }
                        placeholder="Address"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className={labelClass} htmlFor="supplier-type">
                        Type <RequiredMark />
                      </label>
                      <select
                        id="supplier-type"
                        className={selectClass}
                        value={supplierForm.type}
                        onChange={(event) =>
                          updateSupplierField(
                            "type",
                            event.target.value === "both" ? "both" : "supplier",
                          )
                        }
                      >
                        <option value="supplier">Supplier</option>
                        <option value="both">
                          Both (customer and supplier)
                        </option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSupplierDialogOpenChange(false)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={busy}>
                      <UserPlus aria-hidden="true" />
                      {busy ? "Adding supplier…" : "Add supplier"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No suppliers yet. Use Add supplier to get started.
            </p>
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

      <SupplierOrdersBoard
        orders={orders}
        products={initialProducts}
        suppliers={initialParties.filter(
          (party) => party.type === "supplier" || party.type === "both",
        )}
        canManage={canManage}
        busy={busy}
        onCreate={handleCreateOrder}
        onMove={handleOrderMove}
        onRecordPayment={startOrderPayment}
      />

      <Card>
        <div id="supplier-entry-form" />
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
                <label className={labelClass} htmlFor="entry-kind">
                  Record <RequiredMark />
                </label>
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
                      orderId: "",
                      paymentMethod: kind === "purchase" ? "credit" : "cash",
                      dueDate: kind === "purchase" ? previous.dueDate : "",
                      category:
                        kind === "payment" && !previous.category
                          ? "Supplier payment"
                          : previous.category,
                    }));
                  }}
                >
                  <option value="purchase">Purchase (credit)</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-party">
                  Supplier <RequiredMark />
                </label>
                <select
                  id="entry-party"
                  className={selectClass}
                  value={entryForm.partyId}
                  disabled={editingId !== null}
                  onChange={(event) => {
                    setEntryForm((previous) => ({
                      ...previous,
                      partyId: event.target.value,
                      orderId: "",
                    }));
                  }}
                >
                  <option value="">Choose a supplier</option>
                  {summaries.map((summary) => (
                    <option key={summary.party.id} value={summary.party.id}>
                      {summary.party.name}
                    </option>
                  ))}
                </select>
              </div>
              {entryForm.kind === "payment" ? (
                <div className="space-y-1">
                  <label className={labelClass} htmlFor="entry-order">
                    Supplier order (optional)
                  </label>
                  <select
                    id="entry-order"
                    className={selectClass}
                    value={entryForm.orderId}
                    onChange={(event) =>
                      updateEntryField("orderId", event.target.value)
                    }
                    disabled={!entryForm.partyId || editingId !== null}
                  >
                    <option value="">Apply oldest outstanding first (FIFO)</option>
                    {orders
                      .filter(
                        (order) =>
                          order.supplierId === entryForm.partyId &&
                          order.status === "received" &&
                          calculateOutstandingCents(
                            order.totalCents,
                            order.paidCents,
                          ) > 0,
                      )
                      .map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.id.slice(0, 8)} ·{" "}
                          {formatCurrency(
                            calculateOutstandingCents(
                              order.totalCents,
                              order.paidCents,
                            ) / 100,
                          )}{" "}
                          outstanding
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-amount">
                  Amount <RequiredMark />
                </label>
                <Input
                  id="entry-amount"
                  inputMode="decimal"
                  value={entryForm.amount}
                  onChange={(event) => updateEntryField("amount", event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-category">
                  Category <RequiredMark />
                </label>
                <Input
                  id="entry-category"
                  value={entryForm.category}
                  onChange={(event) => updateEntryField("category", event.target.value)}
                  placeholder="e.g. Inventory"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass} htmlFor="entry-method">
                  Payment method{" "}
                  {entryForm.kind === "payment" ? <RequiredMark /> : null}
                </label>
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
                <label className={labelClass} htmlFor="entry-date">
                  Transaction date <RequiredMark />
                </label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryForm.transactionDate}
                  onChange={(event) => updateEntryField("transactionDate", event.target.value)}
                />
              </div>
              {entryForm.kind === "purchase" && (
                <div className="space-y-1">
                  <label className={labelClass} htmlFor="entry-due">
                    Due date <RequiredMark />
                  </label>
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
          {transactions.length === 0 ? (
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
                  {transactions.map((tx) => (
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
                            disabled={busy || !canManage || Boolean(tx.supplier_order_id)}
                          >
                            {tx.supplier_order_id ? "Order-managed" : "Edit"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEntry(tx)}
                            disabled={busy || !canManage || Boolean(tx.supplier_order_id)}
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
