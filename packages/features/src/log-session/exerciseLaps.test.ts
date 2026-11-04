import { describe, expect, it } from "vitest";
import {
  allLapsDone,
  lapClockLabel,
  lapElapsed,
  lapSets,
  lapsDone,
  withLapAdded,
  withLapLogged,
  withLapStarted,
} from "./exerciseLaps";
import { tallyDraft } from "./tally";
import type { LogSessionDraft } from "./types";

const at = new Date("2026-11-04T18:00:00Z");

const circuit = (unit: "moves" | "seconds", target: number): LogSessionDraft => ({
  ...tallyDraft(at),
  exercise: { item: 1, name: "Circuit laps", sets: 2, restS: 240, set: 1, lap: { unit, target } },
});

describe("circuit laps", () => {
  it("keeps every lap on one endurance climb, clean or as far as it got", () => {
    const one = withLapLogged(circuit("moves", 40), 40);
    const two = withLapLogged(one, 28);
    expect(two.climbs).toHaveLength(1);
    expect(two.climbs[0]).toMatchObject({
      name: "Circuit laps",
      item: 1,
      endurance: { unit: "moves", target: 40, laps: [40, 28] },
    });
    expect(lapsDone(two)).toEqual([40, 28]);
    expect(lapSets(two.climbs, 1)).toEqual([{ reps: 40 }, { reps: 28 }]);
  });

  it("is done at the laps asked for, until + Add lap asks for one more", () => {
    const two = withLapLogged(withLapLogged(circuit("moves", 40), 40), 40);
    expect(allLapsDone(two)).toBe(true);
    expect(lapClockLabel(two)).toBe("All laps done");
    const more = withLapAdded(two);
    expect(allLapsDone(more)).toBe(false);
    expect(lapClockLabel(more)).toBe("Lap 3 of 3");
  });

  it("times a lap from its start and keeps no more than its target", () => {
    const started = withLapStarted(circuit("seconds", 240), at);
    const ex = started.exercise;
    if (ex === undefined) throw new Error("no exercise");
    expect(lapElapsed(ex, new Date(at.getTime() + 95_000))).toBe(95);
    const logged = withLapLogged(started, 300);
    expect(logged.exercise?.setStartedAt).toBeUndefined();
    expect(lapSets(logged.climbs, 1)).toEqual([{ onS: 240 }]);
  });
});
