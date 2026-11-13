import { describe, expect, it } from "vitest";
import type { ImportSession } from "@sendtally/core/import";
import { importAll, issueText } from "./upload";

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

  it("explains a row issue with its value", () => {
    expect(issueText({ row: 48, code: "unknownGrade", value: "5.4" })).toBe(
      '"5.4" is not a grade Sendtally knows.'
    );
  });
});
