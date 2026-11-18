import { describe, expect, it } from "vitest";
import { startExercise, withExerciseClimb, withWallStarted } from "../log-session/exerciseTally";
import { parseStoredDraft } from "../log-session/draftStore";
import { newTallyClimb, tallyDraft } from "../log-session/tally";
import type { LogSessionDraft } from "../log-session/types";
import { climbedKeys, climbRows, gymLine } from "./climbRows";

const NOW = new Date(2026, 10, 17, 18, 0);
const at = (s: number): Date => new Date(NOW.getTime() + s * 1000);
const climb = (draft: LogSessionDraft, grade: string, go: "sent" | "fell" = "sent") => {
  const next = newTallyClimb(draft, { kind: "grade", scale: "v", grade }, go);
  return withExerciseClimb(next.draft, next.key);
};
const fours = { item: 0, name: "4x4s", sets: 3, climbs: 4, restS: 240 };

describe("a climbing card's set rows", () => {
  it("shows each set's climbs, the one being climbed and what it still asks", () => {
    let draft = startExercise(null, fours, NOW);
    for (const g of ["V5", "V6", "V5", "V6"]) draft = climb(draft, g);
    draft = { ...draft, exercise: { ...draft.exercise!, set: 2 } };
    draft = climb(draft, "V5", "fell");
    const rows = climbRows(draft, 0, { sets: 3, climbs: 4 }, NOW);
    expect(rows.map((r) => [r.set, r.state, r.climbs.map((c) => c.grade), r.note])).toEqual([
      [1, "done", ["V5", "V6", "V5", "V6"], ""],
      [2, "current", ["V5"], "1 of 4 climbs"],
      [3, "waiting", [], "4 climbs"],
    ]);
  });

  it("counts a time set down in its row once its first grade starts it", () => {
    const wall = { item: 1, name: "Volume", sets: 2, onS: 600, restS: 180 };
    let draft = startExercise(null, wall, NOW);
    expect(climbRows(draft, 1, { sets: 2, onS: 600 }, NOW)[0]?.note).toBe("10:00");
    draft = climb(withWallStarted(draft, NOW), "V4");
    expect(climbRows(draft, 1, { sets: 2, onS: 600 }, at(11)).map((r) => r.note)).toEqual([
      "9:49 left",
      "10:00",
    ]);
    expect(climbRows(draft, 1, { sets: 2, onS: 600 }, at(150)).map((r) => r.fill)).toEqual([
      0.25,
      null,
    ]);
  });

  it("never counts a time set past its full time when the clock moves back before its start", () => {
    const wall = { item: 1, name: "Volume", sets: 2, onS: 600, restS: 180 };
    const draft = withWallStarted(startExercise(null, wall, NOW), NOW);
    expect(climbRows(draft, 1, { sets: 2, onS: 600 }, at(-90))[0]).toMatchObject({
      note: "10:00 left",
      fill: 0,
    });
  });

  it("picks a time set's countdown up from where it is stored, after a reload or the app in the background", () => {
    const wall = { item: 1, name: "Volume", sets: 2, onS: 600, restS: 180 };
    const draft = climb(withWallStarted(startExercise(null, wall, NOW), NOW), "V4");
    const stored = JSON.stringify({ draft, savedAt: NOW.toISOString() });
    const read = parseStoredDraft(stored, at(250))!.draft;
    expect(climbRows(read, 1, { sets: 2, onS: 600 }, at(250))[0]).toMatchObject({
      note: "5:50 left",
      climbs: [expect.objectContaining({ grade: "V4" })],
    });
  });

  it("reads an exercise the tally is not on from its climbs: sets climbed are done", () => {
    let draft = startExercise(tallyDraft(NOW), fours, NOW);
    draft = climb(climb(draft, "V3"), "V4");
    draft = { ...draft, exercise: undefined };
    const rows = climbRows(draft, 0, { sets: 2 }, NOW);
    expect(rows.map((r) => [r.state, r.note])).toEqual([
      ["done", "2 climbs"],
      ["waiting", "-"],
    ]);
  });
});

describe("the sets a climbing card has behind it", () => {
  it("counts the tally's item to the set it is on, another to its last set climbed", () => {
    let draft = startExercise(null, fours, NOW);
    draft = climb(climb(draft, "V3"), "V4");
    draft = { ...draft, exercise: { ...draft.exercise!, set: 2 } };
    const other = newTallyClimb(draft, { kind: "grade", scale: "v", grade: "V2" }, "sent");
    draft = {
      ...other.draft,
      climbs: other.draft.climbs.map((c) => (c.key === other.key ? { ...c, item: 3, set: 2 } : c)),
    };
    expect(climbedKeys(draft)).toEqual(["0:0", "3:0", "3:1"]);
    expect(climbedKeys(null)).toEqual([]);
  });
});

describe("where a climbing workout is climbed", () => {
  it("names the gym it is at, or says there is none", () => {
    expect(gymLine("Crux Boulders")).toBe("At Crux Boulders");
    expect(gymLine(undefined)).toBe("No gym");
  });
});
