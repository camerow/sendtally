import { describe, expect, it } from "vitest";
import type { Workout } from "@sendtally/core/hang";
import { weekLines, workoutLines, type GripNames } from "./planGridRows";

const named = (name: (id: string) => string, chosen?: string): GripNames => ({
  gripName: name,
  workout: () => (chosen === undefined ? undefined : ({ grip: "half" } as never)),
  defaultGrip: () => chosen ?? "half",
});

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
    expect(
      workoutLines(
        fingers(["half"]),
        named(() => "Half crimp")
      )
    ).toEqual(["Half crimp", "20 mm"]);
  });

  it("leaves the edge out when it is 0 or differs between doses", () => {
    const at = (...mm: number[]): Workout => ({
      ...fingers([]),
      items: mm.map((edgeMm) => ({
        exercise: "half",
        doses: [{ sets: 6, onS: 7, offS: 3, edgeMm }],
      })),
    });
    expect(
      workoutLines(
        at(0),
        named((id) => id)
      )
    ).toEqual(["half"]);
    expect(
      workoutLines(
        at(20, 15),
        named((id) => id)
      )
    ).toEqual(["half"]);
    expect(
      workoutLines(
        at(20, 20),
        named((id) => id)
      )
    ).toEqual(["half", "20 mm"]);
  });

  it("names the grip the workout was set to", () => {
    expect(
      workoutLines(
        fingers(["half"]),
        named((id) => id, "drag3")
      )
    ).toEqual(["drag3", "20\u00A0mm"]);
  });

  it("counts grips when there are several", () => {
    expect(
      workoutLines(
        fingers(["half", "open", "half"]),
        named((id) => id)
      )
    ).toEqual(["2 grips"]);
  });
});

describe("weekLines", () => {
  it("reads a one-dose hang's edge and load, gold where the week changes them", () => {
    expect(
      weekLines(
        fingers(["half"]),
        [{ weightKg: 8 }],
        named((id) => id),
        "kg"
      )
    ).toEqual([
      [{ text: "half" }],
      [
        { text: "20\u00A0mm", changed: false },
        { text: "+8 kg", changed: true },
      ],
    ]);
  });

  it("counts the exercises a week changes when there is more than one dose", () => {
    expect(
      weekLines(
        fingers(["half", "open"]),
        [{}, { sets: 3 }],
        named((id) => id),
        "kg"
      )
    ).toEqual([[{ text: "2 grips" }], [{ text: "1 changed", changed: true }]]);
  });
});
