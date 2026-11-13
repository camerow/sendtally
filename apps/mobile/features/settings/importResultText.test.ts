import { describe, expect, it } from "@jest/globals";
import { importResultText } from "./importResultText";

describe("importResultText", () => {
  it("words the result for a new, partly seen and fully seen file", () => {
    expect(importResultText({ imported: 214, skipped: 0, likely: 0 })).toBe("Added 214 sessions");
    expect(importResultText({ imported: 1, skipped: 0, likely: 0 })).toBe("Added 1 session");
    expect(importResultText({ imported: 12, skipped: 202, likely: 0 })).toBe(
      "Added 12 · 202 already there"
    );
    expect(importResultText({ imported: 0, skipped: 214, likely: 0 })).toBe(
      "All 214 already in your log"
    );
    expect(importResultText({ imported: 9, skipped: 0, likely: 3 })).toBe(
      "Added 9 · 3 likely duplicates skipped"
    );
    expect(importResultText({ imported: 7, skipped: 2, likely: 1 })).toBe(
      "Added 7 · 2 already there · 1 likely duplicate skipped"
    );
  });
});
