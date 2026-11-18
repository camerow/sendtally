import { describe, expect, it } from "vitest";
import { restAfterItem, type Item, type WorkoutKind } from "@sendtally/core/hang";
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
  withChecklistAdded,
  withChecklistLines,
  withLineAfter,
  withLineTyped,
  withAddedToGroup,
  withGroupSet,
  withMemberOut,
  withSupersetWithNext,
  canSupersetWithNext,
  canAddToGroup,
  withEditorMoved,
  withUngrouped,
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

  it("keeps a mix's grips one block with their own doses, and gives a swapped place its own dose", () => {
    const hang = { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 };
    const isGrip = (e: string): boolean => ["half", "open"].includes(e);
    const bench = { exercise: "Bench press", doses: [{ sets: 3, reps: 8 }] };
    const mix: WorkoutDraft = {
      ...legs,
      items: [squat, { exercise: "half", doses: [hang] }, bench],
    };
    const added = withItemsAdded(
      mix,
      [
        { exercise: "Dips", kind: "strength" },
        { exercise: "open", kind: "hangboard" },
      ],
      () => "id",
      isGrip
    );
    expect(added.items.map((i) => [i.exercise, i.doses[0]])).toEqual([
      ["Back squat", squat.doses[0]],
      ["half", hang],
      ["open", hang],
      ["Bench press", bench.doses[0]],
      ["Dips", { sets: 3, reps: 8 }],
    ]);
    const swapped = withExerciseSwapped(mix, 1, { exercise: "Dips", kind: "strength" }, isGrip);
    expect(swapped.items[1]).toEqual({ exercise: "Dips", doses: [{ sets: 3, reps: 8 }] });
    const toGrip = withExerciseSwapped(mix, 0, { exercise: "open", kind: "hangboard" }, isGrip);
    expect(toGrip.items[0]?.doses).toEqual([{ sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 }]);
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

describe("a checklist in the editor", () => {
  it("adds a checklist with one line to type, edits its lines, and saves only typed ones", () => {
    const added = withChecklistAdded(legs, () => "c1");
    expect(added.items[1]).toEqual({
      id: "c1",
      exercise: "Checklist",
      doses: [{ sets: 1 }],
      checklist: { lines: [""] },
    });
    const typed = {
      ...added,
      items: [added.items[0]!, withChecklistLines(added.items[1]!, ["Jog ", "", " Arm circles"])],
    };
    expect(draftOfEditor(typed).items[1]?.checklist).toEqual({ lines: ["Jog", "Arm circles"] });
    expect(draftOfEditor(added).items).toHaveLength(1);
  });

  it("leaves the workout's kind to its exercises", () => {
    const added = withChecklistAdded(legs, () => "c1");
    expect(withDerivedKind(added, (e) => (e === "Checklist" ? "climbing" : "strength")).kind).toBe(
      "strength"
    );
  });
});

describe("typing a checklist's lines", () => {
  const list = {
    exercise: "Checklist",
    doses: [{ sets: 1 }],
    checklist: { lines: ["Jog", "Hang"] },
  };
  it("types into one line and opens the next under it, from the item as it is now", () => {
    const typed = withLineTyped(list, 0, "Jog 5 min");
    expect(withLineAfter(typed, 0).checklist?.lines).toEqual(["Jog 5 min", "", "Hang"]);
  });
  it("stops at 30 lines, and a line at 120 characters", () => {
    const full = { ...list, checklist: { lines: Array.from({ length: 30 }, (_, i) => `L${i}`) } };
    expect(withLineAfter(full, 29)).toBe(full);
    expect(withLineTyped(list, 0, "x".repeat(130)).checklist?.lines[0]).toHaveLength(120);
  });
});

describe("a superset in the editor", () => {
  const pull = { id: "p", exercise: "Pull-ups", doses: [{ sets: 3, reps: 6 }] };
  const push = { id: "q", exercise: "Push-ups", doses: [{ sets: 4, reps: 15 }] };
  const plank = { id: "r", exercise: "Plank", doses: [{ sets: 3, onS: 45 }] };
  const three: WorkoutDraft = { ...legs, items: [pull, push, plank] };
  const kindOf = (e: string): WorkoutKind | undefined =>
    e === "half" ? "hangboard" : e === "ARC" ? "climbing" : "strength";
  const grouped = withSupersetWithNext(three, 0, () => "g1", kindOf);

  it("joins an exercise with the next, at its sets as rounds, and the gap below the group adds one more", () => {
    expect(grouped.items.map((i) => i.group?.id)).toEqual(["g1", "g1", undefined]);
    expect(grouped.items[1]?.doses[0]?.sets).toBe(3);
    expect(grouped.items[0]?.group).toMatchObject({ rounds: 3, restBetweenS: 30, restRoundS: 180 });
    expect(
      withSupersetWithNext(grouped, 1, () => "g2", kindOf).items.map((i) => i.group?.id)
    ).toEqual(["g1", "g1", "g1"]);
  });

  it("rests two minutes after each round when the workout rests none between exercises", () => {
    const none = withSupersetWithNext({ ...three, exerciseRestS: 0 }, 0, () => "g1", kindOf);
    expect(none.items[0]?.group?.restRoundS).toBe(120);
  });

  it("offers a superset with the next only where both can be in one", () => {
    const arc = { id: "a", exercise: "ARC", doses: [{ sets: 3, onS: 600 }] };
    const half = { id: "h", exercise: "half", doses: [{ sets: 6, onS: 7, offS: 3 }] };
    const mixed: WorkoutDraft = { ...legs, items: [pull, push, arc, plank, half] };
    expect([0, 1, 2, 3, 4].map((at) => canSupersetWithNext(mixed, at, kindOf))).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(canSupersetWithNext(grouped, 0, kindOf)).toBe(false);
    expect(canSupersetWithNext(grouped, 1, kindOf)).toBe(true);
  });

  it("sets rounds and rests for every member", () => {
    const set = withGroupSet(grouped, "g1", { rounds: 5, restBetweenS: 0 }, kindOf);
    expect(
      set.items.slice(0, 2).map((i) => [i.group?.rounds, i.group?.restBetweenS, i.doses[0]?.sets])
    ).toEqual([
      [5, 0, 5],
      [5, 0, 5],
    ]);
  });

  it("takes a member out to just below the group, and ends the group at one left", () => {
    const all = withSupersetWithNext(grouped, 1, () => "g2", kindOf);
    const out = withMemberOut(all, 0, kindOf);
    expect(out.items.map((i) => [i.exercise, i.group?.id])).toEqual([
      ["Push-ups", "g1"],
      ["Plank", "g1"],
      ["Pull-ups", undefined],
    ]);
    expect(withMemberOut(grouped, 0, kindOf).items.every((i) => i.group === undefined)).toBe(true);
  });

  it("ungroups, keeping every exercise where it is", () => {
    expect(withUngrouped(grouped, "g1").items).toEqual(
      grouped.items.map(({ group: _, ...i }) => i)
    );
  });

  it("adds picked exercises to the end of the group", () => {
    const added = withAddedToGroup(
      grouped,
      "g1",
      [{ exercise: "Dips", kind: "strength" }],
      () => "d",
      kindOf
    );
    expect(added.items.map((i) => [i.exercise, i.group?.id])).toEqual([
      ["Pull-ups", "g1"],
      ["Push-ups", "g1"],
      ["Dips", "g1"],
      ["Plank", undefined],
    ]);
  });
});

describe("moving around a superset in the editor", () => {
  const ex = (id: string, group?: string): Item => ({
    id,
    exercise: id,
    doses: [{ sets: 3, reps: 8 }],
    ...(group === undefined
      ? {}
      : { group: { id: group, rounds: 3, restBetweenS: 30, restRoundS: 120 } }),
  });
  const kindOf = (): WorkoutKind => "strength";
  const s: WorkoutDraft = { ...legs, items: [ex("P"), ex("A", "g"), ex("B", "g"), ex("Q")] };
  const ids = (d: WorkoutDraft): string[] => d.items.map((i) => i.id ?? "");

  it("moves a plain card past the whole superset, never into it", () => {
    expect(ids(withEditorMoved(s, 0, 1, kindOf))).toEqual(["A", "B", "P", "Q"]);
    expect(ids(withEditorMoved(s, 3, -1, kindOf))).toEqual(["P", "Q", "A", "B"]);
  });

  it("moves a superset whole, and a member only within its superset", () => {
    expect(ids(withEditorMoved(s, 1, -1, kindOf, true))).toEqual(["A", "B", "P", "Q"]);
    expect(ids(withEditorMoved(s, 2, 1, kindOf, true))).toEqual(["P", "Q", "A", "B"]);
    expect(ids(withEditorMoved(s, 1, 1, kindOf))).toEqual(["P", "B", "A", "Q"]);
    expect(withEditorMoved(s, 1, -1, kindOf)).toBe(s);
  });

  it("holds at most eight members in a superset", () => {
    const eight: WorkoutDraft = {
      ...legs,
      items: Array.from({ length: 8 }, (_, n) => ex(`M${n}`, "g")).concat([ex("Z")]),
    };
    expect(canSupersetWithNext(eight, 7, kindOf)).toBe(false);
    expect(canAddToGroup(eight, "g")).toBe(false);
    const added = withAddedToGroup(
      eight,
      "g",
      [{ exercise: "Dips", kind: "strength" }],
      () => "d",
      kindOf
    );
    expect(added.items.filter((i) => i.group?.id === "g")).toHaveLength(8);
  });
});
