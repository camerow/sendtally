import { describe, expect, it } from "@jest/globals";
import { importResultText } from "./importResultText";

describe("importResultText", () => {
  it("words the result for a new, partly seen and fully seen file", () => {
    expect(importResultText({ imported: 214, skipped: 0 })).toBe("Added 214 sessions");
    expect(importResultText({ imported: 1, skipped: 0 })).toBe("Added 1 session");
    expect(importResultText({ imported: 12, skipped: 202 })).toBe("Added 12 · 202 already there");
    expect(importResultText({ imported: 0, skipped: 214 })).toBe("All 214 already in your log");
  });
});
