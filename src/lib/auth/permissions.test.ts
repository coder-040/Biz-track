import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/permissions";

describe("can", () => {
  it("gives Staff inventory access but no financial access by default", () => {
    expect(can("staff", "manage_inventory")).toBe(true);
    expect(can("staff", "view_finances")).toBe(false);
  });

  it("allows additional Staff permissions only when explicitly granted", () => {
    expect(
      can("staff", "view_finances", { view_finances: true }),
    ).toBe(true);
    expect(can("staff", "view_finances", { view_finances: false })).toBe(false);
  });

  it("does not grant ownership operations to Admin", () => {
    expect(can("admin", "manage_finances")).toBe(true);
    expect(can("admin", "transfer_ownership")).toBe(false);
  });
});
