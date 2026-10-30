import { describe, expect, it } from "@jest/globals";
import type { Workout } from "@sendtally/core/hang";
import { workoutLines } from "./planGridRows";

const fingers = (grips: string[]): Workout => ({
  id: "f",
  kind: "hangboard",
  name: "Repeaters 7:3",
  description: "",
  minutes: null,
  targetRpe: null,
  items: grips.map((exercise) => ({ exercise, doses: [{ sets: 6, onS: 7, offS: 3, edgeMm: 20 }] })),
  exerciseRestS: 180,
  focus: null,
});

describe("workoutLines", () => {
  it("names one grip and its edge, a line each", () => {
    expect(workoutLines(fingers(["half"]), () => "Half crimp")).toEqual(["Half crimp", "20 mm"]);
  });

  it("counts grips when there are several", () => {
    expect(workoutLines(fingers(["half", "open", "half"]), (id) => id)).toEqual(["2 grips"]);
  });
});
