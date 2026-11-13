import { describe, expect, it, vi } from "vitest";
import { ApiError, type Exercise } from "@sendtally/api-client";
import { pickedOf, pickWith, takenBy } from "./makeExercise";

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

  it("makes a built-in the user's own before it is picked, and picks nothing when that fails", async () => {
    const make = vi.fn(async () => ({ exercise: squat }));
    const builtIn = {
      builtIn: { id: "b1", name: "Back squat", kind: "strength", measure: "repsWeight" },
    };
    expect(await pickWith(make)(builtIn as never)).toEqual({
      exercise: "Back squat",
      measure: "repsWeight",
    });
    expect(make).toHaveBeenCalledWith(expect.objectContaining({ name: "Back squat" }), "b1");
    expect(await pickWith(async () => null)(builtIn as never)).toBeNull();
    expect(await pickWith(make)({ exercise: squat })).toEqual({
      exercise: "Back squat",
      measure: "repsWeight",
    });
  });
});
