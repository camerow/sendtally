import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { LIBRARY, protocolOf } from "@sendtally/core/hang";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HangData, HangSessionRecord } from "../src/lib/hang";
import { encryptSecret } from "../src/lib/crypto";
import { jsonResponse, makeFakeFetch } from "./fakes";
import { testApp } from "./harness";

afterEach(() => vi.unstubAllGlobals());

const repeaters = protocolOf(LIBRARY.find((w) => w.id === "rep73")!);

const sessionBody = {
  workoutId: "rep73",
  gripId: "half",
  date: "2026-09-28",
  loadKg: 4,
  pct: 83,
  misses: 2,
  rpe: 7,
  protocol: repeaters,
};

const workoutBody = {
  name: "Short repeaters",
  kind: "hang",
  grip: "open",
  edgeMm: 18,
  hangS: 7,
  restS: 3,
  reps: 4,
  sets: 3,
  setRestS: 120,
  timeUnits: { hangS: "s", restS: "s", setRestS: "min" },
};

async function call(
  userId: string,
  method: string,
  path: string,
  body?: unknown,
  fetchImpl?: typeof fetch
): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await testApp(fetchImpl).request(
    `/v1/hang${path}`,
    {
      method,
      headers: { "x-test-user": userId, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    env,
    ctx
  );
  await waitOnExecutionContext(ctx);
  return res;
}

const read = async (userId: string): Promise<HangData> =>
  (await (await call(userId, "GET", "")).json()) as HangData;

async function connectStrava(userId: string): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`
  )
    .bind(userId)
    .run();
  await env.DB.prepare(
    `INSERT INTO strava_connections
       (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at,
        status, connected_at, posting_enabled)
     VALUES (?, 888, ?, ?, ?, 'active', '', 0)`
  )
    .bind(
      userId,
      await encryptSecret("access-tok", env.TOKEN_KEY),
      await encryptSecret("refresh-tok", env.TOKEN_KEY),
      Math.floor(Date.now() / 1000) + 86_400
    )
    .run();
}

function stravaRoutes(activityId = 515151) {
  return makeFakeFetch([
    {
      match: (url, method) => url.endsWith("/api/v3/activities") && method === "POST",
      respond: () => jsonResponse(201, { id: activityId }),
    },
    {
      match: (url, method) => url.endsWith(`/api/v3/activities/${activityId}`) && method === "PUT",
      respond: () => jsonResponse(200, { id: activityId }),
    },
  ]);
}

describe("hangtally", () => {
  it("reads defaults for a user with nothing stored", async () => {
    expect(await read("user_hang_fresh")).toEqual({
      grips: [],
      workouts: [],
      defaultGrips: {},
      loads: {},
      schedules: [],
      sessions: [],
      settings: {
        units: "kg",
        theme: "moss",
        reminders: false,
        reminderTime: "08:00",
        postToStrava: false,
        reminderPromptSeen: false,
      },
      strava: { connected: false },
    });
  });

  it("round trips every write through the read", async () => {
    const userId = "user_hang_crud";
    expect(await (await call(userId, "PUT", "/grips/g1", { name: " Wide pinch " })).json()).toEqual(
      { grip: { id: "g1", name: "Wide pinch", custom: true } }
    );
    const workout = await call(userId, "PUT", "/workouts/w1", workoutBody);
    expect(await workout.json()).toEqual({ workout: { id: "w1", source: "mine", ...workoutBody } });
    await call(userId, "PUT", "/workouts/w1", { ...workoutBody, sets: 4 });
    expect(
      await (await call(userId, "PUT", "/default-grips/rep73", { gripId: "g1" })).json()
    ).toEqual({ workoutId: "rep73", gripId: "g1" });
    await call(userId, "PUT", "/loads", { loads: { "rep73:half": 4, "w1:g1": -7.5 } });
    const loads = await call(userId, "PUT", "/loads", { loads: { "rep73:half": 5.5 } });
    expect(await loads.json()).toEqual({ loads: { "rep73:half": 5.5, "w1:g1": -7.5 } });
    const schedule = {
      workoutId: "rep73",
      gripId: "half",
      days: [0, 4],
      start: "2026-09-28",
      end: "2026-10-26",
      skip: ["2026-10-02"],
    };
    expect(await (await call(userId, "PUT", "/schedules/s1", schedule)).json()).toEqual({
      schedule: { id: "s1", ...schedule },
    });
    const logged = await call(userId, "PUT", "/sessions/h1", sessionBody);
    const { session } = (await logged.json()) as { session: HangSessionRecord };
    expect(session).toMatchObject({ id: "h1", ...sessionBody, stravaActivityId: null });
    await call(userId, "PUT", "/sessions/h1", { ...sessionBody, loadKg: 6, rpe: null });
    await call(userId, "PUT", "/settings", { units: "lb", reminderPromptSeen: true });
    const settings = await call(userId, "PUT", "/settings", { theme: "dusk" });
    expect(((await settings.json()) as { settings: { units: string } }).settings).toMatchObject({
      units: "lb",
      theme: "dusk",
      reminderPromptSeen: true,
      postToStrava: false,
    });

    const data = await read(userId);
    expect(data.grips).toEqual([{ id: "g1", name: "Wide pinch", custom: true }]);
    expect(data.workouts).toEqual([{ id: "w1", source: "mine", ...workoutBody, sets: 4 }]);
    expect(data.defaultGrips).toEqual({ rep73: "g1" });
    expect(data.schedules).toHaveLength(1);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0]).toMatchObject({ loadKg: 6, rpe: null, protocol: repeaters });

    expect(await (await call(userId, "DELETE", "/schedules/s1")).json()).toEqual({ deleted: true });
    expect(await (await call(userId, "DELETE", "/schedules/s1")).json()).toEqual({
      deleted: false,
    });
    expect(await (await call(userId, "DELETE", "/sessions/h1")).json()).toEqual({ deleted: true });
    const after = await read(userId);
    expect(after.schedules).toEqual([]);
    expect(after.sessions).toEqual([]);
  });

  it("keeps a grip name unique across built-ins and case", async () => {
    const userId = "user_hang_grips";
    expect(await (await call(userId, "PUT", "/grips/g1", { name: "HALF crimp" })).json()).toEqual({
      grip: { id: "half", name: "Half crimp", custom: false },
    });
    await call(userId, "PUT", "/grips/g2", { name: "Mono" });
    expect(await (await call(userId, "PUT", "/grips/g3", { name: " mono " })).json()).toEqual({
      grip: { id: "g2", name: "Mono", custom: true },
    });
    expect(await (await call(userId, "PUT", "/grips/g2", { name: "MONO" })).json()).toEqual({
      grip: { id: "g2", name: "MONO", custom: true },
    });
    expect((await read(userId)).grips).toEqual([{ id: "g2", name: "MONO", custom: true }]);
  });

  it.each([
    ["/grips/half", { name: "Crimpy" }],
    ["/grips/g1", { name: "x".repeat(41) }],
    ["/workouts/rep73", workoutBody],
    ["/workouts/w1", { ...workoutBody, hangS: 0 }],
    ["/workouts/w1", { ...workoutBody, edgeMm: 3 }],
    ["/workouts/w1", { ...workoutBody, reps: 51 }],
    ["/workouts/w1", { ...workoutBody, restS: 3601 }],
    ["/workouts/w1", { ...workoutBody, name: " " }],
    ["/workouts/w1", { ...workoutBody, timeUnits: { hangS: "h", restS: "s", setRestS: "s" } }],
    ["/workouts/w:1", workoutBody],
    ["/loads", { loads: { "rep73:half": 600 } }],
    ["/loads", { loads: { rep73: 4 } }],
    [
      "/schedules/s1",
      { workoutId: "a", gripId: "b", days: [], start: "2026-09-28", end: null, skip: [] },
    ],
    [
      "/schedules/s1",
      { workoutId: "a", gripId: "b", days: [0, 0], start: "2026-09-28", end: null, skip: [] },
    ],
    [
      "/schedules/s1",
      { workoutId: "a", gripId: "b", days: [7], start: "2026-09-28", end: null, skip: [] },
    ],
    [
      "/schedules/s1",
      { workoutId: "a", gripId: "b", days: [0], start: "2026-09-28", end: "2026-09-28", skip: [] },
    ],
    [
      "/schedules/s1",
      { workoutId: "a", gripId: "b", days: [0], start: "2026-02-30", end: null, skip: [] },
    ],
    ["/sessions/h1", { ...sessionBody, rpe: 11 }],
    ["/sessions/h1", { ...sessionBody, pct: 101 }],
    ["/sessions/h1", { ...sessionBody, misses: -1 }],
    ["/sessions/h1", { ...sessionBody, date: "28/09/2026" }],
    ["/sessions/h1", { ...sessionBody, protocol: { ...repeaters, hangS: 0 } }],
    ["/settings", { reminderTime: "25:00" }],
    ["/settings", { units: "stone" }],
  ])("rejects PUT %s with an invalid body", async (path, body) => {
    const res = await call("user_hang_invalid", "PUT", path, body);
    expect(res.status).toBe(400);
  });

  it("accepts a ground pull with no edge and more than 50 lifts", async () => {
    const pull = { ...workoutBody, kind: "pull", edgeMm: 0, hangS: 0, restS: 0, reps: 80 };
    const res = await call("user_hang_pull", "PUT", "/workouts/p1", pull);
    expect(res.status).toBe(200);
  });

  it("lists hang sessions beside climbing sessions, naming only custom grips", async () => {
    const userId = "user_hang_history";
    await call(userId, "PUT", "/grips/g1", { name: "Wide pinch" });
    await call(userId, "PUT", "/sessions/h1", sessionBody);
    await call(userId, "PUT", "/sessions/h2", { ...sessionBody, gripId: "g1", date: "2026-09-29" });

    for (const path of ["/v1/sessions", "/v1/sessions?include=climbs"]) {
      const res = await testApp().request(path, { headers: { "x-test-user": userId } }, env);
      const body = (await res.json()) as {
        sessions: unknown[];
        hangSessions: Array<{ id: string; gripName: string | null; rpe: number | null }>;
      };
      expect(body.sessions).toEqual([]);
      expect(body.hangSessions.map((s) => [s.id, s.gripName, s.rpe])).toEqual([
        ["h2", "Wide pinch", 7],
        ["h1", null, 7],
      ]);
    }
  });

  it("deletes every hang row with the account", async () => {
    const userId = "user_hang_purge";
    await call(userId, "PUT", "/grips/g1", { name: "Wide pinch" });
    await call(userId, "PUT", "/workouts/w1", workoutBody);
    await call(userId, "PUT", "/default-grips/w1", { gripId: "g1" });
    await call(userId, "PUT", "/loads", { loads: { "w1:g1": 3 } });
    await call(userId, "PUT", "/schedules/s1", {
      workoutId: "w1",
      gripId: "g1",
      days: [2],
      start: "2026-09-28",
      end: null,
      skip: [],
    });
    await call(userId, "PUT", "/sessions/h1", sessionBody);
    await call(userId, "PUT", "/settings", { theme: "gunmetal" });

    const res = await testApp().request(
      "/v1/account",
      { method: "DELETE", headers: { "x-test-user": userId } },
      env
    );
    expect(res.status).toBe(200);
    for (const table of [
      "hang_grips",
      "hang_workouts",
      "hang_default_grips",
      "hang_loads",
      "hang_schedules",
      "hang_sessions",
      "hang_settings",
    ]) {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`)
        .bind(userId)
        .first<{ n: number }>();
      expect(`${table}:${row?.n}`).toBe(`${table}:0`);
    }
  });
});

