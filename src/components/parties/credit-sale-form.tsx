"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";

import { recordCreditSaleAction } from "@/app/parties/actions";
import { FieldError } from "@/components/parties/field-error";
import { FormMessage } from "@/components/parties/form-message";
import {
  hintClass,
  labelClass,
} from "@/components/parties/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import {
  parseAmountInput,
  validateCreditSaleInput,
} from "@/lib/credit/calculations";

interface CreditSaleFormProps {
  partyId: string;
  today: string;
}

export function CreditSaleForm({ partyId, today }: CreditSaleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    recordCreditSaleAction,
    initialActionState,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

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
    const nextErrors = validateCreditSaleInput({
      amount: parseAmountInput(String(formData.get("amount") ?? "")),
      category: String(formData.get("category") ?? ""),
      dueDate: String(formData.get("due_date") ?? ""),
      transactionDate: String(formData.get("transaction_date") ?? ""),
      today,
    });

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setClientErrors(nextErrors);
      return;
    }

    setClientErrors({});
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
      {Object.keys(clientErrors).length === 0 ? (
        <FormMessage state={state} />
      ) : null}

      <div>
        <Label htmlFor="sale-amount" className={labelClass}>
          Amount <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sale-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          required
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={errors.amount ? "sale-amount-error" : undefined}
        />
        <FieldError id="sale-amount-error" message={errors.amount} />
      </div>

      <div>
        <Label htmlFor="sale-category" className={labelClass}>
          Category <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sale-category"
          name="category"
          defaultValue="Credit sale"
          required
          aria-invalid={Boolean(errors.category)}
          aria-describedby={
            errors.category ? "sale-category-error" : undefined
          }
        />
        <FieldError id="sale-category-error" message={errors.category} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sale-transaction-date" className={labelClass}>
            Transaction date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sale-transaction-date"
            name="transaction_date"
            type="date"
            defaultValue={today}
            max={today}
            required
            aria-invalid={Boolean(errors.transaction_date)}
            aria-describedby={
              errors.transaction_date ? "sale-transaction-date-error" : undefined
            }
          />
          <FieldError
            id="sale-transaction-date-error"
            message={errors.transaction_date}
          />
        </div>

        <div>
          <Label htmlFor="sale-due-date" className={labelClass}>
            Due date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sale-due-date"
            name="due_date"
            type="date"
            required
            aria-invalid={Boolean(errors.due_date)}
            aria-describedby={errors.due_date ? "sale-due-date-error" : undefined}
          />
          <FieldError id="sale-due-date-error" message={errors.due_date} />
        </div>
      </div>

      <div>
        <Label htmlFor="sale-description" className={labelClass}>
          Description
        </Label>
        <Textarea
          id="sale-description"
          name="description"
          rows={2}
          placeholder="What was bought on credit?"
        />
      </div>

      <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <CreditCard className="size-4" aria-hidden="true" />
        Payment method is recorded as <strong>Credit</strong>.
      </p>
      <p className={hintClass}>
        Payments are applied to the earliest due sales first.
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Recording sale…" : "Record credit sale"}
      </Button>
    </form>
  );
}
