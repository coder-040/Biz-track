"use client";

import { useActionState, useState } from "react";
import { Copy, Mail, UserPlus } from "lucide-react";
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
  role: "owner" | "admin" | "staff";
  joined_at: string;
  is_active: boolean;
}

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

  async function copyInvitation() {
    if (!state.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(state.inviteUrl);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopied(false);
      setCopyError("Could not copy the invitation link. Copy it from the address bar or try again.");
    }
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
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium capitalize text-stone-900">{member.role}</p>
                  <p className="text-xs text-stone-500">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs capitalize text-stone-600">
                  {member.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
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
                <form action={revokeInvitation}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-red-700">
                    Revoke
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
