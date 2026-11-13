import { describe, expect, it } from "vitest";
import type { ImportSession } from "@sendtally/core/import";
import { importAll, importResultText, issueText } from "./upload";

const session = (date: string): ImportSession => ({
  date,
  location: "indoor",
  climbs: [],
  rows: [2],
});

describe("import upload", () => {
  it("sends sessions in batches of 200 without their rows and sums the results", async () => {
    const sent: unknown[][] = [];
    const api = {
      importSessions: ({ sessions }: { sessions: unknown[] }) => {
        sent.push(sessions);
        return Promise.resolve({ imported: sessions.length - 1, skipped: 1 });
      },
    };
    const sessions = Array.from({ length: 450 }, (_, i) => session(`2024-01-${i}`));
    expect(await importAll(api, sessions)).toEqual({ imported: 447, skipped: 3 });
    expect(sent.map((b) => b.length)).toEqual([200, 200, 50]);
    expect(sent[0]![0]).toEqual({ date: "2024-01-0", location: "indoor", climbs: [] });
  });

  it("words the result for a new, partly seen and fully seen file", () => {
    expect(importResultText({ imported: 214, skipped: 0 })).toBe("Added 214 sessions");
    expect(importResultText({ imported: 1, skipped: 0 })).toBe("Added 1 session");
    expect(importResultText({ imported: 12, skipped: 202 })).toBe("Added 12 · 202 already there");
    expect(importResultText({ imported: 0, skipped: 214 })).toBe("All 214 already in your log");
  });

  it("explains a row issue with its value", () => {
    expect(issueText({ row: 48, code: "unknownGrade", value: "5.4" })).toBe(
      '"5.4" is not a grade Sendtally knows.'
    );
  });
});
