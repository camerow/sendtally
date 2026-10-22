import type { ActivityDetail, PlanTemplate } from "@sendtally/api-client";
import { describe, expect, it } from "vitest";
import {
  cleanDetail,
  detailFromTemplate,
  detailSummary,
  exerciseNames,
  exerciseSuggestions,
  nextSet,
  setTargetFor,
  setText,
  templateOf,
  toggleMeasure,
  type Exercise,
} from "./detail";

const squat: Exercise = {
  name: " Back squat ",
  measures: ["reps", "loadKg"],
  sets: [
    { reps: 5, loadKg: 100, done: true },
    { reps: 4, loadKg: 100, done: false },
  ],
};

const sets = (...exercises: Exercise[]): ActivityDetail => ({ kind: "sets", exercises });

describe("activity detail bodies", () => {
  it("saves named exercises and items only, trimmed, and nothing when none are left", () => {
    expect(cleanDetail(sets(squat, { name: "  ", measures: ["reps"], sets: [] }))).toEqual(
      sets({ ...squat, name: "Back squat" })
    );
    expect(cleanDetail(sets({ ...squat, name: "" }))).toBeNull();
    expect(
      cleanDetail({
        kind: "checklist",
        items: [
          { text: " Cat-cow ", dose: " × 10 ", done: true },
          { text: "", dose: "2 min", done: false },
        ],
      })
    ).toEqual({ kind: "checklist", items: [{ text: "Cat-cow", dose: "× 10", done: true }] });
  });

  it("turns a body into a template and back, with nothing done", () => {
    const template = templateOf(sets(squat));
    expect(template).toEqual({
      kind: "sets",
      exercises: [
        {
          name: "Back squat",
          measures: ["reps", "loadKg"],
          sets: [
            { reps: 5, loadKg: 100 },
            { reps: 4, loadKg: 100 },
          ],
        },
      ],
    });
    const logged = detailFromTemplate(template);
    expect(logged?.kind === "sets" && logged.exercises[0]?.sets.every((s) => !s.done)).toBe(true);
    expect(detailFromTemplate(null)).toBeNull();
  });

  it("drops a measure's values with it and keeps the last measure on", () => {
    const repsOnly = toggleMeasure(squat, "loadKg");
    expect(repsOnly.measures).toEqual(["reps"]);
    expect(repsOnly.sets[0]).toEqual({ reps: 5, done: true });
    expect(toggleMeasure(repsOnly, "reps")).toBe(repsOnly);
    expect(toggleMeasure(repsOnly, "side").measures).toEqual(["reps", "side"]);
  });

  it("repeats the last set on the other side", () => {
    expect(nextSet([{ seconds: 30, side: "L", done: true }])).toEqual({
      seconds: 30,
      side: "R",
      done: false,
    });
    expect(nextSet([])).toEqual({ done: false });
  });

  it("summarises and writes sets in the chosen unit", () => {
    expect(detailSummary(sets(squat, { ...squat, name: "Deadlift" }))).toBe("2 exercises · 4 sets");
    expect(detailSummary(null)).toBeNull();
    expect(setText({ reps: 5, loadKg: 100 }, "kg")).toBe("5 × 100 kg");
    expect(setText({ reps: 5, loadKg: 100 }, "lb")).toBe("5 × 220.5 lb");
    expect(setText({ seconds: 30, side: "L" }, "kg")).toBe("30s · L");
  });

  it("finds a set's target by exercise name and position", () => {
    const template: PlanTemplate = {
      kind: "sets",
      exercises: [{ name: "Back squat", measures: ["reps"], sets: [{ reps: 5 }] }],
    };
    expect(setTargetFor(template, "back squat ", 0)).toEqual({ reps: 5 });
    expect(setTargetFor(template, "Back squat", 1)).toBeNull();
    expect(setTargetFor(null, "Back squat", 0)).toBeNull();
  });

  it("suggests the user's own exercise names, newest first, each once", () => {
    const names = exerciseNames([
      { detail: sets({ ...squat, name: "Back squat" }) },
      { detail: null },
      { detail: sets({ ...squat, name: "back squat" }, { ...squat, name: "Deadlift" }) },
    ]);
    expect(names).toEqual(["Back squat", "Deadlift"]);
    expect(exerciseSuggestions(names, "")).toEqual(names);
    expect(exerciseSuggestions(names, "dead")).toEqual(["Deadlift"]);
    expect(exerciseSuggestions(names, "deadlift")).toEqual([]);
  });
});
