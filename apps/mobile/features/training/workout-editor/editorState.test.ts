import { describe, expect, it } from "@jest/globals";
import type { WorkoutDraft } from "@sendtally/features/workouts";
import { draftOfEditor, editorStateOf } from "./editorState";

const legs: WorkoutDraft = {
  kind: "strength",
  name: "Leg day",
  description: "Heavy",
  minutes: 50,
  targetRpe: 8,
  variations: [{ label: "", items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }] }],
  pattern: [0],
};

describe("workout editor state", () => {
  it("round trips a workout through the editor unchanged", () => {
    expect(draftOfEditor(editorStateOf(legs))).toEqual(legs);
  });

  it("saves trimmed text and an untitled name", () => {
    const state = { ...editorStateOf(legs), name: "  ", description: " Slow " };
    expect(draftOfEditor(state)).toMatchObject({ name: "Untitled workout", description: "Slow" });
  });
});
