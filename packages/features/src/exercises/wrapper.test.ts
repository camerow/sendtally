import { describe, expect, it, vi } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import type { LibraryWorkout } from "../workouts/types";
import {
  exerciseWorkout,
  usedInText,
  workoutsWith,
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

  it("finds a grip's on the hangboard only, by its id", () => {
    const hang = workout("w1", "Half crimp", ["half"], { kind: "hangboard" });
    const named = workout("w2", "Half crimp", ["half"]);
    expect(wrapperOf([named, hang], grip)?.id).toBe("w1");
    expect(workoutsWith([named, hang], grip).map((w) => w.id)).toEqual(["w1"]);
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
    const pick = vi.fn(async () => ({ exercise: "Pull-ups", dose: { sets: 3, reps: 8 } }));
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
        new Promise<{ exercise: string }>((resolve) => {
          waiting.push(() => resolve({ exercise: "Pull-ups" }));
        })
    );
    const ensure = exerciseWorkout({ workouts: [], pick, save, newId, making: new Set() });
    const first = ensure(entry);
    const second = ensure(entry);
    waiting.forEach((go) => go());
    expect(await Promise.all([first, second])).toEqual(["new", null]);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
