import { describe, expect, it } from "vitest";
import { stravaState, type PostFields } from "./post";

const fresh: PostFields = { stravaActivityId: null, postState: null, postError: null };
const live = { connected: true, active: true, since: null };

describe("stravaState", () => {
  it("offers a post once Strava is connected and live", () => {
    expect(stravaState(fresh, live, false, null)).toEqual({ kind: "post" });
  });

  it("asks to connect first when Strava is not connected or its link died", () => {
    const off = { connected: false, active: false, since: null };
    expect(stravaState(fresh, off, false, null)).toEqual({ kind: "connect" });
    expect(stravaState(fresh, { ...live, active: false }, false, null)).toEqual({
      kind: "connect",
    });
  });

  it("knows nothing until the connection has loaded", () => {
    expect(stravaState(fresh, null, false, null)).toBeNull();
  });

  it("is posting while a request runs or the server has one pending", () => {
    expect(stravaState(fresh, live, true, null)).toEqual({ kind: "posting" });
    expect(stravaState({ ...fresh, postState: "pending" }, null, false, null)).toEqual({
      kind: "posting",
    });
  });

  it("carries Strava's reason after a failure, the request's own first", () => {
    const failed = { ...fresh, postState: "failed", postError: "rate limit" } as const;
    expect(stravaState(failed, live, false, null)).toEqual({
      kind: "failed",
      reason: "rate limit",
    });
    expect(stravaState(fresh, live, false, "HTTP 502")).toEqual({
      kind: "failed",
      reason: "HTTP 502",
    });
  });

  it("links a posted workout to its Strava activity, whatever else it says", () => {
    const posted = { ...fresh, stravaActivityId: "9", postedAt: "2026-10-28T20:42:00Z" };
    expect(stravaState(posted, null, true, null)).toEqual({
      kind: "posted",
      url: "https://www.strava.com/activities/9",
      postedAt: "2026-10-28T20:42:00Z",
    });
    expect(stravaState({ ...posted, postedAt: undefined }, live, false, null)).toMatchObject({
      postedAt: null,
    });
  });
});
