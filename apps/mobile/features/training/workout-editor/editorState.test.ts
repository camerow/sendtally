import { describe, expect, it } from "@jest/globals";
import { newWorkoutDraft, type WorkoutDraft } from "@sendtally/features/workouts";
import { draftOfEditor, editorStateOf } from "./editorState";

const sets: WorkoutDraft = {
  name: "Leg day",
  category: "strength",
  description: "Heavy",
  tags: ["legs", "gym"],
  minutes: 50,
  targetRpe: 8,
  body: {
    kind: "sets",
    exercises: [{ name: "Back squat", measures: ["reps"], sets: [{ reps: 5 }] }],
  },
};

describe("workout editor state", () => {
  it("round trips a workout through the editor unchanged", () => {
    expect(draftOfEditor(editorStateOf(sets))).toEqual(sets);
  });

  it("saves trimmed text, parsed tags, and an untitled name", () => {
    const state = { ...editorStateOf(sets), name: "  ", description: " ", tags: "a, b, a" };
    expect(draftOfEditor(state)).toMatchObject({
      name: "Untitled workout",
      description: null,
      tags: ["a", "b"],
    });
  });

  it("drops empty exercises, and a project unless the focus is one", () => {
    const empty = editorStateOf({ ...sets, body: null });
    expect(draftOfEditor({ ...empty, detail: { kind: "checklist", items: [] } }).body).toBeNull();
    const climb = editorStateOf(newWorkoutDraft("climb"));
    expect(draftOfEditor({ ...climb, projectId: "roof" }).body).toEqual({
      kind: "climb",
      focus: "limit",
      projectId: null,
    });
    expect(draftOfEditor({ ...climb, focus: "project", projectId: "roof" }).body).toEqual({
      kind: "climb",
      focus: "project",
      projectId: "roof",
    });
  });
});
