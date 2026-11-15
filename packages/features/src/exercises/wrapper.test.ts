import { describe, expect, it, vi } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import type { LibraryWorkout } from "../workouts/types";
import {
  exerciseWorkout,
  usedInText,
  workoutsWith,
  wrapperDraft,
  wrapperOf,
  type ExerciseEntry,
} from "./wrapper";

const pullUps: Exercise = {
  id: "e1",
  name: "Pull-ups",
  kind: "strength",
  measure: "reps",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
  description: "",
};
const entry: ExerciseEntry = { kind: "strength", name: "Pull-ups", source: { exercise: pullUps } };
const grip: ExerciseEntry = {
  kind: "hangboard",
  name: "Half crimp",
  source: { grip: { id: "half", name: "Half crimp", custom: false, hidden: false } },
};

const workout = (
  id: string,
  name: string,
  exercises: string[],
  extra: Partial<LibraryWorkout> = {}
): LibraryWorkout => ({
  id,
  kind: "strength",
  name,
  description: "",
  minutes: null,
  targetRpe: null,
  items: exercises.map((exercise) => ({ exercise, doses: [{ sets: 3, reps: 8 }] })),
  exerciseRestS: 0,
  focus: null,
  source: "mine",
  ...extra,
});

describe("wrapperOf", () => {
  it("takes the user's one-exercise workout named after it, else any of theirs holding only it", () => {
    const back = workout("w1", "Back day", ["pull-ups"]);
    const named = workout("w2", "Pull-ups", ["Pull-ups"]);
    const both = workout("w3", "Pull-ups", ["Pull-ups", "Dips"]);
    const builtIn = workout("w4", "Pull-ups", ["Pull-ups"], { source: "library" });
    expect(wrapperOf([back, named, both, builtIn], entry)?.id).toBe("w2");
    expect(wrapperOf([back, both, builtIn], entry)?.id).toBe("w1");
    expect(wrapperOf([both, builtIn], entry)).toBeUndefined();
  });

  it("finds a grip's on the hangboard only, by its id", () => {
    const hang = workout("w1", "Half crimp", ["half"], { kind: "hangboard" });
    const named = workout("w2", "Half crimp", ["half"]);
    expect(wrapperOf([named, hang], grip)?.id).toBe("w1");
    expect(workoutsWith([named, hang], grip).map((w) => w.id)).toEqual(["w1"]);
  });
});

describe("wrapperDraft", () => {
  it("is a workout of the exercise's kind named after it, at the dose it starts at", () => {
    let n = 0;
    const draft = wrapperDraft(entry, { exercise: "Pull-ups", dose: { sets: 3, reps: 8 } }, () =>
      String(++n)
    );
    expect(draft).toMatchObject({
      kind: "strength",
      name: "Pull-ups",
      items: [{ id: "1", exercise: "Pull-ups", doses: [{ sets: 3, reps: 8 }] }],
    });
  });
});

describe("usedInText", () => {
  it("counts the workouts, or says none uses it yet", () => {
    expect(usedInText(0)).toBe("Not in a workout yet");
    expect(usedInText(1)).toBe("In 1 workout");
    expect(usedInText(3)).toBe("In 3 workouts");
  });
});

describe("exerciseWorkout", () => {
  it("reuses the wrapper, else makes the exercise its own and saves a new one", async () => {
    const save = vi.fn(async () => undefined);
    const pick = vi.fn(async () => ({ exercise: "Pull-ups" }));
    const newId = (): string => "new";
    const wrapper = workout("w1", "Pull-ups", ["Pull-ups"]);
    expect(await exerciseWorkout({ workouts: [wrapper], pick, save, newId })(entry)).toBe("w1");
    expect(save).not.toHaveBeenCalled();
    expect(await exerciseWorkout({ workouts: [], pick, save, newId })(entry)).toBe("new");
    expect(pick).toHaveBeenCalledWith(entry.source);
    expect(save).toHaveBeenCalledWith("new", expect.objectContaining({ name: "Pull-ups" }));
    pick.mockResolvedValueOnce(null as never);
    expect(await exerciseWorkout({ workouts: [], pick, save, newId })(entry)).toBeNull();
  });
});
