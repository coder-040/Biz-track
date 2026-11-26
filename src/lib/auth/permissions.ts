export type BusinessRole = "owner" | "admin" | "staff";

export const BUSINESS_PERMISSIONS = [
  "view_dashboard",
  "view_products",
  "manage_inventory",
  "view_finances",
  "manage_finances",
  "view_reports",
  "manage_settings",
  "manage_members",
  "transfer_ownership",
  "delete_business",
] as const;

export type BusinessPermission = (typeof BUSINESS_PERMISSIONS)[number];
export type PermissionOverrides = Partial<
  Record<BusinessPermission, boolean>
>;

const OWNER_ONLY_PERMISSIONS: readonly BusinessPermission[] = [
  "transfer_ownership",
  "delete_business",
];

const ADMIN_DEFAULT_PERMISSIONS: readonly BusinessPermission[] = [
  "view_dashboard",
  "view_products",
  "manage_inventory",
  "view_finances",
  "manage_finances",
  "view_reports",
];

const STAFF_DEFAULT_PERMISSIONS: readonly BusinessPermission[] = [
  "view_products",
  "manage_inventory",
];

export function normalizePermissionOverrides(
  value: unknown,
): PermissionOverrides {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const overrides: PermissionOverrides = {};
  for (const permission of BUSINESS_PERMISSIONS) {
    const candidate = (value as Record<string, unknown>)[permission];
    if (typeof candidate === "boolean") {
      overrides[permission] = candidate;
    }
  }
  return overrides;
}

export function can(
  role: BusinessRole,
  permission: BusinessPermission,
  overrides: PermissionOverrides = {},
): boolean {
  if (role === "owner") return true;
  if (OWNER_ONLY_PERMISSIONS.includes(permission)) return false;
  if (overrides[permission] !== undefined) return overrides[permission];

  if (role === "admin") {
    return ADMIN_DEFAULT_PERMISSIONS.includes(permission);
  }

  return STAFF_DEFAULT_PERMISSIONS.includes(permission);
}
