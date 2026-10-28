import { describe, expect, it } from "@jest/globals";
import type { WorkoutDraft } from "@sendtally/features/workouts";
import {
  draftOfEditor,
  withAlternates,
  withDoseAdded,
  withoutLastDose,
  withSetRest,
} from "./editorState";

const squat = { exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] };
const legs: WorkoutDraft = {
  kind: "strength",
  name: "Leg day",
  description: "Heavy",
  minutes: 50,
  targetRpe: 8,
  items: [squat],
  exerciseRestS: 180,
};

describe("workout editor state", () => {
  it("round trips a workout unchanged", () => {
    expect(draftOfEditor(legs)).toEqual(legs);
  });

  it("saves trimmed text, an untitled name, and leaves unnamed exercises out", () => {
    const blank = { exercise: "  ", doses: [{ sets: 3 }] };
    const state = { ...legs, name: "  ", description: " Slow ", items: [squat, blank] };
    expect(draftOfEditor(state)).toMatchObject({
      name: "Untitled workout",
      description: "Slow",
      items: [squat],
    });
  });

  it("alternates A and B from a copy of A, and keeps only A when switched off", () => {
    const ab = withAlternates(squat, true);
    expect(ab.doses).toEqual([squat.doses[0], squat.doses[0]]);
    expect(withAlternates(ab, true)).toBe(ab);
    expect(withAlternates(ab, false)).toEqual(squat);
  });

  it("adds C as a copy of B, and removes it while two are left", () => {
    const ab = { ...squat, doses: [{ sets: 5 }, { sets: 3 }] };
    const abc = withDoseAdded(ab);
    expect(abc.doses).toEqual([{ sets: 5 }, { sets: 3 }, { sets: 3 }]);
    expect(withoutLastDose(abc)).toEqual(ab);
    expect(withoutLastDose(ab)).toBe(ab);
  });

  it("keeps the rest between sets on every dose, and clears it at zero", () => {
    const ab = { ...squat, doses: [{ sets: 5 }, { sets: 3, setRestS: 60 }] };
    expect(withSetRest(ab, 120).doses).toEqual([
      { sets: 5, setRestS: 120 },
      { sets: 3, setRestS: 120 },
    ]);
    expect(withSetRest(ab, 0).doses).toEqual([{ sets: 5 }, { sets: 3 }]);
  });
});
