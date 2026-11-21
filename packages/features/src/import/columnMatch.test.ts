import { describe, expect, it } from "vitest";
import { ApiError } from "@sendtally/api-client";
import type { ColumnMatch } from "@sendtally/core/import";
import {
  ambiguousDateText,
  columnsMatchedEvent,
  matchedPlan,
  matchRows,
  requestColumns,
  unusedText,
  withColumn,
} from "./columnMatch";

const csv = `When,Problem,Grade,Sent?,Partner
03/04/22,The Hulk,V6,y,Sam
,Super Mario,V4,n,
`;

const suggested: ColumnMatch = {
  date: "When",
  climb: "Problem",
  grade: { column: "Grade", scale: "v" },
  otherGrade: null,
  result: {
    column: "Sent?",
    values: [
      { value: "y", means: "send" },
      { value: "n", means: "attempt" },
    ],
  },
  tries: null,
  where: null,
  notes: null,
};

const answering = (answer: () => Promise<{ match: ColumnMatch | null }>) => ({
  matchColumns: answer,
});

describe("requestColumns", () => {
  it("asks the day order the file cannot settle and draws each field", async () => {
    const review = (await requestColumns(
      answering(async () => ({ match: suggested })),
      csv,
      "my climbs.csv"
    ))!;
    expect(review.ask).toBe(true);
    expect(ambiguousDateText(review)).toBe("03/04/22 could be April 3 or March 4.");
    expect(matchRows(review).map((r) => [r.label, r.column, r.sample])).toEqual([
      ["Date", "When", "03/04/22"],
      ["Climb", "Problem", "The Hulk"],
      ["Grade", "Grade", "V6"],
      ["Sent or attempt", "Sent?", "y is a send · n is an attempt"],
      ["Tries", null, ""],
      ["Where", null, ""],
      ["Climb notes", null, ""],
    ]);
    expect(unusedText(review)).toBe("Not imported: Partner.");
    const plan = matchedPlan(review, "UTC");
    expect(plan.format).toBe("spreadsheet");
    expect(plan.sessions.map((s) => [s.date, s.climbs.length])).toEqual([["2022-04-03", 2]]);
  });

  it("falls back on no match, the daily limit, or a failed request", async () => {
    for (const answer of [
      async () => ({ match: null }),
      async () => Promise.reject(new ApiError(429, "column matching limit reached")),
      async () => Promise.reject(new Error("offline")),
    ]) {
      expect(await requestColumns(answering(answer), csv, "f.csv")).toBeNull();
    }
  });
});

describe("withColumn", () => {
  it("edits a field, keeps date and grade, and counts the edit", async () => {
    const review = (await requestColumns(
      answering(async () => ({ match: suggested })),
      csv,
      "f.csv"
    ))!;
    const edited = withColumn(withColumn(review, "notes", "Partner"), "grade", null);
    expect(edited.match.notes).toBe("Partner");
    expect(edited.match.grade).toEqual(suggested.grade);
    expect(unusedText(edited)).toBeNull();
    expect(columnsMatchedEvent(edited, "matched")).toEqual({
      columns: 5,
      matched: 5,
      asked: 1,
      edited: 1,
      outcome: "matched",
    });
    const back = withColumn(withColumn(review, "result", "Partner"), "result", "Sent?");
    expect(back.match.result).toEqual(suggested.result);
  });
});
