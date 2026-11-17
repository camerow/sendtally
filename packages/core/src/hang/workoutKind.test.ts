import { describe, expect, it } from "vitest";
import { exerciseKinds } from "./exercise";
import { gripsTogether, workoutKindOf, type WorkoutKind } from "./plan";

const KINDS: Record<string, WorkoutKind> = {
  half: "hangboard",
  open: "hangboard",
  "Pull-ups": "strength",
  "Push-ups": "strength",
  "4x4s": "climbing",
  "Hip openers": "mobility",
};
const kindOf = (e: string): WorkoutKind | undefined => KINDS[e];

describe("workoutKindOf", () => {
  it("is hangboard when every exercise is a grip", () => {
    expect(workoutKindOf(["half", "open"], kindOf, "other")).toBe("hangboard");
  });

  it("takes the kind most exercises share", () => {
    expect(workoutKindOf(["4x4s", "Pull-ups", "Push-ups"], kindOf, "other")).toBe("strength");
  });

  it("gives a tie to the first exercise", () => {
    expect(workoutKindOf(["Hip openers", "Pull-ups"], kindOf, "other")).toBe("mobility");
    expect(workoutKindOf(["Pull-ups", "Hip openers"], kindOf, "other")).toBe("strength");
  });

  it("keeps its kind with no exercises", () => {
    expect(workoutKindOf([], kindOf, "climbing")).toBe("climbing");
  });

  it("stops being Fingers once its last grip goes", () => {
    expect(workoutKindOf([], kindOf, "hangboard")).toBe("other");
  });

  it("leaves grips out of the vote beside other exercises", () => {
    expect(workoutKindOf(["half", "open", "Hip openers"], kindOf, "other")).toBe("mobility");
    expect(workoutKindOf(["half", "4x4s", "Pull-ups", "Push-ups"], kindOf, "other")).toBe(
      "strength"
    );
  });

  it("counts an exercise of no known kind as the kind it had", () => {
    expect(workoutKindOf(["half", "g-new"], kindOf, "hangboard")).toBe("hangboard");
    expect(workoutKindOf(["half", "Warm-up"], kindOf, "mobility")).toBe("mobility");
  });
});

describe("exerciseKinds", () => {
  const isGrip = (e: string): boolean => e === "half";
  const kindIn = exerciseKinds(
    [
      { name: "Back squat", kind: "strength" },
      { name: "back squat", kind: "mobility" },
    ],
    isGrip
  );

  it("reads grips as Fingers and names in any case, the later exercise winning", () => {
    expect(kindIn("half")).toBe("hangboard");
    expect(kindIn("BACK SQUAT")).toBe("mobility");
    expect(kindIn("Unknown")).toBeUndefined();
  });
});

describe("gripsTogether", () => {
  const isGrip = (e: string): boolean => e === "half" || e === "open";
  const of = (...names: string[]): { exercise: string }[] =>
    names.map((exercise) => ({ exercise }));
  const names = (items: { exercise: string }[]): string[] => items.map((i) => i.exercise);

  it("moves every grip to the first grip's place, keeping both orders", () => {
    expect(
      names(gripsTogether(of("Warm-up", "half", "Pull-ups", "open", "Cool-down"), isGrip))
    ).toEqual(["Warm-up", "half", "open", "Pull-ups", "Cool-down"]);
  });

  it("leaves a list with grips together, or none, as it was", () => {
    expect(names(gripsTogether(of("Warm-up", "half", "open"), isGrip))).toEqual([
      "Warm-up",
      "half",
      "open",
    ]);
    expect(names(gripsTogether(of("Warm-up", "Pull-ups"), isGrip))).toEqual([
      "Warm-up",
      "Pull-ups",
    ]);
  });
});
