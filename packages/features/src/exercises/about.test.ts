import { afterEach, describe, expect, it } from "vitest";
import type { Exercise } from "@sendtally/api-client";
import { setLibrary } from "../library";
import { loadTestLibrary, TEST_LIBRARY } from "../library/testing";
import { exerciseAbout, workoutAbout } from "./about";

const exercise = (name: string, description: string): Exercise => ({
  id: name,
  name,
  kind: "strength",
  measure: "reps",
  eachSide: false,
  progress: null,
  builtIn: null,
  description,
  archived: false,
});

describe("exerciseAbout", () => {
  const mine = [exercise("Front lever", "Hold it straight."), exercise("Squat", "")];

  it("finds the item's exercise in any case, under the name shown", () => {
    expect(exerciseAbout(mine, " front LEVER", "Front lever · A")).toEqual({
      kind: "strength",
      name: "Front lever · A",
      description: "Hold it straight.",
      pictures: [],
    });
  });

  it("has none without a description, an exercise, or the list", () => {
    expect(exerciseAbout(mine, "Squat", "Squat")).toBeUndefined();
    expect(exerciseAbout(mine, "Plank", "Plank")).toBeUndefined();
    expect(exerciseAbout(null, "Front lever", "Front lever")).toBeUndefined();
  });
});

describe("pictures in an info sheet", () => {
  const picture = {
    kind: "picture" as const,
    url: "https://media.test/dips-1600.jpg",
    thumbUrl: "https://media.test/dips-144.jpg",
    width: 1600,
    height: 1200,
    alt: "Dips on parallel bars",
    credit: "",
  };
  afterEach(loadTestLibrary);

  it("gives a built-in with a picture and no description an info sheet, and a linked exercise its pictures", () => {
    setLibrary({
      ...TEST_LIBRARY,
      exercises: TEST_LIBRARY.exercises.map((e) =>
        e.id === "dips" ? { ...e, media: [picture] } : e
      ),
    });
    expect(exerciseAbout([], "dips", "Dips")).toEqual({
      kind: "strength",
      name: "Dips",
      description: "",
      pictures: [picture],
    });
    const linked = { ...exercise("Bar dips", ""), builtIn: "dips" };
    expect(exerciseAbout([linked], "Bar dips", "Bar dips")?.pictures).toEqual([picture]);
    expect(
      workoutAbout({ id: "mine", kind: "strength", name: "Mine", description: "" }).pictures
    ).toEqual([]);
  });
});
