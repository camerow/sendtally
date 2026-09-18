import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { invalidateAfterWrite, writeEffect } from "./invalidate";

describe("writeEffect", () => {
  it("stales the log for a session write, and not the account reads", () => {
    const effect = writeEffect({ method: "PUT", path: "/v1/sessions/manual-1/tags" });
    expect(effect?.stale).toContainEqual(["session"]);
    expect(effect?.stale).not.toContainEqual(["status"]);
    expect(effect?.gone).toBeNull();
  });

  it("names the deleted row only for a delete of the row itself", () => {
    expect(writeEffect({ method: "DELETE", path: "/v1/sessions/manual-1" })?.gone).toEqual([
      "session",
      "manual-1",
    ]);
    expect(writeEffect({ method: "DELETE", path: "/v1/projects/moonlight" })?.gone).toBeNull();
    expect(writeEffect({ method: "DELETE", path: "/v1/entries/e1" })?.gone).toEqual([
      "entry",
      "e1",
    ]);
  });

  it("stales gyms and the sessions that name them for a gym write", () => {
    expect(writeEffect({ method: "DELETE", path: "/v1/gyms/g1" })?.stale).toEqual([
      ["gyms"],
      ["sessions"],
      ["sessionsWithClimbs"],
      ["session"],
    ]);
  });

  it("stales area and climb pages for an Areas write, and not the log", () => {
    expect(writeEffect({ method: "POST", path: "/v1/area-climbs" })?.stale).toEqual([
      ["area"],
      ["areaClimb"],
      ["areaSearch"],
      ["areaClimbSearch"],
    ]);
    expect(writeEffect({ method: "PUT", path: "/v1/areas/a1/draft" })?.stale).not.toContainEqual([
      "sessions",
    ]);
  });

  it("maps settings writes to status and account deletion to nothing", () => {
    expect(writeEffect({ method: "PUT", path: "/v1/preferences/grade-scales" })?.stale).toEqual([
      ["status"],
    ]);
    expect(writeEffect({ method: "DELETE", path: "/v1/account" })?.stale).toEqual([]);
  });

  it("does not guess at a path it does not know", () => {
    expect(writeEffect({ method: "POST", path: "/v1/something-new" })).toBeNull();
    expect(writeEffect({ method: "POST", path: "/webhooks/clerk" })).toBeNull();
  });
});

describe("invalidateAfterWrite", () => {
  function seeded(): QueryClient {
    const client = new QueryClient();
    for (const key of [
      ["sessions"],
      ["session", "manual-1"],
      ["session", "manual-2"],
      ["status"],
    ]) {
      client.setQueryData(key, []);
    }
    return client;
  }
  const invalidated = (client: QueryClient, key: string[]): boolean | undefined =>
    client.getQueryState(key)?.isInvalidated;

  it("stales what the write touched and leaves the rest fresh", async () => {
    const client = seeded();
    await invalidateAfterWrite(client, { method: "PUT", path: "/v1/sessions/manual-1/tags" });
    expect(invalidated(client, ["sessions"])).toBe(true);
    expect(invalidated(client, ["session", "manual-2"])).toBe(true);
    expect(invalidated(client, ["status"])).toBe(false);
  });

  it("stales everything for an unknown write", async () => {
    const client = seeded();
    await invalidateAfterWrite(client, { method: "POST", path: "/v1/something-new" });
    expect(invalidated(client, ["status"])).toBe(true);
  });

  it("refetches what is on screen except the row a delete removed", async () => {
    const client = new QueryClient();
    const fetches: Record<string, number> = {};
    const watch = (key: string[]): (() => void) =>
      new QueryObserver(client, {
        queryKey: key,
        queryFn: () => {
          fetches[key.join("/")] = (fetches[key.join("/")] ?? 0) + 1;
          return [];
        },
      }).subscribe(() => undefined);
    const unwatch = [watch(["sessions"]), watch(["session", "manual-1"])];
    await vi.waitFor(() => expect(client.isFetching()).toBe(0));
    expect(fetches).toEqual({ sessions: 1, "session/manual-1": 1 });

    await invalidateAfterWrite(client, { method: "DELETE", path: "/v1/sessions/manual-1" });

    expect(fetches).toEqual({ sessions: 2, "session/manual-1": 1 });
    expect(invalidated(client, ["session", "manual-1"])).toBe(true);
    unwatch.forEach((stop) => stop());
  });
});
