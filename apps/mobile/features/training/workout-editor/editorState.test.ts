import { describe, expect, it } from "@jest/globals";
import type { WorkoutDraft } from "@sendtally/features/workouts";
import {
  draftOfEditor,
  withAlternates,
  withoutStep,
  withoutVariation,
  withStepAdded,
  withStepCycled,
  withVariationAdded,
} from "./editorState";

const squat = { exercise: "Back squat", dose: { sets: 5, reps: 5 } };
const legs: WorkoutDraft = {
  kind: "strength",
  name: "Leg day",
  description: "Heavy",
  minutes: 50,
  targetRpe: 8,
  variations: [{ label: "", items: [squat] }],
  pattern: [0],
  exerciseRestS: 180,
};

describe("workout editor state", () => {
  it("round trips a workout unchanged", () => {
    expect(draftOfEditor(legs)).toEqual(legs);
  });

  it("saves trimmed text, an untitled name, and leaves unnamed exercises out", () => {
    const blank = { exercise: "  ", dose: { sets: 3 } };
    const state = {
      ...legs,
      name: "  ",
      description: " Slow ",
      variations: [{ label: " 5×5 ", items: [squat, blank] }],
    };
    expect(draftOfEditor(state)).toMatchObject({
      name: "Untitled workout",
      description: "Slow",
      variations: [{ label: "5×5", items: [squat] }],
    });
  });

  it("alternates A and B from a copy of A, and keeps only A when switched off", () => {
    const ab = withAlternates(legs, true);
    expect(ab.variations).toEqual([legs.variations[0], { label: "", items: [squat] }]);
    expect(ab.pattern).toEqual([0, 1]);
    expect(withAlternates(ab, false)).toEqual(legs);
  });

  it("cycles a step's letter, adds steps after the last, and keeps at least one", () => {
    const ab = withAlternates(legs, true);
    expect(withStepCycled(ab, 1).pattern).toEqual([0, 0]);
    expect(withStepAdded(withStepCycled(ab, 1)).pattern).toEqual([0, 0, 1]);
    expect(withoutStep(withoutStep(ab, 0), 0).pattern).toEqual([1]);
  });

  it("adds C after the others, and removing a variation renumbers the pattern", () => {
    const abc = withVariationAdded(withAlternates(legs, true));
    expect(abc.pattern).toEqual([0, 1, 2]);
    expect(withoutVariation({ ...abc, pattern: [0, 2, 1, 2] }, 1).pattern).toEqual([0, 1, 1]);
    expect(withoutVariation(withAlternates(legs, true), 1).pattern).toEqual([0]);
  });
});
