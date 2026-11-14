import { describe, expect, it } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import type { Workout } from "@sendtally/core/hang";
import { exerciseShelves, shelfRows, type ShelfWorld } from "./shelfCards";

const exercise = (id: string, name: string, extra: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
  ...extra,
});

const legs = {
  kind: "strength",
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5, weightKg: 80 }] }],
} as unknown as Workout;

const world = (over: Partial<ShelfWorld> = {}): ShelfWorld => ({
  exercises: [
    exercise("e1", "Back squat"),
    exercise("e2", "Bench press"),
    exercise("e3", "Old lift", { archived: true }),
  ],
  grips: [
    { id: "g1", name: "Half crimp", custom: false, hidden: false },
    { id: "g2", name: "Gone", custom: true, hidden: true },
  ],
  sessions: [],
  series: [],
  workouts: [legs],
  today: "2026-11-12",
  unit: "kg",
  ...over,
});

describe("exerciseShelves", () => {
  it("shelves every category, leaving out archived exercises and hidden grips", () => {
    const shelves = exerciseShelves(world());
    const of = (kind: string): string[] =>
      shelves.find((s) => s.kind === kind)?.entries.map((e) => e.name) ?? [];
    expect(of("strength")).toEqual(["Back squat", "Bench press"]);
    expect(of("hangboard")).toEqual(["Half crimp"]);
    expect(shelves.find((s) => s.kind === "hangboard")?.entries[0]?.opens).toEqual({ grip: "g1" });
  });

  it("reads an exercise not yet done by the dose a workout gives it, else nothing", () => {
    const strength = exerciseShelves(world()).find((s) => s.kind === "strength")!.entries;
    expect(strength[0]?.meta).toContain("5 × 5");
    expect(strength[1]?.meta).toBeNull();
  });

  it("puts done ones first on a shelf", () => {
    const strength = exerciseShelves(world()).find((s) => s.kind === "strength")!.entries;
    expect(shelfRows([...strength].reverse(), 1).map((c) => c.name)).toEqual(["Back squat"]);
  });
});
