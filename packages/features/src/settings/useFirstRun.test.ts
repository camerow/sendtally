import { describe, expect, it } from "vitest";
import { firstRunShows } from "./useFirstRun";

describe("firstRunShows", () => {
  it("follows the status once there is one, cached or fetched", () => {
    expect(firstRunShows({ firstRun: true }, 0, "idle")).toBe(true);
    expect(firstRunShows({ firstRun: false }, 0, "fetching")).toBe(false);
  });

  it("reads a server without the field as not showing", () => {
    expect(firstRunShows({} as { firstRun: boolean }, 0, "idle")).toBe(false);
  });

  it("waits only on the first fetch of an account with nothing cached", () => {
    expect(firstRunShows(undefined, 0, "fetching")).toBeNull();
  });

  it("never waits on a failed fetch while it retries, or one paused offline", () => {
    expect(firstRunShows(undefined, 1, "fetching")).toBe(false);
    expect(firstRunShows(undefined, 0, "paused")).toBe(false);
  });
});
