import { describe, expect, it } from "vitest";
import type { LibraryWorkout } from "../workouts/types";
import { builtInWorkout } from "../workouts/builtIns";
import { EMPTY_PATH, STARTERS, type PlanPath } from "./planPath";
import { buildWeekCompleted, buildWeekRows, weekOf } from "./useBuildWeek";

const own = { id: "mine", kind: "strength", source: "mine" } as LibraryWorkout;
const workout = (id: string): LibraryWorkout | undefined =>
  id === own.id ? own : builtInWorkout(id);

describe("the starters", () => {
  it("are all in the built-in library, Climbing first", () => {
    expect(STARTERS.filter((id) => builtInWorkout(id) === undefined)).toEqual([]);
    expect(STARTERS.map((id) => builtInWorkout(id)?.name)).toEqual([
      "Climbing",
      "Max hangs",
      "5x5 strength",
      "Antagonist push",
      "Core circuit",
      "Hip mobility flow",
    ]);
  });
});

describe("buildWeekRows", () => {
  it("lists the user's own workout first, then the starters, each picked or not with its days", () => {
    const p: PlanPath = {
      ...EMPTY_PATH,
      workouts: ["mine", "climb-session"],
      days: { mine: [0, 4] },
    };
    const rows = buildWeekRows(p, workout);
    expect(rows.map((r) => r.workout.id)).toEqual(["mine", ...STARTERS]);
    expect(rows.slice(0, 3).map(({ picked, days }) => ({ picked, days }))).toEqual([
      { picked: true, days: [0, 4] },
      { picked: true, days: [] },
      { picked: false, days: [] },
    ]);
  });

  it("leaves out a starter the library does not have", () => {
    const rows = buildWeekRows(EMPTY_PATH, (id) => (id === "max10" ? undefined : workout(id)));
    expect(rows.map((r) => r.workout.id)).not.toContain("max10");
    expect(rows).toHaveLength(STARTERS.length - 1);
  });
});

describe("the week and what leaving reports", () => {
  const p: PlanPath = {
    ...EMPTY_PATH,
    workouts: ["mine", "climb-session", "max10"],
    days: { "climb-session": [0, 4], max10: [2], mine: [] },
  };

  it("lights each day a placed workout lands on with its kind", () => {
    expect(weekOf(p, (id) => workout(id)?.kind)).toEqual([
      ["climbing"],
      null,
      ["hangboard"],
      null,
      ["climbing"],
      null,
      null,
    ]);
  });

  it("counts the placed workouts and the week's sessions, and whether one is the user's own", () => {
    const mine = (id: string): boolean => workout(id)?.source === "mine";
    expect(buildWeekCompleted(p, mine)).toEqual({ count: 2, sessions: 3, own: 0 });
    const withOwn: PlanPath = { ...p, days: { ...p.days, mine: [1] } };
    expect(buildWeekCompleted(withOwn, mine)).toEqual({ count: 3, sessions: 4, own: 1 });
    expect(buildWeekCompleted({ ...EMPTY_PATH, workouts: ["max10"] }, mine).sessions).toBe(0);
  });
});
