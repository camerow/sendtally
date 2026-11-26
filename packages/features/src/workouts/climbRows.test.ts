import { describe, expect, it } from "vitest";
import {
  startExercise,
  withExerciseClimb,
  withSetPressed,
  withWallStarted,
} from "../log-session/exerciseTally";
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
  it("shows each set's climbs, the one being climbed, and the set the grades go to", () => {
    let draft = startExercise(null, fours, NOW);
    for (const g of ["V5", "V6", "V5", "V6"]) draft = climb(draft, g);
    draft = { ...draft, exercise: { ...draft.exercise!, set: 2 } };
    draft = climb(draft, "V5", "fell");
    const rows = climbRows(draft, 0, { sets: 3, climbs: 4 });
    expect(rows.map((r) => [r.set, r.state, r.picked, r.climbs.map((c) => c.grade)])).toEqual([
      [1, "done", false, ["V5", "V6", "V5", "V6"]],
      [2, "current", true, ["V5"]],
      [3, "waiting", false, []],
    ]);
    const back = withSetPressed(draft, 1, NOW).draft;
    expect(climbRows(back, 0, { sets: 3 }).map((r) => [r.state, r.picked])).toEqual([
      ["done", true],
      ["current", false],
      ["waiting", false],
    ]);
  });

  it("gives a time set that ended its time on the wall", () => {
    const wall = { item: 1, name: "Volume", sets: 2, onS: 600, restS: 180 };
    let draft = climb(withWallStarted(startExercise(null, wall, NOW), NOW), "V4");
    draft = withSetPressed(draft, 2, at(250)).draft;
    expect(climbRows(draft, 1, { sets: 2, onS: 600 }).map((r) => r.onS)).toEqual([250, null]);
  });

  it("keeps the last set picked once every set is done", () => {
    let draft = startExercise(null, { ...fours, sets: 1, climbs: 1 }, NOW);
    draft = withSetPressed(climb(draft, "V3"), 2, NOW).draft;
    expect(climbRows(draft, 0, { sets: 1 }).map((r) => [r.state, r.picked])).toEqual([
      ["done", true],
    ]);
  });

  it("reads an exercise the tally is not on from its climbs: sets climbed are done", () => {
    let draft = startExercise(tallyDraft(NOW), fours, NOW);
    draft = climb(climb(draft, "V3"), "V4");
    draft = { ...draft, exercise: undefined };
    const rows = climbRows(draft, 0, { sets: 2 });
    expect(rows.map((r) => [r.state, r.picked])).toEqual([
      ["done", false],
      ["waiting", false],
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
    expect(gymLine(undefined)).toBe("Select a gym");
  });
});
