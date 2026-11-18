import { describe, expect, it } from "vitest";
import {
  allLapsDone,
  lapClockLabel,
  lapElapsed,
  lapSets,
  lapsDone,
  lapsPlanned,
  lapsPlannedFor,
  lapRowsOf,
  withLapBack,
  lapRemovable,
  withLapAdded,
  withLapLogged,
  withLapRemoved,
  withLapStarted,
} from "./exerciseLaps";
import { parseStoredDraft } from "./draftStore";
import { withExerciseDone } from "./exerciseTally";
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

  it("takes back any lap that holds nothing yet, down to one", () => {
    const one = withLapLogged(circuit("moves", 40), 40);
    expect(lapRemovable(one)).toBe(true);
    const three = withLapAdded(withLapAdded(one));
    expect(lapClockLabel(three)).toBe("Lap 2 of 4");
    const back = withLapRemoved(withLapRemoved(withLapRemoved(three)));
    expect(lapClockLabel(back)).toBe("All laps done");
    expect(lapRemovable(back)).toBe(false);
    expect(withLapRemoved(back)).toBe(back);
    const empty = circuit("moves", 40);
    expect(lapRemovable(withLapRemoved(empty))).toBe(false);

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

  it("reads a draft from the build before inline climbing that still carries plannedSets", () => {
    const added = withLapAdded(withLapLogged(circuit("moves", 40), 40));
    const old = { ...added, exercise: { ...added.exercise!, plannedSets: 2 } };
    const read = parseStoredDraft(JSON.stringify({ draft: old, savedAt: at.toISOString() }), at);
    expect(read?.draft.exercise).toMatchObject({ sets: 3, plannedSets: 2 });
    expect(lapsPlanned(read!.draft)).toBe(3);
    expect(lapRemovable(read!.draft)).toBe(true);
    expect(lapsPlanned(withLapRemoved(read!.draft))).toBe(2);
  });

  it("remembers a circuit's laps after the tally leaves it, and an Undo puts a removed one back", () => {
    const removed = withLapRemoved(withLapLogged(circuit("moves", 40), 40));
    const left = withExerciseDone(removed, at);
    expect(lapsPlannedFor(left, 1, 2)).toBe(1);
    expect(lapsPlannedFor(left, 5, 2)).toBe(2);
    expect(lapsPlannedFor(withLapBack(left, 1), 1, 2)).toBe(2);
    expect(withLapBack(removed, 1).exercise?.sets).toBe(2);
  });
});

describe("a circuit's laps as rows on a card the tally is not on", () => {
  it("reads each lap's share, whether it went clean, and how far it got", () => {
    expect(lapRowsOf([{ reps: 40 }, { reps: 8 }], { unit: "moves", target: 40 })).toEqual([
      { share: 1, clean: true, value: "40" },
      { share: 0.2, clean: false, value: "8/40" },
    ]);
    expect(lapRowsOf([{ onS: 120 }], { unit: "seconds", target: 240 })).toEqual([
      { share: 0.5, clean: false, value: "2:00/4:00" },
    ]);
  });
});
