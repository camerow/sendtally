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
  description: "",
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
  workouts: [legs],
  ...over,
});

describe("exerciseShelves", () => {
  it("shelves every category, leaving out archived exercises and hidden grips", () => {
    const shelves = exerciseShelves(world());
    const of = (kind: string): string[] =>
      shelves
        .find((s) => s.kind === kind)
        ?.entries.filter((e) => !e.library)
        .map((e) => e.name) ?? [];
    expect(of("strength")).toEqual(["Back squat", "Bench press"]);
    expect(of("hangboard")).toEqual(["Half crimp"]);
    expect(shelves.find((s) => s.kind === "hangboard")?.entries[0]?.source).toMatchObject({
      grip: { id: "g1" },
    });
  });

  it("adds the built-ins the user has not made their own, by link or by name", () => {
    const strength = exerciseShelves(
      world({
        exercises: [exercise("e1", "Back squat"), exercise("e2", "Mine", { builtIn: "dips" })],
      })
    ).find((s) => s.kind === "strength")!.entries;
    const library = strength.filter((e) => e.library);
    expect(library.some((e) => e.name === "Pull-ups")).toBe(true);
    expect(library.find((e) => e.name === "Pull-ups")?.source).toMatchObject({
      builtIn: { id: "pullUps" },
    });
    expect(library.some((e) => e.name === "Back squat" || e.name === "Dips")).toBe(false);
  });

  it("lists the user's own before the library on a shelf", () => {
    const strength = exerciseShelves(world()).find((s) => s.kind === "strength")!.entries;
    expect(shelfRows(strength, 2).map((c) => c.name)).toEqual(["Back squat", "Bench press"]);
  });

  it("reads how many workouts use an exercise or grip, else nothing", () => {
    const hang = { kind: "hangboard", items: [{ exercise: "g1", doses: [{ sets: 1 }] }] };
    const shelves = exerciseShelves(world({ workouts: [legs, legs, hang as unknown as Workout] }));
    const strength = shelves.find((s) => s.kind === "strength")!.entries.filter((e) => !e.library);
    expect(strength.map((e) => e.meta)).toEqual(["In 2 workouts", null]);
    expect(shelves.find((s) => s.kind === "hangboard")?.entries[0]?.meta).toBe("In 1 workout");
  });

  it("puts ones in a workout first on a shelf", () => {
    const strength = exerciseShelves(world()).find((s) => s.kind === "strength")!.entries;
    expect(shelfRows([...strength].reverse(), 1).map((c) => c.name)).toEqual(["Back squat"]);
  });
});
