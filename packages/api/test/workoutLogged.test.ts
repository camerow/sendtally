import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import * as posthog from "../src/lib/posthog";
import * as repo from "../src/lib/repo";
import { testApp } from "./harness";

const FINGERPRINT = "manual-0a1b2c3d-0000-4000-8000-000000000001";
const OTHER_FINGERPRINT = "manual-0a1b2c3d-0000-4000-8000-000000000002";

const call = async (
  user: string,
  method: string,
  path: string,
  body?: unknown
): Promise<Response> =>
  testApp().request(
    path,
    {
      method,
      headers: { "x-test-user": user, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env
  );

const activity = (overrides: Record<string, unknown> = {}) => ({
  kind: "strength",
  title: "Push",
  date: "2026-11-16",
  startTime: null,
  minutes: 45,
  rpe: 7,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  ...overrides,
});

const hangSession = (overrides: Record<string, unknown> = {}) => ({
  workoutId: "rep73",
  gripId: "half",
  date: "2026-11-16",
  edgeMm: 20,
  loadKg: 4,
  pct: 83,
  misses: 0,
  rpe: 7,
  protocol: {
    name: "Repeaters 7:3",
    kind: "hang",
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 6,
    setRestS: 180,
  },
  membershipId: null,
  week: null,
  done: [],
  ...overrides,
});

const climbingSession = (overrides: Record<string, unknown> = {}) => ({
  name: "Evening session",
  date: "2026-11-16",
  startTime: "18:00",
  endTime: "20:00",
  location: "indoor",
  climbs: [{ name: "Cave problem", grade: { scale: "v", value: 4 }, kind: "send", tries: 2 }],
  ...overrides,
});

const plan = (user: string, id: string, workoutId: string): Promise<Response> =>
  call(user, "PUT", `/v1/memberships/${id}`, {
    workoutId,
    blockId: null,
    weekdays: [0],
    start: "2026-11-16",
    position: 0,
  });

let capture: MockInstance<typeof posthog.captureUserEvent>;
beforeEach(() => {
  capture = vi.spyOn(posthog, "captureUserEvent").mockResolvedValue();
});
afterEach(() => capture.mockRestore());

/** The workout_logged events captured so far, as [distinct id, properties]. */
const logged = (): unknown[] =>
  capture.mock.calls
    .filter(([, , event]) => event === "workout_logged")
    .map(([, id, , properties]) => [id, properties]);

describe("workout_logged", () => {
  it("fires for a planned built-in climbing day logged as a live session, once", async () => {
    const user = "user_wl_session";
    expect((await plan(user, "m1", "climb-4x4")).status).toBe(200);
    const created = await call(
      user,
      "POST",
      "/v1/sessions",
      climbingSession({ fingerprint: FINGERPRINT, membershipId: "m1" })
    );
    expect(created.status).toBe(201);
    const edited = await call(
      user,
      "PUT",
      `/v1/sessions/${FINGERPRINT}`,
      climbingSession({ name: "Renamed", membershipId: "m1" })
    );
    expect(edited.status).toBe(200);
    expect(logged()).toEqual([[user, { built_in: true, planned: true }]]);
  });

  it("does not count a climbing session with no plan as a workout", async () => {
    const res = await call("user_wl_free", "POST", "/v1/sessions", climbingSession());
    expect(res.status).toBe(201);
    expect(logged()).toEqual([]);
  });

  it("fires for a planned custom workout logged as an activity, not on its edit or delete", async () => {
    const user = "user_wl_activity";
    const workout = {
      kind: "strength",
      name: "My push day",
      description: "",
      minutes: 45,
      targetRpe: null,
      items: [{ exercise: "Push-ups", doses: [{ sets: 3, reps: 15 }] }],
      exerciseRestS: 90,
    };
    expect((await call(user, "PUT", "/v1/workouts/w1", workout)).status).toBe(200);
    expect((await plan(user, "m1", "w1")).status).toBe(200);
    const body = activity({ workoutId: "w1", membershipId: "m1" });
    expect((await call(user, "PUT", "/v1/activities/a1", body)).status).toBe(200);
    expect((await call(user, "PUT", "/v1/activities/a1", { ...body, rpe: 8 })).status).toBe(200);
    expect((await call(user, "DELETE", "/v1/activities/a1")).status).toBe(200);
    expect(logged()).toEqual([[user, { built_in: false, planned: true }]]);
  });

  it("fires for an unplanned built-in hang session, and records nothing for a free-form activity", async () => {
    const user = "user_wl_hang";
    expect((await call(user, "PUT", "/v1/hang/sessions/h1", hangSession())).status).toBe(200);
    expect((await call(user, "PUT", "/v1/hang/sessions/h1", hangSession({ rpe: 8 }))).status).toBe(
      200
    );
    expect((await call(user, "PUT", "/v1/activities/free", activity())).status).toBe(200);
    expect(logged()).toEqual([[user, { built_in: true, planned: false }]]);
  });
});

describe("workout_logged never fails a write", () => {
  it("saves a planned climbing session even when the plan lookup fails", async () => {
    const user = "user_wl_lookup_fails";
    expect((await plan(user, "m1", "climb-4x4")).status).toBe(200);
    const lookup = vi.spyOn(repo, "getMembership").mockRejectedValue(new Error("D1 down"));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const res = await call(
        user,
        "POST",
        "/v1/sessions",
        climbingSession({ fingerprint: OTHER_FINGERPRINT, membershipId: "m1" })
      );
      expect(res.status).toBe(201);
      expect(lookup).toHaveBeenCalled();
      expect(logged()).toEqual([]);
      const saved = await call(user, "GET", `/v1/sessions/${OTHER_FINGERPRINT}`);
      expect(saved.status).toBe(200);
    } finally {
      lookup.mockRestore();
      quiet.mockRestore();
    }
  });
});
