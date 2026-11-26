"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireBusinessPermissions } from "@/lib/auth/server";

export interface MemberActionState {
  error?: string;
  success?: string;
  inviteUrl?: string;
  invitedEmail?: string;
}

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function siteOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    return process.env.NODE_ENV === "production"
      ? null
      : "http://localhost:3000";
  }

  try {
    const url = new URL(configured);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export async function inviteMember(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const context = await requireBusinessPermissions("manage_members");
  const email = formText(formData, "email").trim().toLowerCase();
  const role = formText(formData, "role");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid employee email address." };
  }
  if (role !== "admin" && role !== "staff") {
    return { error: "Choose Staff or Admin." };
  }

  const origin = siteOrigin();
  if (!origin) {
    return {
      error:
        "Invitation links are not configured. Set NEXT_PUBLIC_SITE_URL to this app's HTTPS URL and try again.",
    };
  }

  const { data: pendingInvitation, error: pendingError } = await context.supabase
    .from("business_invitations")
    .select("id, expires_at")
    .eq("business_id", context.business.id)
    .eq("invited_email", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .maybeSingle();

  if (pendingError) {
    console.error("Could not check existing invitations; continuing.", {
      code: pendingError.code,
      message: pendingError.message,
    });
  }

  if (pendingInvitation) {
    if (Date.parse(pendingInvitation.expires_at) > Date.now()) {
      return { error: "This person already has a pending invitation." };
    }

    const { error: expireError } = await context.supabase
      .from("business_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", pendingInvitation.id)
      .eq("business_id", context.business.id);

    if (expireError) {
      return { error: `Could not replace the expired invitation: ${expireError.message}` };
    }
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error } = await context.supabase.from("business_invitations").insert({
    business_id: context.business.id,
    invited_email: email,
    role,
    token_hash: tokenHash,
    invited_by: context.user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An invitation for this email was just created. Refresh and check pending invitations." };
    }
    return { error: `Could not create the invitation: ${error.message}` };
  }

  revalidatePath("/settings/members");
  return {
    success: "Invitation link is ready. Send it to the employee using your email app.",
    invitedEmail: email,
    inviteUrl: `${origin}/invite/${token}`,
  };
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  const context = await requireBusinessPermissions("manage_members");
  const invitationId = formText(formData, "invitationId");
  if (!invitationId) throw new Error("Choose an invitation to revoke.");

  const { error } = await context.supabase
    .from("business_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("business_id", context.business.id)
    .is("revoked_at", null)
    .is("accepted_at", null);

  if (error) throw new Error(`Could not revoke the invitation: ${error.message}`);
  revalidatePath("/settings/members");
}
