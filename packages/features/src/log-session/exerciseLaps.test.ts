import { describe, expect, it } from "vitest";
import {
  allLapsDone,
  lapClockLabel,
  lapElapsed,
  lapSets,
  lapsDone,
  lapRemovable,
  withLapAdded,
  withLapLogged,
  withLapRemoved,
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

  it("takes back an added lap while it holds nothing, down to the laps asked for", () => {
    const one = withLapLogged(circuit("moves", 40), 40);
    expect(lapRemovable(one)).toBe(false);
    const three = withLapAdded(withLapAdded(one));
    expect(lapClockLabel(three)).toBe("Lap 2 of 4");
    expect(lapRemovable(three)).toBe(true);
    const back = withLapRemoved(withLapRemoved(three));
    expect(lapClockLabel(back)).toBe("Lap 2 of 2");
    expect(lapRemovable(back)).toBe(false);
    expect(withLapRemoved(back)).toBe(back);

    const full = withLapLogged(
      withLapLogged(withLapAdded(withLapLogged(circuit("moves", 40), 40)), 40),
      40
    );
    expect(allLapsDone(full)).toBe(true);
    expect(lapRemovable(full)).toBe(false);
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
