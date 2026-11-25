"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";

import { recordPaymentAction } from "@/app/parties/actions";
import { FieldError } from "@/components/parties/field-error";
import { FormMessage } from "@/components/parties/form-message";
import {
  controlClass,
  labelClass,
} from "@/components/parties/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import {
  isOverpayment,
  parseAmountInput,
  validatePaymentInput,
} from "@/lib/credit/calculations";
import { formatCurrency } from "@/lib/format";

interface PaymentFormProps {
  partyId: string;
  today: string;
  balance: number;
}

export function PaymentForm({ partyId, today, balance }: PaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    recordPaymentAction,
    initialActionState,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [clientMessage, setClientMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const errors =
    state.status === "success"
      ? clientErrors
      : { ...state.fieldErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const amount = parseAmountInput(String(formData.get("amount") ?? ""));
    const nextErrors = validatePaymentInput({
      amount,
      category: String(formData.get("category") ?? ""),
      paymentMethod: String(formData.get("payment_method") ?? ""),
      transactionDate: String(formData.get("transaction_date") ?? ""),
      today,
    });

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setClientErrors(nextErrors);
      setClientMessage(null);
      return;
    }

    if (amount !== null && isOverpayment(amount, balance)) {
      event.preventDefault();
      setClientErrors({});
      setClientMessage(
        `Payment of ${formatCurrency(amount)} exceeds the outstanding balance of ${formatCurrency(balance)}.`,
      );
      return;
    }

    setClientErrors({});
    setClientMessage(null);
  }

  function fillFullBalance() {
    if (balance <= 0 || !amountRef.current) return;
    amountRef.current.value = balance.toFixed(2);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-4"
      noValidate
    >
      <input type="hidden" name="party_id" value={partyId} />
      {clientMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {clientMessage}
        </p>
      ) : Object.keys(clientErrors).length === 0 ? (
        <FormMessage state={state} />
      ) : null}

      <div className="rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Outstanding balance: </span>
        <span className="font-semibold">{formatCurrency(balance)}</span>
      </div>

      <div>
        <Label htmlFor="payment-amount" className={labelClass}>
          Amount <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            ref={amountRef}
            id="payment-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max={balance > 0 ? balance : undefined}
            step="0.01"
            placeholder="0.00"
            required
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={
              errors.amount ? "payment-amount-error" : undefined
            }
          />
          <Button
            type="button"
            variant="outline"
            onClick={fillFullBalance}
            disabled={balance <= 0}
            className="shrink-0"
          >
            Pay full balance
          </Button>
        </div>
        <FieldError id="payment-amount-error" message={errors.amount} />
      </div>

      <div>
        <Label htmlFor="payment-category" className={labelClass}>
          Category <span className="text-destructive">*</span>
        </Label>
        <Input
          id="payment-category"
          name="category"
          defaultValue="Customer payment"
          required
          aria-invalid={Boolean(errors.category)}
          aria-describedby={
            errors.category ? "payment-category-error" : undefined
          }
        />
        <FieldError id="payment-category-error" message={errors.category} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="payment-method" className={labelClass}>
            Payment method <span className="text-destructive">*</span>
          </Label>
          <select
            id="payment-method"
            name="payment_method"
            defaultValue="cash"
            className={controlClass}
            aria-invalid={Boolean(errors.payment_method)}
            aria-describedby={
              errors.payment_method ? "payment-method-error" : undefined
            }
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="qr">QR</option>
            <option value="online">Online</option>
          </select>
          <FieldError
            id="payment-method-error"
            message={errors.payment_method}
          />
        </div>

        <div>
          <Label htmlFor="payment-date" className={labelClass}>
            Transaction date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="payment-date"
            name="transaction_date"
            type="date"
            defaultValue={today}
            max={today}
            required
            aria-invalid={Boolean(errors.transaction_date)}
            aria-describedby={
              errors.transaction_date ? "payment-date-error" : undefined
            }
          />
          <FieldError id="payment-date-error" message={errors.transaction_date} />
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Wallet className="size-4" aria-hidden="true" />
        Overpayments are rejected. Use the outstanding balance or less.
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Recording payment…" : "Record payment"}
      </Button>
    </form>
  );
}
