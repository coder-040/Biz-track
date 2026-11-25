import { describe, expect, it } from "vitest";
import { addDaysISO, todayISOInTimeZone } from "./date";

describe("business date helpers", () => {
  it("uses the requested timezone when the date differs from UTC", () => {
    expect(
      todayISOInTimeZone("Asia/Kathmandu", new Date("2026-11-25T22:15:00.000Z")),
    ).toBe("2026-11-26");
  });

  it("adds calendar days without shifting dates by the host timezone", () => {
    const today = "2026-11-26";
    const weekStart = addDaysISO(today, -6);

    expect(weekStart).toBe("2026-11-20");
    expect(addDaysISO(weekStart, 6)).toBe(today);
  });
});
