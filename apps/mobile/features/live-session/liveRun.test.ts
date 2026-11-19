import { describe, expect, it } from "@jest/globals";
import {
  readWorkoutRun,
  runParams,
  type LiveRun,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { liveRunHref } from "./liveRun";

const run = (pathname: LiveRun["pathname"]): LiveRun => ({
  title: "Hips",
  workoutId: "w1",
  pathname,
  params: { workoutId: "w1" },
  startedAt: 0,
  state: { player: "checklist", ticked: [0], count: 2 },
});

describe("opening the live run again", () => {
  it("opens a checklist run left open from before in the sets player, ending it when asked", () => {
    expect(liveRunHref(run("/workout/checklist"))).toEqual({
      pathname: "/workout/sets",
      params: { workoutId: "w1" },
    });
    expect(liveRunHref(run("/workout/checklist"), true)).toEqual({
      pathname: "/workout/sets",
      params: { workoutId: "w1", end: "1" },
    });
  });

  it("hands the sets player a checklist run's params as the old checklist player wrote them", () => {
    const workout: WorkoutRun = {
      kind: "mobility",
      title: "Hips",
      date: "2026-11-19",
      workoutId: "w1",
      link: { membershipId: null, week: null, focus: null },
      session: 2,
      minutes: 20,
      exerciseRestS: 30,
      items: [
        { exercise: "Pigeon", dose: { sets: 1, onS: 60 } },
        { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog", "Stretch"] } },
      ],
    };
    const params = runParams(workout);
    expect(liveRunHref({ ...run("/workout/checklist"), params })).toEqual({
      pathname: "/workout/sets",
      params,
    });
    expect(readWorkoutRun(params)).toEqual(workout);
  });

  it("opens any other run where it ran", () => {
    expect(liveRunHref(run("/workout/timer"))).toMatchObject({ pathname: "/workout/timer" });
  });
});
