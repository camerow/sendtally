import { describe, expect, it } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import { locks, madeCounts } from "./locks";

const exercise = (id: string, extra: Partial<Exercise> = {}): Exercise => ({
  id,
  name: id,
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  description: "",
  archived: false,
  ...extra,
});

const exercises = [
  exercise("Zercher carry"),
  exercise("Back squat", { builtIn: "backSquat" }),
  exercise("Bench press"),
];
const of = (...names: string[]) => names.map((name) => ({ exercise: name }));
const mine = { source: "mine" as const, items: of("Zercher carry", "Back squat") };
const builtIn = { source: "library" as const, items: of("Bench press", "Zercher carry") };
const ownGrip = { grip: { id: "g1", name: "Pinch", custom: true, hidden: false } };
const builtInGrip = { grip: { id: "half", name: "Half crimp", custom: false, hidden: false } };

describe("locks", () => {
  it("locks nothing with access", () => {
    const open = locks(true, exercises);
    expect(open.workout(mine)).toBe(false);
    expect(open.exercise({ exercise: exercise("e1") })).toBe(false);
    expect(open.exercise(ownGrip)).toBe(false);
    expect(open.day({ blockId: "b1" }, mine)).toBe(false);
    expect(open.block).toBe(false);
    expect(open.create).toBe(false);
  });

  it("locks what the user made, every block and every way to make one, and leaves built-ins open", () => {
    const shut = locks(false, exercises);
    expect(shut.workout(mine)).toBe(true);
    expect(shut.workout(builtIn)).toBe(false);
    expect(shut.exercise({ exercise: exercise("e1") })).toBe(true);
    expect(shut.exercise({ exercise: exercise("e2", { builtIn: "backSquat" }) })).toBe(false);
    expect(shut.exercise(ownGrip)).toBe(true);
    expect(shut.exercise(builtInGrip)).toBe(false);
    expect(shut.block).toBe(true);
    expect(shut.create).toBe(true);
  });

  it("leaves a built-in on its own day open, and locks one inside a block or a day of the user's own", () => {
    const shut = locks(false, exercises);
    expect(shut.day({ blockId: null }, builtIn)).toBe(false);
    expect(shut.day({ blockId: "b1" }, builtIn)).toBe(true);
    expect(shut.day({ blockId: null }, mine)).toBe(true);
  });

  it("matches the Worker: a scheduled built-in exercise or grip stays open, a scheduled custom one locks", () => {
    const shut = locks(false, exercises);
    const wrapper = (name: string) => ({ source: "mine" as const, items: of(name) });
    expect(shut.workout(wrapper("back squat"))).toBe(false);
    expect(shut.day({ blockId: null }, wrapper("Back squat"))).toBe(false);
    expect(shut.day({ blockId: null }, wrapper("half"))).toBe(false);
    expect(shut.day({ blockId: "b1" }, wrapper("half"))).toBe(true);
    expect(shut.day({ blockId: null }, wrapper("Zercher carry"))).toBe(true);
    expect(shut.day({ blockId: null }, wrapper("g1"))).toBe(true);
  });
});

describe("madeCounts", () => {
  it("counts the user's own workouts but not a scheduled built-in, every block, and their live exercises and grips", () => {
    expect(
      madeCounts({
        workouts: [
          mine,
          { source: "mine", items: of("Bench press") },
          { source: "mine", items: of("Back squat") },
          { source: "mine", items: of("half") },
          builtIn,
        ],
        blocks: [{}, {}],
        exercises: [...exercises, exercise("Old lift", { archived: true })],
        grips: [ownGrip.grip, builtInGrip.grip, { ...ownGrip.grip, id: "g2", hidden: true }],
      })
    ).toEqual({ workouts: 2, blocks: 2, exercises: 3 });
  });
});
