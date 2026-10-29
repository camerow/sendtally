import { afterEach, describe, expect, it, vi } from "vitest";
import { bucketsFor } from "./buckets";

afterEach(() => vi.restoreAllMocks());

describe("bucketsFor", () => {
  it("ends the week on the climber's today, not UTC's, on an evening west of Greenwich", () => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(420);
    const evening = new Date("2026-10-29T00:30:00Z");
    const days = bucketsFor("7d", evening, null);
    expect(new Date(days[6]!.start).toISOString().slice(0, 10)).toBe("2026-10-28");
  });
});
