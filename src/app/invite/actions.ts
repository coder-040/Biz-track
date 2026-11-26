"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { can, type BusinessRole } from "@/lib/auth/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { setActiveBusinessCookie } from "@/lib/auth/server";

function landingPathForRole(role: string | null | undefined): string {
  if (role !== "owner" && role !== "admin" && role !== "staff") {
    return "/inventory";
  }
  const businessRole: BusinessRole = role;
  if (can(businessRole, "view_dashboard")) return "/dashboard";
  if (can(businessRole, "view_products")) return "/inventory";
  return "/access-denied";
}

export async function acceptInvitation(formData: FormData): Promise<void> {
  const user = await requireAuthenticatedUser();
  const token = formText(formData, "token");
  if (!token) throw new Error("This invitation link is invalid.");

  const supabase = await createServerSupabaseClient({ setCookies: true });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc("accept_business_invitation", {
    p_token_hash: tokenHash,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (typeof data !== "string") {
    throw new Error("Could not accept this invitation.");
  }

  const businessId = data;

  const { data: membership } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  await setActiveBusinessCookie(businessId);
  revalidatePath("/", "layout");
  redirect(landingPathForRole(membership?.role));
}

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
