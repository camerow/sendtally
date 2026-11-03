import { describe, expect, it } from "vitest";
import {
  currentPhase,
  endRun,
  logLift,
  nextSet,
  restartPhase,
  skip,
  startRun,
  tick,
  togglePause,
  upcomingPhases,
  type Protocol,
  type Run,
} from ".";

const repeaters: Protocol = {
  name: "Repeaters",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 2,
  sets: 2,
  setRestS: 60,
};
const pulls: Protocol = { ...repeaters, kind: "pull", hangS: 0, restS: 0 };

const T = 1_000_000;
const fresh = startRun(repeaters, T);

const shape = (run: Run, now: number): [string, number, number | null][] =>
  upcomingPhases(run, now).phases.map((p) => [
    p.phase.kind,
    p.startsAt - T,
    p.endsAt === null ? null : p.endsAt - T,
  ]);

describe("upcomingPhases", () => {
  it.each<[string, Run, number, [string, number, number | null][], number | null]>([
    [
      "fresh run",
      fresh,
      T,
      [
        ["ready", 0, 5000],
        ["hang", 5000, 12000],
        ["rest", 12000, 15000],
        ["hang", 15000, 22000],
        ["setrest", 22000, 82000],
        ["hang", 82000, 89000],
        ["rest", 89000, 92000],
        ["hang", 92000, 99000],
      ],
      99000,
    ],
    [
      "mid-phase, catching up first",
      fresh,
      T + 13000,
      [
        ["rest", 12000, 15000],
        ["hang", 15000, 22000],
        ["setrest", 22000, 82000],
        ["hang", 82000, 89000],
        ["rest", 89000, 92000],
        ["hang", 92000, 99000],
      ],
      99000,
    ],
    ["paused", togglePause(fresh, T + 2000), T + 9000, [["ready", 0, null]], null],
    [
      "after skip",
      skip(fresh, T + 1000),
      T + 1000,
      [
        ["hang", 1000, 8000],
        ["rest", 8000, 11000],
        ["hang", 11000, 18000],
        ["setrest", 18000, 78000],
        ["hang", 78000, 85000],
        ["rest", 85000, 88000],
        ["hang", 88000, 95000],
      ],
      95000,
    ],
    [
      "after next set",
      nextSet(tick(fresh, T + 6000), T + 6000),
      T + 6000,
      [
        ["setrest", 6000, 66000],
        ["hang", 66000, 73000],
        ["rest", 73000, 76000],
        ["hang", 76000, 83000],
      ],
      83000,
    ],
    [
      "after restart",
      restartPhase(tick(fresh, T + 14000), T + 14000),
      T + 14000,
      [
        ["rest", 14000, 17000],
        ["hang", 17000, 24000],
        ["setrest", 24000, 84000],
        ["hang", 84000, 91000],
        ["rest", 91000, 94000],
        ["hang", 94000, 101000],
      ],
      101000,
    ],
    ["finished", endRun(fresh, T + 1000), T + 1000, [], 1000],
  ])("%s", (_, run, now, phases, finishesAt) => {
    expect(shape(run, now)).toEqual(phases);
    const finish = upcomingPhases(run, now).finishesAt;
    expect(finish === null ? null : finish - T).toBe(finishesAt);
  });

  it("stops at a tapped phase", () => {
    const run = startRun(pulls, T);
    expect(shape(run, T)).toEqual([
      ["ready", 0, 5000],
      ["pull", 5000, null],
    ]);
    const after = logLift(logLift(tick(run, T + 5000), true, T + 8000), true, T + 9000);
    expect(shape(after, T + 9000)).toEqual([
      ["setrest", 9000, 69000],
      ["pull", 69000, null],
    ]);
  });

  it("caps the schedule", () => {
    expect(upcomingPhases(fresh, T, 3).phases).toHaveLength(3);
    expect(upcomingPhases(fresh, T, 3).finishesAt).toBeNull();
  });

  it("lands each boundary on the next scheduled phase, as tick would", () => {
    const { phases } = upcomingPhases(fresh, T);
    phases.slice(1).forEach((next, i) => {
      const at = tick(fresh, phases[i]?.endsAt ?? 0);
      expect(at.index).toBe(next.index);
      expect(at.phaseStartedAt).toBe(next.startsAt);
      expect(currentPhase(at)).toEqual(next.phase);
    });
  });
});
