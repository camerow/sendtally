import { describe, expect, it } from "vitest";
import { ApiError, type Exercise } from "@sendtally/api-client";
import { pickedOf, takenBy } from "./makeExercise";

const squat: Exercise = {
  id: "e1",
  name: "Back squat",
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
};

describe("makeExercise", () => {
  it("finds the exercise a clashing name belongs to, only on a 409", () => {
    expect(takenBy(new ApiError(409, "taken", { exercise: squat }))).toEqual(squat);
    expect(takenBy(new ApiError(500, "failed", { exercise: squat }))).toBeUndefined();
    expect(takenBy(new Error("offline"))).toBeUndefined();
  });

  it("names a grip by its id and an exercise by its name, with its measure", () => {
    expect(pickedOf({ grip: { id: "g1", name: "Pinch", custom: true, hidden: false } })).toEqual({
      exercise: "g1",
    });
    expect(pickedOf({ exercise: squat })).toEqual({
      exercise: "Back squat",
      measure: "repsWeight",
    });
  });
});
