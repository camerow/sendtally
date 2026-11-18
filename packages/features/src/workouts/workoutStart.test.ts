import { describe, expect, it } from "vitest";
import type { LibraryWorkout } from "./types";
import { builtInWorkouts } from "./builtIns";
import { playerRoute, workoutStart } from "./workoutStart";

const climbing = {
  id: "w-arc",
  kind: "climbing",
  name: "ARC laps",
  minutes: 60,
  exerciseRestS: 0,
} as LibraryWorkout;

const PLAN = { membershipId: null, week: null, focus: null };
const arc = { exercise: "ARC", dose: { sets: 3, onS: 1200, setRestS: 180 } };
const boulders = { exercise: "Limit boulders", dose: { sets: 4, reps: 4, setRestS: 240 } };
const measure = (name: string): "wallTime" | "climbs" => (name === "ARC" ? "wallTime" : "climbs");

describe("starting a climbing workout", () => {
  it("runs climbing measured in time on the timer, a lap a set with its rest between", () => {
    const run = { link: PLAN, session: 0, items: [arc] };
    const start = workoutStart(climbing, "2026-10-30", run, () => false, measure);
    expect(start.open).toBe("intervals");
    expect(start.open === "intervals" && start.run.body).toEqual({
      rounds: 3,
      steps: [{ label: "ARC", measure: "time", seconds: 1200, restAfter: 180 }],
    });
  });

  it("keeps climbing measured in climbs on the tally", () => {
    const run = { link: PLAN, session: 0, items: [boulders, arc] };
    expect(workoutStart(climbing, "2026-10-30", run, () => false, measure).open).toBe("sets");
  });

  it("opens a mix of grips and timed exercises in the sets player, never the intervals player", () => {
    const strength = { ...climbing, kind: "strength" } as LibraryWorkout;
    const plank = { exercise: "Plank", dose: { sets: 3, onS: 60 } };
    const half = { exercise: "half", dose: { sets: 3, reps: 6, onS: 7, offS: 3 } };
    const run = { link: PLAN, session: 0, items: [half, plank] };
    expect(workoutStart(strength, "2026-10-30", run, () => false).open).toBe("sets");
    const own = { link: PLAN, session: 0, items: [{ ...half, exercise: "g-mine" }, plank] };
    expect(workoutStart(strength, "2026-10-30", own, () => false).open).toBe("intervals");
    const known = workoutStart(
      strength,
      "2026-10-30",
      own,
      () => false,
      undefined,
      (e) => e === "g-mine"
    );
    expect(known.open).toBe("sets");
  });

  it("opens the live session for the built-in Climbing day", () => {
    const day = builtInWorkouts().find((w) => w.id === "climb-session");
    const run = { link: PLAN, session: 0, items: [] };
    expect(day && workoutStart(day, "2026-10-30", run, () => false).open).toBe("liveSession");
  });
});

describe("starting a workout with no exercises", () => {
  it("opens the workout view with no cards, its description the body", () => {
    const warmUp = { ...climbing, id: "w-warm", kind: "other" } as LibraryWorkout;
    const run = { link: PLAN, session: 0, items: [] };
    const start = workoutStart(warmUp, "2026-10-30", run, () => false);
    expect(start.open).toBe("sets");
    expect(start.open === "sets" && start.run.items).toEqual([]);
    expect(playerRoute(warmUp, start, run)?.pathname).toBe("/workout/sets");
  });
});

describe("starting a workout with a checklist", () => {
  const warmUp = { ...climbing, id: "w-warm", kind: "other" } as LibraryWorkout;
  const list = { exercise: "Checklist", dose: { sets: 2 }, checklist: { lines: ["Jog", "Hang"] } };
  const plank = { exercise: "Plank", dose: { sets: 2, onS: 45 } };

  it("runs it in the workout view, alone or beside timed exercises", () => {
    for (const items of [[list], [list, plank]]) {
      const start = workoutStart(
        warmUp,
        "2026-10-30",
        { link: PLAN, session: 0, items },
        () => false
      );
      expect(start.open).toBe("sets");
    }
  });
});

describe("the player a start opens", () => {
  const hangboard = { ...climbing, id: "rep73", kind: "hangboard" } as LibraryWorkout;
  const half = { exercise: "half", dose: { sets: 6 } };

  it("still opens a hangboard workout with nothing added in the hang timer", () => {
    const run = { link: PLAN, session: 0, items: [half] };
    expect(workoutStart(hangboard, "2026-10-30", run, () => false).open).toBe("timer");
  });

  it("opens a hangboard workout in the timer on its first grip, as this session", () => {
    const run = { link: PLAN, session: 2, items: [half] };
    const start = workoutStart(hangboard, "2026-10-30", run, () => false);
    expect(playerRoute(hangboard, start, run)).toEqual({
      pathname: "/workout/timer",
      params: { workoutId: "rep73", gripId: "half", session: "2" },
    });
  });

  it("opens a timed workout in the intervals player, and climbs on the tally in the sets player", () => {
    const timed = { link: PLAN, session: 0, items: [arc] };
    const start = workoutStart(climbing, "2026-10-30", timed, () => false, measure);
    expect(playerRoute(climbing, start, timed)?.pathname).toBe("/workout/intervals");
    const tally = { link: PLAN, session: 0, items: [boulders] };
    const sets = workoutStart(climbing, "2026-10-30", tally, () => false, measure);
    expect(playerRoute(climbing, sets, tally)?.pathname).toBe("/workout/sets");
  });

  it("opens no player for the live session", () => {
    const empty = { link: PLAN, session: 0, items: [] };
    const start = workoutStart(climbing, "2026-10-30", empty, () => false);
    expect(playerRoute(climbing, start, empty)).toBeNull();
  });
});
