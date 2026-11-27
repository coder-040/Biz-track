import { connection } from "next/server";
import { MembersClient } from "@/components/settings/members-client";
import { requireBusinessPermissions } from "@/lib/auth/server";

interface MemberRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: "owner" | "admin" | "staff";
  joined_at: string;
  is_active: boolean;
}

export default async function MembersPage() {
  await connection();
  const context = await requireBusinessPermissions("manage_members");

  const [membersResult, invitationsResult] = await Promise.all([
    context.supabase.rpc("list_business_members", {
      p_business_id: context.business.id,
    }),
    context.supabase
      .from("business_invitations")
      .select("id, invited_email, role, expires_at, created_at")
      .eq("business_id", context.business.id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (membersResult.error) {
    throw new Error(`Could not load business members: ${membersResult.error.message}`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Team members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite employees and control who can access {context.business.name}.
        </p>
      </header>
      <MembersClient
        members={(membersResult.data ?? []) as MemberRow[]}
        invitations={invitationsResult.data ?? []}
        invitationsError={invitationsResult.error?.message ?? null}
      />
    </main>
  );
}
