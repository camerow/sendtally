import { describe, expect, it } from "vitest";
import {
  logLift,
  skip,
  startIntervalsRun,
  startWorkoutRun,
  tick,
  togglePause,
  type HangWorkout,
  type Intervals,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setupLabel } from "../hang/format";
import { t } from "../i18n";
import { intervalsView } from "./intervalsView";
import { progressMove } from "./progressMove";
import type { PlannedRun } from "./usePlannedRun";
import { phaseCue, ticks } from "./timerCues";
import { forToday, hangRunDone, timerView } from "./timerView";

const units = { hangS: "s", restS: "s", setRestS: "s" } as const;
const repeaters: HangWorkout = {
  id: "w1",
  source: "library",
  grip: "half-crimp",
  timeUnits: units,
  name: "Repeaters",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 2,
  sets: 2,
  setRestS: 60,
};
const lifts: HangWorkout = { ...repeaters, id: "w2", kind: "pull", hangS: 0, reps: 3, sets: 1 };
const planned: PlannedRun = { items: [{ workout: repeaters, dose: undefined }], exerciseRestS: 0 };
const items = {
  planned,
  grips: ["half-crimp"],
  setups: [{ edgeMm: 20, loadKg: 5 }],
  unit: "kg",
} as const;
const at0 = 1_000_000;
const hanging = tick(startWorkoutRun([repeaters], 0, at0), at0 + 5_000);

describe("timerView", () => {
  it("reads Get ready on a white fill, with nothing to fail before the first hang", () => {
    const view = timerView(startWorkoutRun([repeaters], 0, at0), 5, items);
    expect(view.look.fill).toBe(colors.white);
    expect(view.primary).toBe(t("hang.pause"));
    expect(view.fail).toBeNull();
    expect(view.working).toBe(false);
  });

  it("offers Came off early while a hang runs, and nothing once paused", () => {
    const view = timerView(hanging, 5, items);
    expect(view.working).toBe(true);
    expect(view.current).toBe(repeaters);
    expect(view.gripId).toBe("half-crimp");
    expect(view.setup).toBe(setupLabel("hang", { edgeMm: 20, loadKg: 5 }, "kg"));
    expect(view.fail).toBe(t("hang.cameOffEarly", { n: 2 }));
    const paused = timerView(togglePause(hanging, at0 + 6_000), 5, items);
    expect(paused.fail).toBeNull();
    expect(paused.primary).toBe(t("hang.resume"));
    expect(paused.ring).toBe(t("hang.resume"));
  });

  it("logs a lift on a pull, and offers Missed lift", () => {
    const pull = tick(startWorkoutRun([lifts], 0, at0), at0 + 5_000);
    const view = timerView(pull, 0, {
      planned: { items: [{ workout: lifts, dose: undefined }], exerciseRestS: 0 },
      grips: ["bar"],
      setups: [{ edgeMm: 0, loadKg: 20 }],
      unit: "kg",
    });
    expect(view.primary).toBe(t("hang.lifted"));
    expect(view.ring).toBe(t("hang.logLift"));
    expect(view.fail).toBe(t("hang.missedLift"));
  });
});

describe("progressMove", () => {
  it("runs a timed phase linearly to 1 over what is left", () => {
    expect(progressMove(hanging, at0 + 5_000 + 3_500)).toEqual({
      from: 0.5,
      to: 1,
      ms: 3_500,
    });
  });

  it("holds still while paused", () => {
    const paused = togglePause(hanging, at0 + 5_000 + 3_500);
    expect(progressMove(paused, at0 + 20_000)).toEqual({
      from: 0.5,
      to: 0.5,
      ms: 0,
    });
  });

  it("eases a lift from wherever it is to the share of taps", () => {
    const pull = tick(startWorkoutRun([lifts], 0, at0), at0 + 5_000);
    const one = logLift(pull, true, at0 + 6_000);
    expect(progressMove(one, at0 + 6_000)).toEqual({
      from: null,
      to: 1 / 3,
      ms: 260,
    });
  });
});

