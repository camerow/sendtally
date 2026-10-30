import { describe, expect, it } from "vitest";
import {
  cameOffEarly,
  intervalPhases,
  intervalSeconds,
  logLift,
  skip,
  startIntervalsRun,
  stepsDone,
  tick,
  type Intervals,
} from ".";

const flow: Intervals = {
  rounds: 2,
  steps: [
    { label: "90/90", measure: "time", seconds: 60, restAfter: 10 },
    { label: "Couch stretch", measure: "time", seconds: 45, side: "each", restAfter: 0 },
    { label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 30 },
  ],
};

describe("intervals", () => {
  it("plays each side of a step in turn, rests after it, and waits for a tap on a count", () => {
    const phases = intervalPhases(flow);
    expect(phases.map((p) => [p.kind, p.step, p.side ?? "", p.seconds, p.taps])).toEqual([
      ["ready", 0, "", 5, 0],
      ["hang", 0, "", 60, 0],
      ["rest", 0, "", 10, 0],
      ["hang", 1, "L", 45, 0],
      ["hang", 1, "R", 45, 0],
      ["pull", 2, "", 45, 1],
      ["setrest", 2, "", 30, 0],
      ["hang", 0, "", 60, 0],
      ["rest", 0, "", 10, 0],
      ["hang", 1, "L", 45, 0],
      ["hang", 1, "R", 45, 0],
      ["pull", 2, "", 45, 1],
    ]);
    expect(phases.at(-1)?.set).toBe(2);
    expect(intervalSeconds(flow)).toBe(2 * (60 + 10 + 45 + 45 + 45) + 30);
  });

  it("records the steps finished and the seconds held on one cut short", () => {
    let run = tick(startIntervalsRun(flow, 0), (5 + 60 + 10 + 45) * 1000);
    expect(run.phases[run.index]?.side).toBe("R");
    run = cameOffEarly(run, (5 + 60 + 10 + 45 + 20.5) * 1000);
    expect(run.phases[run.index]?.kind).toBe("pull");
    run = logLift(run, true, 200_000);
    run = tick(run, 230_000);
    run = skip(run, 231_000);
    expect(stepsDone(run)).toEqual([
      { round: 0, step: 0 },
      { round: 0, step: 1, side: "L" },
      { round: 0, step: 1, side: "R", heldSeconds: 20 },
      { round: 0, step: 2 },
    ]);
  });

  it("finishes on the last step's tap with no rest after it", () => {
    const one: Intervals = {
      rounds: 1,
      steps: [{ label: "Push-up", measure: "count", count: 10, restAfter: 60 }],
    };
    let run = tick(startIntervalsRun(one, 0), 5000);
    run = logLift(run, true, 30_000);
    expect(run.finished).toEqual({ ended: false, at: 30_000 });
  });
});
