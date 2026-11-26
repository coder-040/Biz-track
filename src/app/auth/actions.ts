"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeEmail,
  validateBusinessSetup,
  validateRegistration,
} from "@/lib/auth/validation";
import { setActiveBusinessCookie } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
  success?: string;
  errors?: Record<string, string>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Set NEXT_PUBLIC_SITE_URL for production auth emails.");
    }
    return "http://localhost:3000";
  }

  const url = new URL(configured);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS URL in production.");
  }
  return url.origin;
}

function safeNextPath(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return "/dashboard";
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formText(formData, "email"));
  const password = formText(formData, "password");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect(safeNextPath(formText(formData, "next")));
}

export async function register(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const next = safeNextPath(formText(formData, "next"));
  const validated = validateRegistration({
    fullName: formText(formData, "fullName"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
    password: formText(formData, "password"),
    confirmPassword: formText(formData, "confirmPassword"),
  });

  if (!validated.success) return { errors: validated.errors };

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        full_name: validated.data.fullName,
        phone: validated.data.phone,
      },
      emailRedirectTo: new URL(
        next === "/dashboard"
          ? "/auth/callback?next=%2Fsetup%2Fbusiness"
          : `/auth/callback?next=${encodeURIComponent(next)}`,
        siteOrigin(),
      ).toString(),
    },
  });

  if (error) {
    console.error("Supabase registration failed.", {
      code: error.code,
      status: error.status,
    });
    return {
      error:
        "We could not create the account with those details. Please check them or try signing in.",
    };
  }

  if (data.session) redirect(next);

  return {
    success:
      "If registration succeeded, check your email for a confirmation link before continuing.",
  };
}

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formText(formData, "email"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { errors: { email: "Enter a valid email address." } };
  }

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL(
      "/auth/callback?next=%2Freset-password",
      siteOrigin(),
    ).toString(),
  });

  if (error) {
    console.error("Supabase password reset request failed.", {
      code: error.code,
      status: error.status,
    });
  }

  return {
    success:
      "If an account exists for that email, password reset instructions will be sent.",
  };
}

export async function updatePassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formText(formData, "password");
  const confirmPassword = formText(formData, "confirmPassword");

  if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return {
      errors: {
        password: "Use 8–128 characters with at least one letter and one number.",
      },
    };
  }
  if (password !== confirmPassword) {
    return { errors: { confirmPassword: "Passwords do not match." } };
  }

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: "The reset link is invalid or has expired. Request a new one." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { error: "Could not update the password. Request a new reset link and try again." };
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    console.error("Password changed but global session revocation failed.", {
      code: signOutError.code,
      status: signOutError.status,
    });
    return {
      error:
        "Your password was changed, but other sessions could not be revoked. Sign out of other devices and contact support.",
    };
  }

  redirect("/login?passwordReset=1");
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function createBusiness(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validated = validateBusinessSetup({
    name: formText(formData, "name"),
    type: formText(formData, "type"),
    phone: formText(formData, "phone"),
    email: formText(formData, "email"),
    address: formText(formData, "address"),
    currency: formText(formData, "currency"),
    description: formText(formData, "description"),
  });
  const requestId = formText(formData, "requestId");

  if (!validated.success) return { errors: validated.errors };
  if (!UUID_PATTERN.test(requestId)) {
    return { error: "This setup request expired. Reload the page and try again." };
  }

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const { data: businessId, error } = await supabase.rpc(
    "create_business_with_owner",
    {
      p_request_id: requestId,
      p_name: validated.data.name,
      p_business_type: validated.data.type,
      p_phone: validated.data.phone,
      p_email: validated.data.email,
      p_address: validated.data.address,
      p_currency: validated.data.currency,
      p_description: validated.data.description,
    },
  );

  if (error || !businessId) {
    console.error("Business setup failed.", {
      code: error?.code,
      message: error?.message,
    });
    return {
      error:
        "Could not create the business. Confirm the latest Supabase schema is applied and try again.",
    };
  }

  await setActiveBusinessCookie(businessId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function selectBusiness(formData: FormData): Promise<void> {
  const businessId = formText(formData, "businessId");
  if (!UUID_PATTERN.test(businessId)) {
    throw new Error("Choose a valid business.");
  }

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const { data: membership, error } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not verify business access: ${error.message}`);
  }
  if (!membership) throw new Error("You do not have access to that business.");

  await setActiveBusinessCookie(businessId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