describe("timer cues", () => {
  it("tones each phase change after the first, by whether it works", () => {
    expect(phaseCue(0, false, "ready")).toBeNull();
    expect(phaseCue(1, false, "hang")).toBe("work");
    expect(phaseCue(2, false, "rest")).toBe("rest");
    expect(phaseCue(3, true, "hang")).toBeNull();
  });

  it("ticks the last three seconds of a running timed phase", () => {
    expect([4, 3, 2, 1, 0].map((s) => ticks(false, 0, s))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
    expect(ticks(true, 0, 2)).toBe(false);
    expect(ticks(false, 3, 2)).toBe(false);
  });
});

describe("hangRunDone", () => {
  it("files the sets held on their grips, and marks the sets it came off", () => {
    let run = hanging;
    while (run.finished === null) run = skip(run, at0 + 10_000);
    const setup = { edgeMm: 20, loadKg: 0 };
    const done = hangRunDone(run, planned, ["half-crimp"], [setup]);
    expect(done.done).toEqual([
      {
        item: 0,
        exercise: "half-crimp",
        sets: [
          { reps: 2, onS: 7, offS: 3, setRestS: 60 },
          { reps: 2, onS: 7, offS: 3, setRestS: 60 },
        ],
      },
    ]);
    expect(done.off).toEqual(["0:0", "0:1"]);
    expect(done.setups).toEqual([setup]);
    expect(done.startedAt).toBe(at0);
  });
});

describe("forToday", () => {
  const model = {
    gripName: (id: string) => (id === "half-crimp" ? "Half crimp" : id),
    setup: () => ({ edgeMm: 20, loadKg: 5 }),
  };

  it("starts the first item on the grip the run was started on", () => {
    const today = forToday(planned, "open-hand", model, "Winter base · W4");
    expect(today.grips).toEqual(["open-hand"]);
    expect(today.entries).toEqual([
      { gripId: "open-hand", kind: "hang", planned: { edgeMm: 20, loadKg: 5 } },
    ]);
    expect(today.kicker).toBe("open-hand · Winter base · W4");
  });

  it("leaves the block out when the run is not from one", () => {
    expect(forToday(planned, "half-crimp", model, null).kicker).toBe("Half crimp");
  });
});

describe("intervalsView", () => {
  const flow: Intervals = {
    rounds: 2,
    steps: [
      { label: "Couch stretch", measure: "time", seconds: 45, restAfter: 10 },
      { label: "Swing", measure: "count", count: 15, restAfter: 0 },
    ],
  };
  const start = startIntervalsRun(flow, at0);
  const holding = tick(start, at0 + 5_000);

  it("offers Stopped early while a timed step runs, Stop here on a climb", () => {
    expect(intervalsView(holding, flow, 40, "kg", false).fail).toBe(
      t("activities.stoppedEarly", { n: 5 })
    );
    expect(intervalsView(holding, flow, 40, "kg", true).fail).toBe(
      t("activities.stopHere", { time: "0:05" })
    );
    expect(intervalsView(start, flow, 5, "kg", false).fail).toBeNull();
  });

  it("counts rounds, or laps on a climb", () => {
    expect(intervalsView(holding, flow, 40, "kg", false).round).toBe(
      t("activities.roundOf", { round: 1, rounds: 2 })
    );
    expect(intervalsView(holding, flow, 40, "kg", true).round).toBe(
      t("tally.lapOf", { set: 1, sets: 2 })
    );
  });

  it("asks Done on a counted step", () => {
    const counted = skip(skip(holding, at0 + 6_000), at0 + 7_000);
    expect(intervalsView(counted, flow, 0, "kg", false).primary).toBe(t("common.done"));
    expect(intervalsView(counted, flow, 0, "kg", false).fail).toBeNull();
  });
});
