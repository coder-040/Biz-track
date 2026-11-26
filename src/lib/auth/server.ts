import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  can,
  normalizePermissionOverrides,
  type BusinessPermission,
  type BusinessRole,
  type PermissionOverrides,
} from "@/lib/auth/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ACTIVE_BUSINESS_COOKIE = "biztrack_active_business";

interface MembershipRow {
  business_id: string;
  role: string;
  permissions: unknown;
}

interface BusinessRow {
  id: string;
  name: string;
  business_type: string | null;
  currency: string;
}

export interface BusinessOption {
  id: string;
  name: string;
  role: BusinessRole;
  permissions: PermissionOverrides;
}

export interface CurrentBusinessContext {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: User;
  business: BusinessRow;
  role: BusinessRole;
  permissions: PermissionOverrides;
  memberships: BusinessOption[];
}

interface ResolvedBusinessContext {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: User | null;
  memberships: Array<MembershipRow & { business: BusinessRow }>;
  active: (MembershipRow & { business: BusinessRow }) | null;
}

function isBusinessRole(value: string): value is BusinessRole {
  return value === "owner" || value === "admin" || value === "staff";
}

async function getAuthenticatedUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (error.status === 401 || error.name === "AuthSessionMissingError") {
      return null;
    }
    throw new Error(`Could not verify the current user: ${error.message}`);
  }

  return data.user;
}

export async function requireAuthenticatedUser(): Promise<User> {
  const supabase = await createServerSupabaseClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect("/login");
  return user;
}

async function resolveBusinessContext(): Promise<ResolvedBusinessContext> {
  const supabase = await createServerSupabaseClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return { supabase, user: null, memberships: [], active: null };
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, role, permissions")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (membershipError) {
    throw new Error(`Could not load business memberships: ${membershipError.message}`);
  }

  const memberships = (membershipRows ?? []) as MembershipRow[];
  if (memberships.some((membership) => !isBusinessRole(membership.role))) {
    throw new Error("A business membership has an unsupported role.");
  }

  if (memberships.length === 0) {
    return { supabase, user, memberships: [], active: null };
  }

  const businessIds = memberships.map((membership) => membership.business_id);
  const { data: businessRows, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, business_type, currency")
    .in("id", businessIds)
    .eq("is_active", true);

  if (businessError) {
    throw new Error(`Could not load authorized businesses: ${businessError.message}`);
  }

  const businesses = (businessRows ?? []) as BusinessRow[];
  const options = memberships
    .flatMap((membership) => {
      const business = businesses.find(
        (candidate) => candidate.id === membership.business_id,
      );
      return business
        ? [{ ...membership, business }]
        : [];
    });

  const cookieStore = await cookies();
  const selectedBusinessId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const selected = options.find(
    (membership) => membership.business_id === selectedBusinessId,
  );
  const active =
    selected ?? (options.length === 1 ? options[0] : null);

  return { supabase, user, memberships: options, active };
}

export async function requireBusinessContext(): Promise<CurrentBusinessContext> {
  const context = await resolveBusinessContext();

  if (!context.user) redirect("/login");
  if (context.memberships.length === 0) redirect("/setup/business");
  if (!context.active) redirect("/business/select");

  return {
    supabase: context.supabase,
    user: context.user,
    business: context.active.business,
    role: context.active.role as BusinessRole,
    permissions: normalizePermissionOverrides(context.active.permissions),
    memberships: context.memberships.map((membership) => ({
      id: membership.business_id,
      name: membership.business.name,
      role: membership.role as BusinessRole,
      permissions: normalizePermissionOverrides(membership.permissions),
    })),
  };
}

export async function requireBusinessPermission(
  permission: BusinessPermission,
): Promise<CurrentBusinessContext> {
  return requireBusinessPermissions(permission);
}

export async function requireBusinessPermissions(
  ...permissions: BusinessPermission[]
): Promise<CurrentBusinessContext> {
  const context = await requireBusinessContext();
  if (
    permissions.some(
      (permission) => !can(context.role, permission, context.permissions),
    )
  ) {
    redirect("/access-denied");
  }
  return context;
}

export async function getCurrentBusinessSummary() {
  const context = await resolveBusinessContext();

  if (!context.user) return null;

  const { data: profile, error } = await context.supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", context.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the user profile: ${error.message}`);
  }

  return {
    user: {
      id: context.user.id,
      email: context.user.email ?? "",
      fullName:
        profile?.full_name ||
        String(context.user.user_metadata.full_name ?? ""),
    },
    memberships: context.memberships.map((membership) => ({
      id: membership.business_id,
      name: membership.business.name,
      role: membership.role as BusinessRole,
      permissions: normalizePermissionOverrides(membership.permissions),
    })),
    activeBusinessId: context.active?.business_id ?? null,
    activeBusinessName: context.active?.business.name ?? null,
    activeRole: context.active?.role as BusinessRole | null ?? null,
    activePermissions: context.active
      ? normalizePermissionOverrides(context.active.permissions)
      : {},
  };
}

export async function setActiveBusinessCookie(businessId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
