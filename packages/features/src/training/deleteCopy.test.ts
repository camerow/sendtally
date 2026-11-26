import { describe, expect, it } from "vitest";
import { deleteCopy } from "./deleteCopy";

describe("delete copy", () => {
  it("deletes a workout or block, archives an exercise in use and every grip", () => {
    expect(deleteCopy("workout", "Max hangs")).toEqual({
      item: "Delete workout",
      title: "Delete Max hangs?",
      body: expect.any(String),
      action: "Delete",
    });
    expect(deleteCopy("block", "Autumn").title).toBe("Delete Autumn?");
    expect(deleteCopy("exercise", "Pull-ups", false).action).toBe("Delete");
    expect(deleteCopy("exercise", "Pull-ups", true).action).toBe("Archive");
    expect(deleteCopy("grip", "Half crimp")).toEqual(deleteCopy("exercise", "Half crimp", true));
  });
});
