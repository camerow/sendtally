import { describe, expect, it } from "vitest";
import {
  allLapsDone,
  lapElapsed,
  lapSets,
  lapsDone,
  lapsPlanned,
  withLapBack,
  lapRemovable,
  withLapChanged,
  withLapUnlogged,
  withLapLogged,
  withLapRemoved,
  withLapStarted,
} from "./exerciseLaps";
import { parseStoredDraft } from "./draftStore";
import { setsPlannedFor, startExercise, withExerciseDone, withSetAdded } from "./exerciseTally";
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
    const more = withSetAdded(two);
    expect(allLapsDone(more)).toBe(false);
    expect(lapsPlanned(more)).toBe(3);
  });

  it("takes back any lap that holds nothing yet, down to one", () => {
    const one = withLapLogged(circuit("moves", 40), 40);
    expect(lapRemovable(one)).toBe(true);
    const three = withSetAdded(withSetAdded(one));
    expect(lapsPlanned(three)).toBe(4);
    const back = withLapRemoved(withLapRemoved(withLapRemoved(three)));
    expect(allLapsDone(back)).toBe(true);
    expect(lapRemovable(back)).toBe(false);
    expect(withLapRemoved(back)).toBe(back);
    const empty = circuit("moves", 40);
    expect(lapRemovable(withLapRemoved(empty))).toBe(false);

    const full = withLapLogged(
      withLapLogged(withSetAdded(withLapLogged(circuit("moves", 40), 40)), 40),
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
    const added = withSetAdded(withLapLogged(circuit("moves", 40), 40));
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
    expect(setsPlannedFor(left, 1, 2)).toBe(1);
    expect(setsPlannedFor(left, 5, 2)).toBe(2);
    expect(setsPlannedFor(withLapBack(left, 1), 1, 2)).toBe(2);
    expect(withLapBack(removed, 1).exercise?.sets).toBe(2);
  });

  it("changes a logged lap's moves, and takes its tick off with the laps after it moving up", () => {
    const two = withLapLogged(withLapLogged(circuit("moves", 40), 40), 28);
    expect(lapsDone(withLapChanged(two, 1, 0, 33))).toEqual([33, 28]);
    expect(lapsDone(withLapChanged(two, 1, 1, 99))).toEqual([40, 40]);
    expect(lapsDone(withLapUnlogged(two, 1, 0))).toEqual([28]);
  });

  it("keeps a timed lap's clock running while the tally is on another card", () => {
    const lap = {
      item: 1,
      name: "Circuit laps",
      sets: 2,
      restS: 0,
      lap: { unit: "seconds" as const, target: 240 },
    };
    const started = withLapStarted(startExercise(null, lap, at), at);
    const away = startExercise(
      started,
      { item: 0, name: "4x4s", sets: 1, climbs: 4, restS: 0 },
      at
    );
    expect(away.lapStartedAt).toEqual({ 1: at.toISOString() });
    const back = startExercise(away, lap, new Date(at.getTime() + 60_000));
    expect(lapElapsed(back.exercise!, new Date(at.getTime() + 95_000))).toBe(95);
    expect(back.lapStartedAt).toEqual({});
  });
});
