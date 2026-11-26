import { describe, expect, it } from "vitest";
import { hasSamePartyIdentity } from "@/lib/credit/party-identity";

describe("hasSamePartyIdentity", () => {
  it("detects matching names and phone numbers despite case and punctuation", () => {
    expect(
      hasSamePartyIdentity(
        { name: "  Ram Thapa ", phone: "980-000-0001" },
        { name: "ram thapa", phone: "9800000001" },
      ),
    ).toBe(true);
  });

  it("allows a matching name when either party has no phone number", () => {
    expect(
      hasSamePartyIdentity(
        { name: "Ram Thapa", phone: null },
        { name: "ram thapa", phone: "9800000001" },
      ),
    ).toBe(false);
  });
});
