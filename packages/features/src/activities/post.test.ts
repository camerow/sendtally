import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "@sendtally/api-client";
import { activityPostVM } from "./post";

const activity: ActivityRecord = {
  id: "a1",
  kind: "strength",
  title: "Leg day",
  date: "2026-10-01",
  startTime: null,
  minutes: 50,
  rpe: 7,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  done: [],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
};

const connected = { connected: true, active: true, since: null };

describe("activityPostVM", () => {
  it("offers a post when Strava is connected and nothing was posted", () => {
    expect(activityPostVM(activity, connected)).toMatchObject({ kind: "off", action: "post" });
    expect(activityPostVM(activity, null)).toMatchObject({ kind: "off", action: null });
  });

  it("offers a retry with the error after a failed post", () => {
    const failed = { ...activity, postState: "failed", postError: "rate limit" } as const;
    expect(activityPostVM(failed, connected)).toMatchObject({
      kind: "failed",
      detail: "rate limit",
      alert: true,
      action: "retry",
    });
  });

  it("shows a posted activity with its day and no action", () => {
    const posted = { ...activity, stravaActivityId: "1", postedAt: "2026-10-02T08:00:00Z" };
    expect(activityPostVM(posted, connected)).toMatchObject({
      kind: "posted",
      label: "On Strava · posted Oct 2",
      action: null,
    });
  });
});
