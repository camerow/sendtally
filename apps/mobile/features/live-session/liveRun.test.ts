import { describe, expect, it } from "@jest/globals";
import type { LiveRun } from "@sendtally/features/workouts";
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

  it("opens any other run where it ran", () => {
    expect(liveRunHref(run("/workout/timer"))).toMatchObject({ pathname: "/workout/timer" });
  });
});
