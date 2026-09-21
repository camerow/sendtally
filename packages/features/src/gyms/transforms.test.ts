import { describe, expect, it } from "vitest";
import type { Gym } from "./types";
import { liveGymOfDraft, withCircuit } from "./draft";
import {
  circuitGrades,
  circuitLabel,
  circuitMiddle,
  circuitRangeLabel,
  nextCircuit,
  standardCircuits,
  withCircuitRange,
  withWall,
  withoutWall,
} from "./transforms";
import { newClimb } from "../log-session/transforms";

const purple = { id: "p", colour: "purple" as const, label: "", low: 3, high: 5 };

describe("circuits", () => {
  it("scores at the middle of the range, rounded down on an even span", () => {
    expect(circuitMiddle(purple)).toBe(4);
    expect(circuitMiddle({ low: 1, high: 2 })).toBe(1);
    expect(circuitMiddle({ low: 0, high: 0 })).toBe(0);
  });

  it("is called what the climber typed, else its colour", () => {
    expect(circuitLabel(purple)).toBe("Purple");
    expect(circuitLabel({ ...purple, label: " Hex 3 " })).toBe("Hex 3");
  });

  it("labels ranges in the gym's scale", () => {
    expect(circuitRangeLabel(purple, "v")).toBe("V3–V5");
    expect(circuitRangeLabel(purple, "font")).toBe("6A–6C");
    expect(circuitRangeLabel({ low: 0, high: 0 }, "v")).toBe("V0");
    expect(circuitGrades(purple, "v")).toEqual(["V3", "V4", "V5"]);
  });

  it("keeps a range in order when one end crosses the other", () => {
    expect(withCircuitRange(purple, "low", 7)).toMatchObject({ low: 7, high: 7 });
    expect(withCircuitRange(purple, "high", 1)).toMatchObject({ low: 1, high: 1 });
    expect(withCircuitRange(purple, "high", 40).high).toBe(17);
  });

  it("continues the ladder in an unused colour", () => {
    const ladder = standardCircuits();
    expect(ladder.map((c) => c.colour)).toEqual([
      "green",
      "yellow",
      "orange",
      "red",
      "purple",
      "black",
      "white",
    ]);
    const next = nextCircuit(ladder.slice(0, 2));
    expect(next).toMatchObject({ colour: "orange", low: 3, high: 4 });
  });

  it("dedupes walls case-insensitively and removes by exact name", () => {
    expect(withWall(["Cave"], " cave ")).toEqual(["Cave"]);
    expect(withWall(["Cave"], "Slab")).toEqual(["Cave", "Slab"]);
    expect(withoutWall(["Cave", "Slab"], "Cave")).toEqual(["Slab"]);
  });

  it("puts a climb on a circuit at the middle grade in the gym's scale", () => {
    const gym: Gym = { id: "g", name: "Barn", scale: "font", circuits: [purple], walls: [] };
    const climb = withCircuit(newClimb("climb-1", "v"), purple, gym);
    expect(climb).toMatchObject({
      scale: "font",
      grade: "6B",
      circuit: { id: "p", label: "Purple", colour: "purple" },
    });
  });
});

describe("liveGymOfDraft", () => {
  const gym = (id: string): Gym => ({
    id,
    name: id,
    scale: "v",
    walls: [],
    circuits: [purple],
  });

  it("is no gym until the draft picks one, however many are saved", () => {
    expect(liveGymOfDraft([gym("a"), gym("b")], undefined)).toBeNull();
    expect(liveGymOfDraft([gym("a"), gym("b")], "b")?.id).toBe("b");
  });
});
