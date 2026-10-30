import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { router } from "expo-router";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { startLibraryWorkout } from "./startLibraryWorkout";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

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
const pushed = (): { pathname: string; params: Record<string, string> } =>
  jest.mocked(router.push).mock.calls.at(-1)?.[0] as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("starting a climbing workout", () => {
  it("runs climbing measured in time on the timer, a lap a set with its rest between", () => {
    const run = { link: PLAN, session: 0, items: [arc] };
    startLibraryWorkout(climbing, "2026-10-30", run, () => false, measure);
    expect(pushed().pathname).toBe("/workout/intervals");
    expect(JSON.parse(pushed().params.body ?? "")).toEqual({
      rounds: 3,
      steps: [{ label: "ARC", measure: "time", seconds: 1200, restAfter: 180 }],
    });
  });

  it("keeps climbing measured in climbs on the tally", () => {
    const run = { link: PLAN, session: 0, items: [boulders, arc] };
    startLibraryWorkout(climbing, "2026-10-30", run, () => false, measure);
    expect(pushed().pathname).toBe("/workout/sets");
  });
});
