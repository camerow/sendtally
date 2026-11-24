import { describe, expect, it } from "vitest";
import { createBody, NEW_WORKOUT, withExerciseKind, withWorkoutKind } from "./libraryDraft";

const text = { name: " Pull day ", description: "", names: { de: " Zugtag ", fr: "" } };

describe("library draft", () => {
  it("keeps a measure the new kind takes, else its first", () => {
    const draft = { kind: "strength" as const, measure: "repsWeight" as const, dose: null };
    expect(withExerciseKind(draft, "climbing").measure).toBe("reps");
    expect(withExerciseKind({ ...draft, measure: "seconds" }, "mobility").measure).toBe("seconds");
  });

  it("empties the items moving into hangboard, and leaves it without minutes or target RPE", () => {
    const strength = {
      ...NEW_WORKOUT,
      minutes: 40,
      targetRpe: 7,
      items: [{ key: "a", ref: { exercise: "pullUps" }, doses: [{ sets: 3 }] }],
    };
    expect(withWorkoutKind(strength, "mobility").items).toHaveLength(1);
    expect(withWorkoutKind(strength, "hangboard")).toMatchObject({
      items: [],
      minutes: null,
      targetRpe: null,
    });
  });

  it("trims the text, drops empty names, and strips edge and weight from hangboard doses", () => {
    const body = createBody(text, {
      type: "workout",
      draft: {
        ...NEW_WORKOUT,
        kind: "hangboard",
        items: [
          {
            key: "a",
            ref: { grip: "half" },
            doses: [{ sets: 5, onS: 10, edgeMm: 20, weightKg: 5 }],
          },
        ],
      },
    });
    expect(body).toEqual({
      name: "Pull day",
      description: "",
      names: { de: "Zugtag" },
      spec: {
        kind: "hangboard",
        focus: null,
        minutes: null,
        targetRpe: null,
        items: [{ grip: "half", doses: [{ sets: 5, onS: 10 }] }],
      },
    });
  });
});
