"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";

import { createCustomerAction } from "@/app/parties/actions";
import { FieldError } from "@/components/parties/field-error";
import { FormMessage } from "@/components/parties/form-message";
import {
  controlClass,
  hintClass,
  labelClass,
} from "@/components/parties/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { validatePartyInput } from "@/lib/credit/calculations";

export function AddCustomerForm() {
  const [state, formAction, pending] = useActionState(
    createCustomerAction,
    initialActionState,
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const errors = { ...state.fieldErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors = validatePartyInput({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? ""),
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
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-4"
      noValidate
    >
      {Object.keys(clientErrors).length === 0 ? (
        <FormMessage state={state} />
      ) : null}

      <div>
        <Label htmlFor="customer-name" className={labelClass}>
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="customer-name"
          name="name"
          autoComplete="name"
          placeholder="Customer name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "customer-name-error" : undefined}
        />
        <FieldError id="customer-name-error" message={errors.name} />
      </div>

      <div>
        <Label htmlFor="customer-phone" className={labelClass}>
          Phone
        </Label>
        <Input
          id="customer-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
        />
        <p className={hintClass}>Optional. Shown on the customer list.</p>
      </div>

      <div>
        <Label htmlFor="customer-address" className={labelClass}>
          Address
        </Label>
        <Textarea
          id="customer-address"
          name="address"
          rows={2}
          placeholder="City, area"
        />
        <p className={hintClass}>Optional.</p>
      </div>

      <div>
        <Label htmlFor="customer-type" className={labelClass}>
          Type <span className="text-destructive">*</span>
        </Label>
        <select
          id="customer-type"
          name="type"
          defaultValue="customer"
          className={controlClass}
          aria-invalid={Boolean(errors.type)}
          aria-describedby={errors.type ? "customer-type-error" : undefined}
        >
          <option value="customer">Customer</option>
          <option value="both">Customer &amp; supplier</option>
        </select>
        <FieldError id="customer-type-error" message={errors.type} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        <UserPlus data-icon="inline-start" />
        {pending ? "Adding customer…" : "Add customer"}
      </Button>
    </form>
  );
}
