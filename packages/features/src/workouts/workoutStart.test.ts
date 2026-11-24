import { describe, expect, it } from "vitest";
import type { LibraryWorkout } from "./types";
import { builtInWorkouts } from "./builtIns";
import { playerRoute, workoutStart } from "./workoutStart";
import { tallyMeasuresOf } from "../exercises/measure";

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
  it("runs climbing measured in time in the sets player, each lap a set with its clock", () => {
    const run = { link: PLAN, session: 0, items: [arc] };
    const start = workoutStart(climbing, "2026-10-30", run, () => false, measure);
    expect(start.open === "sets" && start.run.items).toEqual([arc]);
    const crawls = { exercise: "Crimp crawls", dose: { sets: 1, onS: 60 } };
    const timed = { link: PLAN, session: 0, items: [crawls] };
    expect(workoutStart(climbing, "2026-10-30", timed, () => false).open).toBe("sets");
  });

  it("runs a climbing exercise timed in any workout in the sets player", () => {
    const other = { ...climbing, kind: "other" } as LibraryWorkout;
    const run = { link: PLAN, session: 0, items: [arc] };
    expect(workoutStart(other, "2026-10-30", run, () => false, measure).open).toBe("sets");
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

describe("starting an all-timed workout of another kind", () => {
  it("still plays strength or mobility measured in time in the intervals player", () => {
    const library = [
      { name: "Plank", kind: "other", measure: "seconds" },
      { name: "Pigeon", kind: "mobility", measure: "seconds" },
      { name: "Lock-offs", kind: "strength", measure: "secondsWeight" },
    ] as const;
    for (const kind of ["strength", "mobility"] as const) {
      const w = { ...climbing, kind } as LibraryWorkout;
      const items = library.map((e) => ({ exercise: e.name, dose: { sets: 2, onS: 30 } }));
      const tally = tallyMeasuresOf(library, kind, () => false);
      const start = workoutStart(
        w,
        "2026-10-30",
        { link: PLAN, session: 0, items },
        () => false,
        tally
      );
      expect(start.open).toBe("intervals");
    }
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

describe("starting a routine with no reps or weight", () => {
  it("runs it in the sets player, a card per exercise", () => {
    const mobility = { ...climbing, id: "w-hips", kind: "mobility" } as LibraryWorkout;
    const items = [
      { exercise: "Pigeon", dose: { sets: 2, onS: 60 } },
      { exercise: "Cat-cow", dose: { sets: 1 } },
    ];
    const run = { link: PLAN, session: 0, items };
    const start = workoutStart(mobility, "2026-10-30", run, () => false);
    expect(start.open).toBe("sets");
    expect(playerRoute(mobility, start, run)?.pathname).toBe("/workout/sets");
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

  it("opens a timed workout in the intervals player, and a climbing one in the sets player", () => {
    const strength = { ...climbing, kind: "strength" } as LibraryWorkout;
    const plank = {
      link: PLAN,
      session: 0,
      items: [{ exercise: "Plank", dose: { sets: 3, onS: 60 } }],
    };
    const start = workoutStart(strength, "2026-10-30", plank, () => false);
    expect(playerRoute(strength, start, plank)?.pathname).toBe("/workout/intervals");
    const timed = { link: PLAN, session: 0, items: [arc] };
    const sets = workoutStart(climbing, "2026-10-30", timed, () => false, measure);
    expect(playerRoute(climbing, sets, timed)?.pathname).toBe("/workout/sets");
  });

  it("opens no player for the live session", () => {
    const empty = { link: PLAN, session: 0, items: [] };
    const start = workoutStart(climbing, "2026-10-30", empty, () => false);
    expect(playerRoute(climbing, start, empty)).toBeNull();
  });
});
