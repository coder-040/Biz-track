"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Copy, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  inviteMember,
  revokeInvitation,
  type MemberActionState,
} from "@/app/(workspace)/settings/members/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PendingInvitation {
  id: string;
  invited_email: string;
  role: "admin" | "staff";
  expires_at: string;
  created_at: string;
}

interface Member {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: "owner" | "admin" | "staff";
  joined_at: string;
  is_active: boolean;
}

const ROLE_LABEL: Record<Member["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
};

export function MembersClient({
  members,
  invitations,
  invitationsError,
}: {
  members: Member[];
  invitations: PendingInvitation[];
  invitationsError?: string | null;
}) {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(
    inviteMember,
    {},
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.success) toast.success(state.success);
  }, [state]);

  async function copyInvitation() {
    if (!state.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(state.inviteUrl);
      setCopied(true);
      setCopyError("");
      toast.success("Invitation link copied to clipboard.");
    } catch {
      setCopied(false);
      const message =
        "Could not copy the invitation link. Copy it from the address bar or try again.";
      setCopyError(message);
      toast.error(message);
    }
  }

  function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    startTransition(async () => {
      try {
        await revokeInvitation(invitationId);
        toast.success("Invitation revoked.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not revoke the invitation.",
        );
      } finally {
        setRevokingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#0C3B37]">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-stone-900">Invite an employee</h2>
            <p className="text-sm text-stone-500">Create a secure link that expires in 7 days, then send it from your email app.</p>
          </div>
        </div>

        <form action={action} className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="employee@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
              defaultValue="staff"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={pending} className="h-10 bg-[#0C3B37] text-white">
            {pending ? "Creating…" : "Create invitation"}
          </Button>
        </form>

        {state.error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <p role="status">{state.success}</p>
            {state.inviteUrl && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyInvitation}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `mailto:${encodeURIComponent(state.invitedEmail ?? "")}?subject=${encodeURIComponent("Invitation to join my BizTrack business")}&body=${encodeURIComponent(`Join my business on BizTrack:\n\n${state.inviteUrl ?? ""}`)}`;
                  }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open email app
                </Button>
                {copyError ? <p role="alert" className="basis-full text-xs text-red-700">{copyError}</p> : null}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">Business members</h2>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No members found.</p>
        ) : (
          <div className="mt-3 divide-y divide-stone-100">
            {members.map((member) => {
              const displayName =
                member.full_name?.trim() || member.email || "Team member";
              return (
                <div key={member.user_id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-900">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {member.email && member.email !== displayName ? `${member.email} · ` : ""}
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-[#0C3B37]/10 px-2.5 py-1 text-xs font-medium text-[#0C3B37]">
                      {ROLE_LABEL[member.role]}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs capitalize text-stone-600">
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">Pending invitations</h2>
        {invitationsError ? (
          <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Pending invitations could not be loaded ({invitationsError}). Apply the latest{" "}
            <code>supabase/schema.sql</code> in your Supabase project so invitations can be listed.
          </p>
        ) : invitations.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No pending invitations.</p>
        ) : (
          <div className="mt-3 divide-y divide-stone-100">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{invitation.invited_email}</p>
                  <p className="text-xs capitalize text-stone-500">
                    {invitation.role} · expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-700"
                  disabled={revokingId === invitation.id}
                  onClick={() => handleRevoke(invitation.id)}
                >
                  {revokingId === invitation.id ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
