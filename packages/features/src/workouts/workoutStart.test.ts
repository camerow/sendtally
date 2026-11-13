import { describe, expect, it } from "vitest";
import type { LibraryWorkout } from "./types";
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
});

describe("the player a start opens", () => {
  const hangboard = { ...climbing, id: "rep73", kind: "hangboard" } as LibraryWorkout;
  const half = { exercise: "half", dose: { sets: 6 } };

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
