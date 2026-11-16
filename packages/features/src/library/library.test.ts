import { afterEach, describe, expect, it } from "vitest";
import { builtInExerciseName, builtInExercises, exerciseLabel } from "../exercises/builtIns";
import { builtInGripName } from "../hang/names";
import { setLocale } from "../i18n";
import { builtInWorkout, builtInWorkouts } from "../workouts/builtIns";
import { setLibrary } from "./current";
import { TEST_LIBRARY } from "./testLibrary";

const retire = <T extends { id: string; status: string }>(entries: T[], id: string): T[] =>
  entries.map((e) => (e.id === id ? { ...e, status: "retired" } : e));

afterEach(() => {
  setLibrary(TEST_LIBRARY);
  setLocale("en");
});

describe("the built-in library", () => {
  it("offers only what is not retired, while a retired one still names history", () => {
    setLibrary({
      ...TEST_LIBRARY,
      exercises: retire(TEST_LIBRARY.exercises, "backSquat"),
      workouts: retire(TEST_LIBRARY.workouts, "rep73"),
    });
    expect(builtInExercises().map((e) => e.id)).not.toContain("backSquat");
    expect(builtInExerciseName("backSquat")).toBe("Back squat");
    expect(builtInWorkouts().map((w) => w.id)).not.toContain("rep73");
    expect(builtInWorkout("rep73")?.name).toBe("Repeaters 7:3");
  });

  it("reads names and descriptions in the user's language, falling back to English", () => {
    setLibrary({
      ...TEST_LIBRARY,
      workouts: TEST_LIBRARY.workouts.map((w) =>
        w.id === "rep73"
          ? { ...w, description: "New words.", translations: { de: { name: "Wiederholer" } } }
          : w
      ),
    });
    setLocale("de");
    expect(builtInWorkout("rep73")).toMatchObject({
      name: "Wiederholer",
      description: "New words.",
    });
    expect(builtInGripName("half")).toBe("Half Crimp");
  });

  it("keeps a picked built-in's name in the user's language until they rename it", () => {
    setLocale("de");
    expect(exerciseLabel({ name: "Back squat", builtIn: "backSquat" })).toBe(
      builtInExerciseName("backSquat")
    );
    expect(exerciseLabel({ name: "Heavy squat", builtIn: "backSquat" })).toBe("Heavy squat");
  });

  it("falls back to the id for anything the library does not have", () => {
    expect(builtInGripName("gone")).toBe("gone");
    expect(builtInExerciseName("gone")).toBe("gone");
  });
});