describe("hangtally strava posting", () => {
  it("posts a new session as a Workout when the user turned posting on", async () => {
    const userId = "user_hang_post";
    await connectStrava(userId);
    await call(userId, "PUT", "/settings", { postToStrava: true });
    const { fetchImpl, calls } = stravaRoutes();

    await call(userId, "PUT", "/sessions/h1", sessionBody, fetchImpl);

    const creates = calls.filter((c) => c.method === "POST");
    expect(creates).toHaveLength(1);
    const form = new URLSearchParams(creates[0]?.body ?? "");
    expect(form.get("sport_type")).toBe("Workout");
    expect(form.get("name")).toBe("Repeaters 7:3 · Half crimp");
    expect(form.get("start_date_local")).toBe("2026-09-28T12:00:00Z");
    expect(form.get("elapsed_time")).toBe("1242");
    expect(form.get("description")).toBe(
      [
        "RPE 7/10 · 83% complete · 2 misses",
        "created by https://sendtally.com",
        "6 sets × 6 hangs · 7 s on, 3 s off · 3 min between sets · 20 mm edge",
        "Load +4 kg",
      ].join("\n")
    );
    const [session] = (await read(userId)).sessions;
    expect(session).toMatchObject({ stravaActivityId: "515151", postState: "posted" });
  });

  it("patches the activity on edit and never posts a second one", async () => {
    const userId = "user_hang_edit";
    await connectStrava(userId);
    await call(userId, "PUT", "/grips/g1", { name: "Wide pinch" });
    await call(userId, "PUT", "/settings", { postToStrava: true, units: "lb" });
    const { fetchImpl, calls } = stravaRoutes();

    await call(userId, "PUT", "/sessions/h1", { ...sessionBody, gripId: "g1" }, fetchImpl);
    await call(
      userId,
      "PUT",
      "/sessions/h1",
      { ...sessionBody, gripId: "g1", loadKg: 0 },
      fetchImpl
    );
    await call(userId, "PUT", "/sessions/h1", { ...sessionBody, gripId: "g1", rpe: 9 }, fetchImpl);

    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
    const updates = calls.filter((c) => c.method === "PUT");
    expect(updates).toHaveLength(2);
    const first = new URLSearchParams(updates[0]?.body ?? "");
    expect(first.get("name")).toBe("Repeaters 7:3 · Wide pinch");
    expect(first.get("description")).toContain("Load bodyweight");
    expect(new URLSearchParams(updates[1]?.body ?? "").get("description")).toContain("Load +9 lb");

    expect(
      await (await call(userId, "DELETE", "/sessions/h1", undefined, fetchImpl)).json()
    ).toEqual({ deleted: true });
    expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(0);
  });

  it("does not post when posting is off, until asked for one session", async () => {
    const userId = "user_hang_off";
    await connectStrava(userId);
    const { fetchImpl, calls } = stravaRoutes();

    await call(userId, "PUT", "/sessions/h1", sessionBody, fetchImpl);
    await call(userId, "PUT", "/sessions/h1", { ...sessionBody, rpe: 8 }, fetchImpl);
    expect(calls).toHaveLength(0);
    expect((await read(userId)).strava).toEqual({ connected: true });

    const res = await call(userId, "POST", "/sessions/h1/strava", undefined, fetchImpl);
    expect(res.status).toBe(200);
    const { session } = (await res.json()) as { session: HangSessionRecord };
    expect(session).toMatchObject({ stravaActivityId: "515151", postState: "posted", rpe: 8 });
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);

    const again = await call(userId, "POST", "/sessions/h1/strava", undefined, fetchImpl);
    expect(again.status).toBe(200);
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
  });

  it("records a rate limit as a failed post that a retry can finish", async () => {
    const userId = "user_hang_rate";
    await connectStrava(userId);
    await call(userId, "PUT", "/settings", { postToStrava: true });
    const limited = makeFakeFetch([
      { match: () => true, respond: () => jsonResponse(429, { message: "Rate Limit Exceeded" }) },
    ]);

    await call(userId, "PUT", "/sessions/h1", sessionBody, limited.fetchImpl);
    expect((await read(userId)).sessions[0]).toMatchObject({
      postState: "failed",
      postError: "strava rate limit hit, not posted yet",
      stravaActivityId: null,
    });

    const { fetchImpl } = stravaRoutes();
    const res = await call(userId, "POST", "/sessions/h1/strava", undefined, fetchImpl);
    expect(res.status).toBe(200);
    expect((await read(userId)).sessions[0]).toMatchObject({ postState: "posted" });
  });

  it("404s a post for a session that does not exist", async () => {
    const res = await call("user_hang_missing", "POST", "/sessions/nope/strava");
    expect(res.status).toBe(404);
  });
});
