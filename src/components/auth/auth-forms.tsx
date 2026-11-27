"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  createBusiness,
  register,
  requestPasswordReset,
  signIn,
  updatePassword,
  type AuthActionState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/required-mark";

const EMPTY_STATE: AuthActionState = {};
const INPUT_CLASS =
  "h-11 rounded-xl border-stone-200 bg-white px-3 text-sm focus-visible:ring-[#0C3B37]/25";

function ActionMessage({ state }: { state: AuthActionState }) {
  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.success) toast.success(state.success);
  }, [state]);

  if (state.error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {state.success}
      </p>
    );
  }
  return null;
}

function FieldError({ children }: { children?: string }) {
  return children ? (
    <p role="alert" className="mt-1 text-xs text-red-700">
      {children}
    </p>
  ) : null;
}

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} <RequiredMark />
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className={`${INPUT_CLASS} pr-11`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500 hover:text-stone-800"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SubmitButton({
  children,
  pending,
}: {
  children: string;
  pending: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="h-11 w-full rounded-xl bg-[#0C3B37] font-semibold text-white hover:bg-[#0A302D]"
    >
      {pending ? "Please wait…" : children}
    </Button>
  );
}

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, EMPTY_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="login-email">
          Email address <RequiredMark />
        </Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={INPUT_CLASS}
        />
      </div>
      <PasswordInput
        id="login-password"
        name="password"
        label="Password"
        autoComplete="current-password"
      />
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[#0C3B37] underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <ActionMessage state={state} />
      <SubmitButton pending={pending}>Log in</SubmitButton>
      <p className="text-center text-sm text-stone-600">
        New to BizTrack?{" "}
        <Link
          href={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-[#0C3B37] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegistrationForm({ next = "/dashboard" }: { next?: string }) {
  const [state, action, pending] = useActionState(register, EMPTY_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="register-name">
          Full name <RequiredMark />
        </Label>
        <Input
          id="register-name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={120}
          className={INPUT_CLASS}
          aria-invalid={Boolean(state.errors?.fullName)}
        />
        <FieldError>{state.errors?.fullName}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-email">
          Email address <RequiredMark />
        </Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className={INPUT_CLASS}
          aria-invalid={Boolean(state.errors?.email)}
        />
        <FieldError>{state.errors?.email}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-phone">Phone number</Label>
        <Input
          id="register-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={32}
          className={INPUT_CLASS}
        />
        <FieldError>{state.errors?.phone}</FieldError>
      </div>
      <PasswordInput
        id="register-password"
        name="password"
        label="Password"
        autoComplete="new-password"
        error={state.errors?.password}
      />
      <PasswordInput
        id="register-confirm-password"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword}
      />
      <ActionMessage state={state} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0C3B37] hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    EMPTY_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">
          Email address <RequiredMark />
        </Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={INPUT_CLASS}
          aria-invalid={Boolean(state.errors?.email)}
        />
        <FieldError>{state.errors?.email}</FieldError>
      </div>
      <ActionMessage state={state} />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-[#0C3B37] hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, EMPTY_STATE);

  return (
    <form action={action} className="space-y-4">
      <PasswordInput
        id="reset-password"
        name="password"
        label="New password"
        autoComplete="new-password"
        error={state.errors?.password}
      />
      <PasswordInput
        id="reset-confirm-password"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword}
      />
      <ActionMessage state={state} />
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}

export function BusinessSetupForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(createBusiness, EMPTY_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="space-y-1.5">
        <Label htmlFor="business-name">
          Business name <RequiredMark />
        </Label>
        <Input
          id="business-name"
          name="name"
          autoComplete="organization"
          required
          maxLength={160}
          className={INPUT_CLASS}
          aria-invalid={Boolean(state.errors?.name)}
        />
        <FieldError>{state.errors?.name}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="business-type">
          Business type <RequiredMark />
        </Label>
        <select
          id="business-type"
          name="type"
          required
          defaultValue=""
          className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C3B37]/25"
          aria-invalid={Boolean(state.errors?.type)}
        >
          <option value="" disabled>Select a type</option>
          {["Retail Shop", "Wholesale", "Grocery", "Stationery", "Hardware", "Other"].map(
            (type) => (
              <option key={type} value={type}>{type}</option>
            ),
          )}
        </select>
        <FieldError>{state.errors?.type}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="business-phone">Business phone</Label>
          <Input
            id="business-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={32}
            className={INPUT_CLASS}
          />
          <FieldError>{state.errors?.phone}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="business-email">Business email</Label>
          <Input
            id="business-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className={INPUT_CLASS}
            aria-invalid={Boolean(state.errors?.email)}
          />
          <FieldError>{state.errors?.email}</FieldError>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="business-address">Business address</Label>
        <Input
          id="business-address"
          name="address"
          autoComplete="street-address"
          maxLength={240}
          className={INPUT_CLASS}
        />
        <FieldError>{state.errors?.address}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="business-currency">
            Currency <RequiredMark />
          </Label>
          <select
            id="business-currency"
            name="currency"
            defaultValue="NPR"
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C3B37]/25"
          >
            <option value="NPR">NPR — Nepalese Rupee</option>
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
          </select>
          <FieldError>{state.errors?.currency}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="business-description">Description</Label>
          <Input
            id="business-description"
            name="description"
            maxLength={1000}
            className={INPUT_CLASS}
          />
          <FieldError>{state.errors?.description}</FieldError>
        </div>
      </div>
      <ActionMessage state={state} />
      <SubmitButton pending={pending}>Create business</SubmitButton>
    </form>
  );
}
