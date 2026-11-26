import { createHash } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/app/invite/actions";
import { AuthPage } from "@/components/auth/auth-page";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface InvitationDetails {
  status: "pending" | "invalid" | "revoked" | "accepted" | "expired" | "email_mismatch";
  businessName?: string;
  invitedEmail?: string;
  role?: "admin" | "staff";
  expiresAt?: string;
}

export default async function InvitationPage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase.rpc("get_business_invitation", {
    p_token_hash: tokenHash,
  });

  if (error) {
    return (
      <AuthPage title="Invitation unavailable" description="We could not verify this invitation.">
        <p role="alert" className="text-sm text-red-700">{error.message}</p>
      </AuthPage>
    );
  }

  const invitation = (data ?? { status: "invalid" }) as InvitationDetails;

  if (invitation.status !== "pending") {
    const descriptions: Record<InvitationDetails["status"], string> = {
      invalid: "This invitation link is invalid.",
      revoked: "This invitation has been revoked.",
      accepted: "This invitation has already been accepted.",
      expired: "This invitation has expired.",
      email_mismatch: "Sign in with the email address that received this invitation.",
      pending: "",
    };
    return (
      <AuthPage title="Invitation unavailable" description={descriptions[invitation.status]}>
        <Link href="/dashboard" className="text-sm font-semibold text-[#0C3B37] underline">
          Go to BizTrack
        </Link>
      </AuthPage>
    );
  }

  return (
    <AuthPage
      title={`Join ${invitation.businessName ?? "the business"}`}
      description={`You were invited to join as ${invitation.role ?? "staff"}.`}
    >
      <p className="mb-5 text-sm text-stone-600">
        Accepting will give this account access to the business workspace.
      </p>
      <form action={acceptInvitation}>
        <input type="hidden" name="token" value={token} />
        <Button type="submit" className="h-11 w-full bg-[#0C3B37] text-white">
          Accept invitation
        </Button>
      </form>
    </AuthPage>
  );
}
