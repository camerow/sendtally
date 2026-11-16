import { describe, expect, it } from "vitest";
import { restAfterItem, type WorkoutKind } from "@sendtally/core/hang";
import type { WorkoutDraft } from "./types";
import {
  draftOfEditor,
  withAlternates,
  withDoseAdded,
  withDoseName,
  withDerivedKind,
  withExerciseSwapped,
  withItemsAdded,
  withoutItem,
  withoutLastDose,
  withItemMoved,
  withRestAfter,
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
  focus: null,
};

describe("workout editor state", () => {
  it("sets the rest after an exercise, which moves with it", () => {
    const bench = { exercise: "Bench press", doses: [{ sets: 3, reps: 8 }] };
    const rested = withRestAfter({ ...legs, items: [squat, bench] }, 0, 240);
    expect(rested.items).toEqual([{ ...squat, restAfterS: 240 }, bench]);
    const last = withItemMoved(rested, 0, 1).items;
    expect(last).toEqual([bench, { ...squat, restAfterS: 240 }]);
    expect(restAfterItem(last, 0, legs.exerciseRestS)).toBe(180);
    expect(restAfterItem(last, 1, legs.exerciseRestS)).toBe(0);
    expect(withoutItem(rested, 0).items).toEqual([bench]);
  });

  it("starts a grip that pulls on its own dose, and copies the grip before it otherwise", () => {
    const hang = { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 };
    const fingers: WorkoutDraft = {
      ...legs,
      kind: "hangboard",
      items: [{ exercise: "half", doses: [hang] }],
    };
    const added = withItemsAdded(
      fingers,
      [
        { exercise: "open", kind: "hangboard" },
        { exercise: "block", kind: "hangboard", measure: "secondsWeight" },
      ],
      () => "id"
    );
    expect(added.items.map((i) => i.doses)).toEqual([
      [hang],
      [hang],
      [{ sets: 5, reps: 1, onS: 10, edgeMm: 0, setRestS: 120 }],
    ]);
    expect(
      withExerciseSwapped(fingers, 0, {
        exercise: "block",
        kind: "hangboard",
        measure: "repsWeight",
      }).items
    ).toEqual([{ exercise: "block", doses: [{ sets: 5, reps: 5, setRestS: 120 }] }]);
    expect(withExerciseSwapped(fingers, 0, { exercise: "open", kind: "hangboard" }).items).toEqual([
      { exercise: "open", doses: [hang] },
    ]);
  });

  it("reads its kind off its exercises as they come and go", () => {
    const kinds: Record<string, WorkoutKind> = {
      half: "hangboard",
      "Back squat": "strength",
      "Hip openers": "mobility",
      Pigeon: "mobility",
    };
    const kindIn = (e: string): WorkoutKind | undefined => kinds[e];
    const blank: WorkoutDraft = { ...legs, kind: "other", items: [], exerciseRestS: 0 };
    const hang = { exercise: "half", doses: [{ sets: 3, reps: 6, onS: 7, offS: 3 }] };
    const fingers = withDerivedKind({ ...blank, items: [hang] }, kindIn);
    expect(fingers).toMatchObject({ kind: "hangboard", exerciseRestS: 180 });
    expect(withDerivedKind(withoutItem(fingers, 0), kindIn)).toMatchObject({
      kind: "other",
      exerciseRestS: 0,
    });
    const stretch = { exercise: "Hip openers", doses: [{ sets: 2, onS: 60 }] };
    const pigeon = { ...stretch, exercise: "Pigeon" };
    expect(withDerivedKind({ ...blank, items: [squat, stretch] }, kindIn).kind).toBe("strength");
    expect(withDerivedKind({ ...blank, items: [squat, stretch, pigeon] }, kindIn).kind).toBe(
      "mobility"
    );
    const unknown = { ...squat, exercise: "Made just now" };
    expect(withDerivedKind({ ...legs, items: [unknown] }, kindIn).kind).toBe("strength");
    const climbing: WorkoutDraft = { ...blank, kind: "climbing" };
    expect(withDerivedKind(climbing, kindIn)).toBe(climbing);
  });

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

  it("names doses, never copies a name, and saves them trimmed or not at all", () => {
    const ab = withDoseName(withAlternates(squat, true), 0, " Heavy ");
    const named = withDoseAdded(withDoseName(ab, 1, "Light"));
    expect(named.doses.map((d) => d.name)).toEqual([" Heavy ", "Light", undefined]);
    expect(withAlternates(ab, false).doses).toEqual(squat.doses);
    const blank = withDoseName(ab, 1, "  ");
    expect(draftOfEditor({ ...legs, items: [blank] }).items[0]?.doses).toEqual([
      { sets: 5, reps: 5, name: "Heavy" },
      { sets: 5, reps: 5 },
    ]);
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
