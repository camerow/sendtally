import { describe, expect, it, vi } from "vitest";
import type { Membership, Workout } from "@sendtally/core/hang";
import { planGridRows, weekLines, workoutLines, type GripNames } from "./planGridRows";

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
        named(() => "Half crimp"),
        []
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
        named((id) => id),
        []
      )
    ).toEqual(["half"]);
    expect(
      workoutLines(
        at(20, 15),
        named((id) => id),
        []
      )
    ).toEqual(["half"]);
    expect(
      workoutLines(
        at(20, 20),
        named((id) => id),
        []
      )
    ).toEqual(["half", "20 mm"]);
  });

  it("names the grip the workout was set to", () => {
    expect(
      workoutLines(
        fingers(["half"]),
        named((id) => id, "drag3"),
        []
      )
    ).toEqual(["drag3", "20\u00A0mm"]);
  });

  it("counts grips when there are several", () => {
    expect(
      workoutLines(
        fingers(["half", "open", "half"]),
        named((id) => id),
        []
      )
    ).toEqual(["2 grips"]);
  });
});

describe("a circuit", () => {
  const laps: Workout = {
    ...fingers([]),
    kind: "climbing",
    name: "Laps",
    items: [{ exercise: "Circuit laps", doses: [{ sets: 3, reps: 40 }] }],
  };
  const circuit = [{ name: "Circuit laps", kind: "climbing", measure: "laps" }] as const;

  it("reads laps of moves in the grid, as the exercise measures it", () => {
    expect(
      workoutLines(
        laps,
        named((id) => id),
        circuit
      )[0]
    ).toBe("3 laps of 40 moves");
    expect(
      weekLines(
        laps,
        [{}],
        named((id) => id),
        "kg",
        circuit
      )[0]
    ).toEqual([{ text: "3 laps of 40 moves" }]);
  });
});

describe("weekLines", () => {
  it("reads a one-dose hang's edge and load, gold where the week changes them", () => {
    expect(
      weekLines(
        fingers(["half"]),
        [{ weightKg: 8 }],
        named((id) => id),
        "kg",
        []
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
        "kg",
        []
      )
    ).toEqual([[{ text: "2 grips" }], [{ text: "1 changed", changed: true }]]);
  });
});

describe("planGridRows", () => {
  it("wears the lock on a locked row and sends every press of it to the join", () => {
    const member = (id: string): Membership =>
      ({ id, workoutId: "f", blockId: null, weekdays: [1] }) as unknown as Membership;
    const open = vi.fn();
    const join = vi.fn();
    const toggled = vi.fn();
    const [shut, free] = planGridRows(
      [member("m1"), member("m2")],
      () => fingers(["half"]),
      named((id) => id),
      {
        exercises: [],
        open,
        toggle: () => toggled,
        locked: { row: (m) => m.id === "m1", join },
      }
    );
    expect(shut?.locked).toBe(true);
    expect(free?.locked).toBeUndefined();
    shut?.open();
    shut?.toggle?.(2)?.();
    expect(join).toHaveBeenCalledTimes(2);
    free?.open();
    free?.toggle?.(2)?.();
    expect(open).toHaveBeenCalledTimes(1);
    expect(toggled).toHaveBeenCalledTimes(1);
  });
});
