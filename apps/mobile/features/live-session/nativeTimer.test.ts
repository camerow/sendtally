import { describe, expect, it } from "@jest/globals";
import { startIntervalsRun, startRun, tick, togglePause, logLift } from "@sendtally/core/hang";
import { restAfter } from "../training/rest/restCountdown";
import { startHold, pauseHold } from "../training/hold/holdClock";
import type { LiveRun, RunState } from "./liveRun";
import { isCounting, nativeTimerOf } from "./nativeTimer";

const T = 1_000_000;

const live = (state: RunState, extra: Partial<LiveRun> = {}): LiveRun => ({
  title: "Repeaters",
  workoutId: "w1",
  pathname: "/workout/timer",
  params: {},
  startedAt: T,
  state,
  ...extra,
});

const repeaters = startRun(
  { name: "Repeaters", kind: "hang", hangS: 7, restS: 3, reps: 2, sets: 2, setRestS: 60 },
  T
);
const sets = live({ player: "sets", done: [], ticked: [] }, { pathname: "/workout/sets" });

describe("the system timer's payload", () => {
  it("schedules a timer run with labels, cues and the finish", () => {
    const payload = nativeTimerOf(live({ player: "timer", run: repeaters }), T);
    expect(payload).toMatchObject({
      runId: String(T),
      title: "Repeaters",
      meta: "Fingers",
      muted: false,
      pausedLeftS: null,
      pausedText: "Paused",
      nextText: "Next",
      openHint: "Open sendtally",
    });
    const steps = payload?.steps ?? [];
    expect(steps.map((s) => [s.look, s.label, s.setLine])).toEqual([
      ["ready", "Get ready", "2 sets ahead"],
      ["work", "Hang", "Set 1 of 2"],
      ["rest", "Rest", "Set 1 of 2"],
      ["work", "Hang", "Set 1 of 2"],
      ["rest", "Set rest", "Set 1 of 2"],
      ["work", "Hang", "Set 2 of 2"],
      ["rest", "Rest", "Set 2 of 2"],
      ["work", "Hang", "Set 2 of 2"],
      ["done", "Done", ""],
    ]);
    expect(steps.map((s) => s.next)).toEqual([
      "Hang 7s · set 1",
      "Rest 3s",
      "Hang 7s · set 1",
      "Set rest 1:00",
      "Hang 7s · set 2",
      "Rest 3s",
      "Hang 7s · set 2",
      "Finish",
      null,
    ]);
    expect(steps[0]?.cues.map((c) => [c.at - T, c.sound])).toEqual([
      [2000, "tick"],
      [3000, "tick"],
      [4000, "tick"],
    ]);
    expect(steps[1]?.cues.map((c) => [c.at - T, c.sound])).toEqual([
      [5000, "work"],
      [9000, "tick"],
      [10000, "tick"],
      [11000, "tick"],
    ]);
    expect(steps.at(-1)).toMatchObject({
      hint: "Open to save",
      startsAt: T + 99_000,
      endsAt: null,
      runShare: 1,
      cues: [{ at: T + 99_000, sound: "finish" }],
    });
    expect(steps[5]?.runShare).toBeCloseTo(77 / 94);
  });

  it("freezes a paused run on its current step", () => {
    const run = togglePause(tick(repeaters, T + 6000), T + 6000);
    const payload = nativeTimerOf(live({ player: "timer", run, muted: true }), T + 60_000);
    expect(payload?.muted).toBe(true);
    expect(payload?.pausedLeftS).toBe(6);
    expect(payload?.pausedShare).toBeCloseTo(1 / 7);
    expect(payload?.steps).toHaveLength(1);
    expect(payload?.steps[0]).toMatchObject({ label: "Hang", endsAt: null });
  });

  it("stops at a lift that waits for a tap", () => {
    const run = startRun(
      { name: "Pulls", kind: "pull", hangS: 0, restS: 0, reps: 3, sets: 2, setRestS: 60 },
      T
    );
    const steps = nativeTimerOf(
      live({ player: "timer", run: logLift(tick(run, T + 5000), true, T + 6000) }),
      T + 6000
    )?.steps;
    expect(steps).toHaveLength(1);
    expect(steps?.[0]).toMatchObject({
      label: "Lift",
      hint: "Tap to log",
      endsAt: null,
      next: "Set rest 1:00",
    });
  });

  it("reads laps for a climbing intervals run", () => {
    const run = startIntervalsRun(
      { rounds: 3, steps: [{ label: "4x4", measure: "time", seconds: 240, restAfter: 120 }] },
      T
    );
    const payload = nativeTimerOf(
      live({ player: "timer", run, laps: true }, { pathname: "/workout/intervals" }),
      T + 6000
    );
    expect(payload?.meta).toBe("Climbing");
    expect(payload?.steps[0]).toMatchObject({ label: "Climb", setLine: "Lap 1 of 3" });
  });

  it("counts a rest down to the next set", () => {
    const rest = restAfter("0:0", 90, "Pull-ups", T);
    const payload = nativeTimerOf({ ...sets, rest: rest ?? undefined }, T + 1000);
    expect(payload?.steps.map((s) => [s.look, s.label, s.setLine, s.endsAt])).toEqual([
      ["rest", "Rest", "then Pull-ups", T + 90_000],
      ["work", "Pull-ups", "", null],
    ]);
    expect(payload?.steps[1]?.cues).toEqual([{ at: T + 90_000, sound: "work" }]);
    expect(payload?.steps.map((s) => s.next)).toEqual(["Pull-ups", null]);
    expect(nativeTimerOf({ ...sets, rest: rest ?? undefined }, T + 90_000)).toBeNull();
  });

  it("walks a two-sided hold through its count-in, sides and switch", () => {
    const hold = startHold("0:0", "Side plank", 30, true, T);
    const steps = nativeTimerOf({ ...sets, hold }, T)?.steps ?? [];
    expect(steps.map((s) => [s.look, s.label, s.setLine, s.startsAt - T])).toEqual([
      ["ready", "Get ready", "Side plank", 0],
      ["work", "Side plank", "Left", 3000],
      ["rest", "Switch", "Side plank", 33_000],
      ["work", "Side plank", "Right", 38_000],
      ["done", "Done", "Side plank", 68_000],
    ]);
    expect(steps.flatMap((s) => s.cues).map((c) => [c.at - T, c.sound])).toEqual([
      [0, "tick"],
      [1000, "tick"],
      [2000, "tick"],
      [3000, "work"],
      [33_000, "rest"],
      [38_000, "work"],
      [68_000, "rest"],
    ]);
    const paused = nativeTimerOf({ ...sets, hold: pauseHold(hold, T + 13_000) }, T + 50_000);
    expect(paused?.pausedLeftS).toBe(20);
    expect(paused?.pausedShare).toBeCloseTo(1 / 3);
    expect(paused?.steps).toEqual([expect.objectContaining({ label: "Side plank", endsAt: null })]);
  });

  it("has nothing to show without a clock", () => {
    expect(nativeTimerOf(null, T)).toBeNull();
    expect(nativeTimerOf(sets, T)).toBeNull();
  });
});

describe("counting", () => {
  it("holds while a clock runs, not while paused, waiting or over", () => {
    expect(isCounting(live({ player: "timer", run: repeaters }), T)).toBe(true);
    expect(isCounting(live({ player: "timer", run: togglePause(repeaters, T) }), T)).toBe(false);
    const rest = restAfter("0:0", 60, null, T) ?? undefined;
    expect(isCounting({ ...sets, rest }, T + 59_000)).toBe(true);
    expect(isCounting({ ...sets, rest }, T + 60_000)).toBe(false);
    expect(isCounting(sets, T)).toBe(false);
    expect(isCounting(null, T)).toBe(false);
  });
});
