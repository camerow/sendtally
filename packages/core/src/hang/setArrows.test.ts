import { describe, expect, it } from "vitest";
import {
  cameOffEarly,
  currentPhase,
  hasNextSet,
  nextSet,
  previousSet,
  startRun,
  tick,
  type Protocol,
} from ".";

const repeaters: Protocol = {
  name: "Repeaters",
  kind: "hang",
  hangS: 10,
  restS: 5,
  reps: 2,
  sets: 3,
  setRestS: 60,
};

// Get ready 5, then each set: hang 10, rest 5, hang 10, and a set rest of 60 between sets.
const SET_S = 10 + 5 + 10 + 60;

describe("moving a whole set", () => {
  it("skips to the rest before the next set, from there into it, and none past the last", () => {
    const run = tick(startRun(repeaters, 0), 6_000);
    const next = nextSet(run, 6_000);
    expect(currentPhase(next)).toMatchObject({ kind: "setrest", set: 1 });
    expect(next.misses).toBe(2);
    expect(currentPhase(nextSet(next, 6_000))).toMatchObject({ kind: "hang", set: 2, rep: 1 });
    expect(hasNextSet(run)).toBe(true);
    const last = tick(run, (5 + 2 * SET_S + 1) * 1000);
    expect(currentPhase(last)).toMatchObject({ kind: "hang", set: 3 });
    expect(hasNextSet(last)).toBe(false);
  });

  it("replays the set under way from its lead-in rest, taking back what it logged", () => {
    const into = tick(startRun(repeaters, 0), (5 + SET_S + 18) * 1000);
    expect(currentPhase(into)).toMatchObject({ kind: "hang", set: 2, rep: 2 });
    const cut = cameOffEarly(into, (5 + SET_S + 20) * 1000);
    expect(cut.done).toHaveLength(4);

    const replay = previousSet(cut, 200_000);
    expect(currentPhase(replay)).toMatchObject({ kind: "setrest", set: 1 });
    expect(replay.done).toHaveLength(2);
    expect(replay.work).toBe(20);
    expect(replay.misses).toBe(0);
    expect(replay.phaseStartedAt).toBe(200_000);
  });

  it("goes back to the set before when this one has not begun", () => {
    const start = tick(startRun(repeaters, 0), (5 + SET_S + 1) * 1000);
    expect(currentPhase(start)).toMatchObject({ kind: "hang", set: 2, rep: 1 });
    const back = previousSet(previousSet(start, 0), 0);
    expect(currentPhase(back)).toMatchObject({ kind: "ready", set: 1 });
    expect(back.done).toEqual([]);
  });
});
