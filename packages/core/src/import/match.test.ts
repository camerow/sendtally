import { describe, expect, it } from "vitest";
import {
  applyMatch,
  dateIn,
  dateOrderOf,
  MATCH_CELL_MAX,
  MATCH_MAX_COLUMNS,
  matchSample,
  sampleFits,
  sheetOf,
  unusedColumns,
} from "./match";
import { planImport } from "./plan";
import type { ColumnMatch } from "./types";

const none = {
  climb: null,
  otherGrade: null,
  result: null,
  tries: null,
  where: null,
  notes: null,
} satisfies Partial<ColumnMatch>;

const fillDown = `When,Problem,Grade,Sent?,Goes,Crag,Comments,Shoes,Partner
03/04/22,The Hulk,V6,y,3,Stone Fort,Finally stuck the lip,Solution,Sam
,Super Mario,V4,n,5,,,,
,,,,,,warm up chat,,
04/04/22,Celestial Mechanics,5,Y,,Little Rock City,,,
`;

const fillDownMatch: ColumnMatch = {
  ...none,
  date: "When",
  climb: "Problem",
  grade: { column: "Grade", scale: "v" },
  result: {
    column: "Sent?",
    values: [
      { value: "y", means: "send" },
      { value: "n", means: "attempt" },
    ],
  },
  tries: "Goes",
  where: { column: "Crag", kind: "crag" },
  notes: "Comments",
};

describe("applyMatch", () => {
  it("fills dates and places down, reads a y/n column, and keeps the user's row numbers", () => {
    const sheet = sheetOf(fillDown)!;
    expect(dateOrderOf(sheet, "When")).toBe("ask");
    const plan = planImport(applyMatch(sheet, fillDownMatch, "dmy"), "UTC");
    expect(plan.issues).toEqual([]);
    expect(plan.sessions.map((s) => [s.date, s.name, s.location, s.rows])).toEqual([
      ["2022-04-03", "Stone Fort", "outdoor", [2, 3]],
      ["2022-04-04", "Little Rock City", "outdoor", [5]],
    ]);
    expect(plan.sessions[0]!.climbs.map((c) => [c.name, c.kind, c.tries, c.note])).toEqual([
      ["The Hulk", "send", 3, "Finally stuck the lip"],
      ["Super Mario", "attempt", 5, undefined],
    ]);
    expect(plan.sessions[1]!.climbs[0]!.grade).toEqual({ scale: "v", value: 5 });
    expect(unusedColumns(sheet, fillDownMatch)).toEqual(["Shoes", "Partner"]);
  });

  it("reads the month first when told to", () => {
    const plan = planImport(applyMatch(sheetOf(fillDown)!, fillDownMatch, "mdy"), "UTC");
    expect(plan.sessions.map((s) => s.date)).toEqual(["2022-03-04", "2022-04-04"]);
  });

  it("takes whichever of a boulder and a route grade column is filled, in its scale", () => {
    const sheet = sheetOf(`Day,Name,Boulder grade,Route grade,Result,Gym
2024-01-31 18:30,Pink one,6a+,,flash,The Arch
2024-01-31,Lead lap,,11b,fell,
31/01/2024,Blue one,6c,,send,The Arch
`)!;
    expect(dateOrderOf(sheet, "Day")).toBe("dmy");
    const match: ColumnMatch = {
      ...none,
      date: "Day",
      climb: "Name",
      grade: { column: "Boulder grade", scale: "font" },
      otherGrade: { column: "Route grade", scale: "yds" },
      result: { column: "Result", values: [{ value: "fell", means: "attempt" }] },
      where: { column: "Gym", kind: "gym" },
    };
    const plan = planImport(applyMatch(sheet, match, "dmy"), "UTC");
    expect(plan.issues).toEqual([]);
    expect(plan.sessions).toHaveLength(1);
    expect(plan.sessions[0]!.gym).toBe("The Arch");
    expect(plan.sessions[0]!.location).toBe("indoor");
    expect(plan.sessions[0]!.climbs.map((c) => [c.grade.scale, c.kind, c.style])).toEqual([
      ["font", "send", "flash"],
      ["yds", "attempt", undefined],
      ["font", "send", undefined],
    ]);
  });

  it("leaves what it cannot read to the importer's own issues", () => {
    const sheet = sheetOf(`Date,Grade,Sent
last Tuesday,V3,y
2024-02-01,V3,maybe
2024-02-01,V4,y
`)!;
    const plan = planImport(
      applyMatch(
        sheet,
        {
          ...none,
          date: "Date",
          grade: { column: "Grade", scale: null },
          result: { column: "Sent", values: [] },
        },
        "dmy"
      ),
      "UTC"
    );
    expect(plan.issues.map((i) => [i.row, i.code])).toEqual([
      [2, "badDate"],
      [3, "badKind"],
    ]);
  });
});

describe("dateIn", () => {
  it("reads ISO, two-digit years and rejects impossible days", () => {
    expect(dateIn("2023/7/4", "mdy")).toBe("2023-07-04");
    expect(dateIn("7.4.99", "dmy")).toBe("1999-04-07");
    expect(dateIn("31/31/2020", "dmy")).toBe("31/31/2020");
  });
});

describe("matchSample", () => {
  it("sends the header and at most 20 rows", () => {
    const text = ["a,b", ...Array.from({ length: 30 }, (_, i) => `${i},x`)].join("\n");
    const sample = matchSample(sheetOf(text)!);
    expect(sample.header).toEqual(["a", "b"]);
    expect(sample.rows).toHaveLength(20);
  });

  it("cuts long cells and extra columns, and drops rows until the sample fits", () => {
    const note = "n".repeat(5000);
    const wide = Array.from({ length: 100 }, (_, i) => `c${i}`);
    const text = [
      ["Date", "Grade", "Notes", ...wide].join(","),
      ...Array.from({ length: 20 }, () => ["2024-01-01", "V3", note, ...wide].join(",")),
    ].join("\n");
    const sheet = sheetOf(text)!;
    const sample = matchSample(sheet);
    expect(sample.header).toHaveLength(MATCH_MAX_COLUMNS);
    expect(sample.rows.every((r) => r.every((c) => c.length <= MATCH_CELL_MAX))).toBe(true);
    expect(sample.rows.length).toBeGreaterThan(0);
    expect(sampleFits(sample.header, sample.rows)).toBe(true);
    const match: ColumnMatch = {
      ...none,
      date: "Date",
      grade: { column: "Grade", scale: null },
      notes: "Notes",
    };
    const plan = planImport(applyMatch(sheet, match, "dmy"), "UTC");
    expect(plan.sessions[0]!.climbs[0]!.note).toHaveLength(2000);
  });
});

describe("sheetOf", () => {
  it("numbers a repeated column name so each column can be picked", () => {
    const sheet = sheetOf("Date,Grade,Grade,Grade\n2024-01-01,,V4,5.10a\n")!;
    expect(sheet.header).toEqual(["Date", "Grade", "Grade (2)", "Grade (3)"]);
    const match: ColumnMatch = {
      ...none,
      date: "Date",
      grade: { column: "Grade (2)", scale: null },
    };
    const plan = planImport(applyMatch(sheet, match, "dmy"), "UTC");
    expect(plan.sessions[0]!.climbs[0]!.grade).toEqual({ scale: "v", value: 4 });
  });
});
