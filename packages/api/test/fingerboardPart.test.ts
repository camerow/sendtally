import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import type { Protocol } from "@sendtally/core/hang";
import { describe, expect, it } from "vitest";
import type { ActivityRecord } from "../src/lib/activities";
import { encryptSecret } from "../src/lib/crypto";
import type { HangData, HangPart } from "../src/lib/hang";
import { jsonResponse, makeFakeFetch } from "./fakes";
import { testApp } from "./harness";

const repeaters: Protocol = {
  name: "Repeaters 7:3",
  kind: "hang",
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 2,
  setRestS: 120,
};

const run = {
  kind: "strength",
  title: "Pull day",
  date: "2026-11-16",
  startTime: "18:00",
  minutes: 60,
  rpe: 7,
  notes: null,
  workoutId: "w1",
  membershipId: null,
  week: null,
  focus: null,
  done: [{ item: 0, exercise: "Pull-ups", sets: [{ reps: 8 }] }],
};

const fingerboard = {
  gripId: "half",
  edgeMm: 20,
  loadKg: 4,
  pct: 100,
  misses: 0,
  protocol: repeaters,
  done: [
    {
      item: 0,
      exercise: "half",
      sets: [
        { reps: 6, onS: 7 },
        { reps: 6, onS: 7, rpe: 8 },
      ],
    },
    {
      item: 1,
      exercise: "pinch",
      sets: [{ reps: 5, onS: 10, weightKg: 0 }],
      dose: { sets: 1, reps: 5, onS: 10 },
    },
  ],
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
    path,
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

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

const hang = async (userId: string): Promise<HangData> =>
  json<HangData>(await call(userId, "GET", "/v1/hang"));

const save = async (
  userId: string,
  body: object
): Promise<{ activity: ActivityRecord; part: HangPart | null }> =>
  json(await call(userId, "PUT", "/v1/activities/a1", body));

describe("a workout's fingerboard part", () => {
  it("saves with its run in one request, taking the run's date, workout, link and effort", async () => {
    const userId = "user_part_save";
    const { part } = await save(userId, { ...run, fingerboard });
    expect(part).toMatchObject({
      activityId: "a1",
      workoutId: "w1",
      gripId: "half",
      date: "2026-11-16",
      rpe: 7,
      edgeMm: 20,
      loadKg: 4,
      done: fingerboard.done,
    });
    const data = await hang(userId);
    expect(data.sessions).toEqual([]);
    expect(data.parts).toEqual([part]);
  });

  it("keeps its id when the same save replays, and one part per run", async () => {
    const userId = "user_part_replay";
    const first = await save(userId, { ...run, fingerboard });
    const again = await save(userId, { ...run, fingerboard: { ...fingerboard, pct: 50 } });
    expect(again.part?.id).toBe(first.part?.id);
    expect((await hang(userId)).parts.map((p) => [p.id, p.pct])).toEqual([[first.part?.id, 50]]);
  });

  it("follows its run when an older build saves the run without it, and goes on null", async () => {
    const userId = "user_part_follow";
    await save(userId, { ...run, fingerboard });
    const moved = await save(userId, { ...run, date: "2026-11-17", rpe: 9 });
    expect(moved.part).toMatchObject({ date: "2026-11-17", rpe: 9, pct: 100, gripId: "half" });
    const unlinked = await save(userId, { ...run, workoutId: null });
    expect(unlinked.part?.workoutId).toBe("");
    const removed = await save(userId, { ...run, fingerboard: null });
    expect(removed.part).toBeNull();
    expect((await hang(userId)).parts).toEqual([]);
  });

  it("goes with its run when the run is deleted", async () => {
    const userId = "user_part_delete";
    await save(userId, { ...run, fingerboard });
    await call(userId, "DELETE", "/v1/activities/a1");
    expect((await hang(userId)).parts).toEqual([]);
  });

  it("needs its run's workout", async () => {
    const res = await call("user_part_no_workout", "PUT", "/v1/activities/a1", {
      ...run,
      workoutId: null,
      fingerboard,
    });
    expect(res.status).toBe(400);
  });

  it("changes only through its run, and lists apart from the history's own sessions", async () => {
    const userId = "user_part_doors";
    const { part } = await save(userId, { ...run, fingerboard });
    const id = part?.id ?? "";
    const session = {
      workoutId: "w1",
      date: "2026-11-16",
      rpe: 7,
      membershipId: null,
      week: null,
      ...fingerboard,
    };
    expect((await call(userId, "PUT", `/v1/hang/sessions/${id}`, session)).status).toBe(409);
    expect((await call(userId, "DELETE", `/v1/hang/sessions/${id}`)).status).toBe(409);
    expect((await call(userId, "POST", `/v1/hang/sessions/${id}/strava`)).status).toBe(409);
    const history = await json<{
      hangSessions: unknown[];
      hangParts: { id: string; activityId: string }[];
    }>(await call(userId, "GET", "/v1/sessions"));
    expect(history.hangSessions).toEqual([]);
    expect(history.hangParts.map((p) => [p.id, p.activityId])).toEqual([[id, "a1"]]);
    expect((await hang(userId)).parts).toHaveLength(1);
  });

  it("rides in its run's Strava description, one line per grip", async () => {
    const userId = "user_part_strava";
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, timezone, created_at) VALUES (?, 'UTC', '')`
    )
      .bind(userId)
      .run();
    await env.DB.prepare(
      `INSERT INTO strava_connections
         (user_id, athlete_id, access_token_ciphertext, refresh_token_ciphertext, expires_at,
          status, connected_at, posting_enabled, post_training)
       VALUES (?, 999, ?, ?, ?, 'active', '', 1, 1)`
    )
      .bind(
        userId,
        await encryptSecret("access-tok", env.TOKEN_KEY),
        await encryptSecret("refresh-tok", env.TOKEN_KEY),
        Math.floor(Date.now() / 1000) + 86_400
      )
      .run();
    await call(userId, "PUT", "/v1/hang/settings", { units: "kg" });
    const { fetchImpl, calls } = makeFakeFetch([
      {
        match: (url, method) => url.endsWith("/api/v3/activities") && method === "POST",
        respond: () => jsonResponse(201, { id: 717171 }),
      },
    ]);
    await call(userId, "PUT", "/v1/activities/a1", { ...run, fingerboard }, fetchImpl);
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(1);
    expect(new URLSearchParams(posts[0]?.body ?? "").get("description")).toBe(
      [
        "RPE 7/10",
        "created by https://sendtally.com",
        "Pull-ups 8",
        "Half crimp · 2 sets × 6 hangs · 7 s on, 3 s off · 2 min between sets · 20 mm edge · Load +4 kg",
        "Pinch · 1 set × 5 hangs · 10 s on",
      ].join("\n")
    );
  });

  it("never renames a grip when an exercise of the same text is renamed", async () => {
    const userId = "user_part_rename";
    const hangDose = { doses: [{ sets: 2, reps: 6, onS: 7, offS: 3 }] };
    await call(userId, "PUT", "/v1/workouts/w1", {
      name: "Pull day",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        { exercise: "Half", doses: [{ sets: 3, reps: 5 }] },
        { exercise: "half", ...hangDose },
      ],
    });
    const { exercises } = await json<{ exercises: { id: string; name: string }[] }>(
      await call(userId, "GET", "/v1/exercises")
    );
    const half = exercises.find((e) => e.name === "Half");
    await call(userId, "PUT", `/v1/exercises/${half?.id ?? ""}`, {
      name: "Half rows",
      kind: "strength",
    });
    const { workouts } = await json<{ workouts: { items: { exercise: string }[] }[] }>(
      await call(userId, "GET", "/v1/workouts")
    );
    expect(workouts[0]?.items.map((i) => i.exercise)).toEqual(["Half rows", "half"]);
  });
});
