import { describe, expect, it } from "vitest";
import { firstRunShows } from "./useFirstRun";

describe("firstRunShows", () => {
  it("follows the status once there is one, cached or fetched", () => {
    expect(firstRunShows({ firstRun: true }, "idle")).toBe(true);
    expect(firstRunShows({ firstRun: false }, "fetching")).toBe(false);
  });

  it("reads a server without the field as not showing", () => {
    expect(firstRunShows({} as { firstRun: boolean }, "idle")).toBe(false);
  });

  it("waits only while the first fetch of an account with nothing cached is in flight", () => {
    expect(firstRunShows(undefined, "fetching")).toBeNull();
  });

  it("never waits on a fetch that failed or is paused offline", () => {
    expect(firstRunShows(undefined, "idle")).toBe(false);
    expect(firstRunShows(undefined, "paused")).toBe(false);
  });
});
