import { describe, expect, it } from "vitest";
import {
  validateBusinessSetup,
  validateRegistration,
} from "@/lib/auth/validation";

describe("validateRegistration", () => {
  it("normalizes the email and trims the full name", () => {
    expect(
      validateRegistration({
        fullName: "  Sita Gurung ",
        email: "  SITA@example.com ",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
        phone: "",
      }),
    ).toEqual({
      success: true,
      data: {
        fullName: "Sita Gurung",
        email: "sita@example.com",
        password: "SecurePass123",
        phone: null,
      },
    });
  });

  it("rejects a confirmation that does not match the password", () => {
    const result = validateRegistration({
      fullName: "Sita Gurung",
      email: "sita@example.com",
      password: "SecurePass123",
      confirmPassword: "DifferentPass123",
      phone: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("validateBusinessSetup", () => {
  it("requires a business name and defaults currency to NPR", () => {
    expect(
      validateBusinessSetup({
        name: "  Pokhara Stationery ",
        type: "Stationery",
        phone: "",
        email: "",
        address: "",
        currency: "",
        description: "",
      }),
    ).toEqual({
      success: true,
      data: {
        name: "Pokhara Stationery",
        type: "Stationery",
        phone: null,
        email: null,
        address: null,
        currency: "NPR",
        description: null,
      },
    });
  });
});
