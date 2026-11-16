import { describe, expect, it } from "vitest";
import { workoutKindOf, type WorkoutKind } from "./plan";

const KINDS: Record<string, WorkoutKind> = {
  half: "hangboard",
  open: "hangboard",
  "Pull-ups": "strength",
  "Push-ups": "strength",
  "4x4s": "climbing",
  "Hip openers": "mobility",
};
const kindOf = (e: string): WorkoutKind => KINDS[e] ?? "other";

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
});
