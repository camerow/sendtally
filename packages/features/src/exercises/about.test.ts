import { describe, expect, it } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import { exerciseAbout } from "./about";

const exercise = (name: string, description: string): Exercise => ({
  id: name,
  name,
  kind: "strength",
  measure: "reps",
  eachSide: false,
  progress: null,
  builtIn: null,
  description,
  archived: false,
});

describe("exerciseAbout", () => {
  const mine = [exercise("Front lever", "Hold it straight."), exercise("Squat", "")];

  it("finds the item's exercise in any case, under the name shown", () => {
    expect(exerciseAbout(mine, " front LEVER", "Front lever · A")).toEqual({
      kind: "strength",
      name: "Front lever · A",
      description: "Hold it straight.",
    });
  });

  it("has none without a description, an exercise, or the list", () => {
    expect(exerciseAbout(mine, "Squat", "Squat")).toBeUndefined();
    expect(exerciseAbout(mine, "Plank", "Plank")).toBeUndefined();
    expect(exerciseAbout(null, "Front lever", "Front lever")).toBeUndefined();
  });
});
