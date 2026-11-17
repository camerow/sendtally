import { describe, expect, it, vi } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import type { LibraryWorkout, Picked } from "../workouts/types";
import {
  exerciseWorkout,
  usedInText,
  workoutsWith,
  workoutsWithGrip,
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
    const named = workout("w2", "pull-ups", ["Pull-ups"]);
    const both = workout("w3", "Pull-ups", ["Pull-ups", "Dips"]);
    const builtIn = workout("w4", "Pull-ups", ["Pull-ups"], { source: "library" });
    expect(wrapperOf([back, named, both, builtIn], entry)?.id).toBe("w2");
    expect(wrapperOf([back, both, builtIn], entry)?.id).toBe("w1");
    expect(wrapperOf([both, builtIn], entry)).toBeUndefined();
  });

  it("matches names as the Worker does, so a non-ASCII wrapper it renames is the one found", () => {
    const elan: ExerciseEntry = {
      kind: "strength",
      name: "Élan press",
      source: { exercise: { ...pullUps, name: "Élan press" } },
    };
    const lower = workout("w1", "Élan press", ["élan press"]);
    const named = workout("w2", "ÉLAN press", ["Élan PRESS"]);
    expect(workoutsWith([lower, named], elan).map((w) => w.id)).toEqual(["w2"]);
    expect(wrapperOf([lower, named], elan)?.id).toBe("w2");
  });

  it("finds a grip by its exact id in Fingers workouts and mixes alike", () => {
    const hang = workout("w1", "Half crimp", ["half"], { kind: "hangboard" });
    const mix = workout("w2", "Fingers and pull", ["half", "Pull-ups"]);
    const lift = workout("w3", "Half crimp", ["Half"]);
    expect(workoutsWith([hang, mix, lift], grip).map((w) => w.id)).toEqual(["w1", "w2"]);
    expect(workoutsWithGrip([hang, mix, lift], "half").map((w) => w.id)).toEqual(["w1", "w2"]);
    expect(wrapperOf([lift, mix, hang], grip)?.id).toBe("w1");
  });

  it("never finds an exercise in a Fingers workout", () => {
    const hang = workout("w1", "Pull-ups", ["Pull-ups"], { kind: "hangboard" });
    expect(workoutsWith([hang], entry)).toEqual([]);
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
  const newId = (): string => "new";

  it("reuses the wrapper, else saves one of its kind named after it at its starting dose", async () => {
    const save = vi.fn(async () => undefined);
    const pick = vi.fn(async (): Promise<Picked> => ({
      exercise: "Pull-ups",
      kind: "strength",
      dose: { sets: 3, reps: 8 },
    }));
    const making = new Set<string>();
    const wrapper = workout("w1", "Pull-ups", ["Pull-ups"]);
    expect(await exerciseWorkout({ workouts: [wrapper], pick, save, newId, making })(entry)).toBe(
      "w1"
    );
    expect(save).not.toHaveBeenCalled();
    expect(await exerciseWorkout({ workouts: [], pick, save, newId, making })(entry)).toBe("new");
    expect(pick).toHaveBeenCalledWith(entry.source);
    expect(save).toHaveBeenCalledWith(
      "new",
      expect.objectContaining({
        kind: "strength",
        name: "Pull-ups",
        items: [{ id: "new", exercise: "Pull-ups", doses: [{ sets: 3, reps: 8 }] }],
      })
    );
    pick.mockResolvedValueOnce(null as never);
    expect(await exerciseWorkout({ workouts: [], pick, save, newId, making })(entry)).toBeNull();
  });

  it("makes one wrapper when asked twice before the first is saved", async () => {
    const save = vi.fn(async () => undefined);
    const waiting: (() => void)[] = [];
    const pick = vi.fn(
      () =>
        new Promise<Picked>((resolve) => {
          waiting.push(() => resolve({ exercise: "Pull-ups", kind: "strength" }));
        })
    );
    const ensure = exerciseWorkout({ workouts: [], pick, save, newId, making: new Set() });
    const first = ensure(entry);
    const second = ensure(entry);
    waiting.forEach((go) => go());
    expect(await Promise.all([first, second])).toEqual(["new", null]);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("makes no second wrapper while the first is saving, and frees the exercise once it settles", async () => {
    let saved = (): void => undefined;
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          saved = resolve;
        })
    );
    const pick = vi.fn(async (): Promise<Picked> => ({ exercise: "Pull-ups", kind: "strength" }));
    const ensure = exerciseWorkout({ workouts: [], pick, save, newId, making: new Set() });
    expect(await ensure(entry)).toBe("new");
    expect(await ensure(entry)).toBeNull();
    expect(save).toHaveBeenCalledTimes(1);
    saved();
    await Promise.resolve();
    expect(await ensure(entry)).toBe("new");
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("frees the exercise when the save fails, so the add can be tried again", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const pick = vi.fn(async (): Promise<Picked> => ({ exercise: "Pull-ups", kind: "strength" }));
    const ensure = exerciseWorkout({ workouts: [], pick, save, newId, making: new Set() });
    expect(await ensure(entry)).toBe("new");
    await new Promise((r) => setTimeout(r, 0));
    expect(await ensure(entry)).toBe("new");
    expect(save).toHaveBeenCalledTimes(2);
  });
});
