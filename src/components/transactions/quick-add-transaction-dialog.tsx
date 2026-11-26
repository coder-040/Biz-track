"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { ACTOR_ID, ACTOR_NAME, BUSINESS_ID } from "@/lib/config";
import { supabase } from "@/lib/supabase/client";
import { writeAudit } from "@/lib/transactions/audit";
import { isISODate, todayISO } from "@/lib/transactions/date";
import { isPaymentMethod } from "@/lib/transactions/filters";
import { PAYMENT_METHODS, type TransactionType } from "@/lib/transactions/types";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Could not save the transaction.";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function QuickAddTransactionDialog() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("income");
  const [busy, setBusy] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      formRef.current?.reset();
      setType("income");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const amountText = String(formData.get("amount") ?? "").trim();
    const amount = Number(amountText);
    const transactionDate = String(formData.get("transaction_date") ?? "");
    const category = String(formData.get("category") ?? "").trim();
    const paymentMethod = String(formData.get("payment_method") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const attachmentUrl = String(formData.get("attachment_url") ?? "").trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(amountText) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 9_999_999_999.99
    ) {
      toast.error("Enter an amount greater than zero with at most 2 decimal places.");
      return;
    }
    if (!isISODate(transactionDate) || transactionDate > todayISO()) {
      toast.error("Enter a valid transaction date that is not in the future.");
      return;
    }
    if (!category) {
      toast.error("Category is required.");
      return;
    }
    if (!isPaymentMethod(paymentMethod)) {
      toast.error("Choose a valid payment method.");
      return;
    }
    if (attachmentUrl && !isHttpUrl(attachmentUrl)) {
      toast.error("Bill URL must use http or https.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert({
          business_id: BUSINESS_ID,
          type,
          amount,
          transaction_date: transactionDate,
          category,
          payment_method: paymentMethod,
          description: description || null,
          attachment_url: attachmentUrl || null,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      let auditWarning: string | null = null;
      try {
        await writeAudit({
          businessId: BUSINESS_ID,
          entityType: "transaction",
          entityId: data.id,
          action: "insert",
          actorId: ACTOR_ID,
          actorName: ACTOR_NAME,
          changes: { before: null, after: data },
        });
      } catch (auditError) {
        auditWarning = `Saved, but audit logging failed: ${getErrorMessage(auditError)}`;
      }

      toast.success(`${type === "income" ? "Income" : "Expense"} recorded.`);
      if (auditWarning) toast.error(auditWarning);
      formRef.current?.reset();
      setType("income");
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="bg-white text-[#0C3B37] shadow-xs hover:bg-emerald-50"
          />
        }
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Quick Add income / expense
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record income or expense</DialogTitle>
          <DialogDescription>
            Add an income or expense entry to your daily ledger.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="quick-transaction-type">
              Record as <RequiredMark />
            </label>
            <select
              id="quick-transaction-type"
              name="type"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(event) =>
                setType(event.target.value as TransactionType)
              }
              disabled={busy}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="quick-transaction-amount">
                Amount <RequiredMark />
              </label>
              <Input
                id="quick-transaction-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                required
                disabled={busy}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="quick-transaction-date">
                Date <RequiredMark />
              </label>
              <Input
                id="quick-transaction-date"
                name="transaction_date"
                type="date"
                max={todayISO()}
                defaultValue={todayISO()}
                required
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="quick-transaction-category">
              Category <RequiredMark />
            </label>
            <Input
              id="quick-transaction-category"
              name="category"
              placeholder="e.g. Sales, Rent, Supplies"
              required
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="quick-transaction-method">
                Payment method <RequiredMark />
              </label>
              <select
                id="quick-transaction-method"
                name="payment_method"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                defaultValue="cash"
                disabled={busy}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="quick-transaction-attachment">
                Bill URL (optional)
              </label>
              <Input
                id="quick-transaction-attachment"
                name="attachment_url"
                type="url"
                placeholder="https://..."
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="quick-transaction-description">
              Description (optional)
            </label>
            <textarea
              id="quick-transaction-description"
              name="description"
              className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Add a note"
              disabled={busy}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy
                ? "Saving..."
                : `Record ${type === "income" ? "income" : "expense"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
